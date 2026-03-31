try:
    import face_recognition
    FACE_REC_AVAILABLE = True
except ImportError:
    FACE_REC_AVAILABLE = False
import numpy as np
import base64
import cv2
import mediapipe as mp
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional
import time

logger = logging.getLogger(__name__)

class IntruderDetector:
    def __init__(self):
        # MediaPipe Pose for behavior analysis - robust loading
        pose_module = None
        try:
            pose_module = mp.solutions.pose
        except Exception:
            try:
                import mediapipe.python.solutions.pose as p
                pose_module = p
            except Exception:
                try:
                    from mediapipe.solutions import pose as p
                    pose_module = p
                except Exception as e:
                    logger.error(f"IntruderDetector: Failed to load MediaPipe Pose: {e}")

        if pose_module:
            self.pose_detector = pose_module.Pose()
        else:
            self.pose_detector = None
            logger.error("IntruderDetector: MediaPipe Pose module NOT available.")
        
        # Thresholds
        self.FACE_MATCH_THRESHOLD = 0.6  # Lower = stricter
        self.ALERT_COOLDOWN = 300  # 5 minutes
        
        # Mock database for known faces (In prod, load from Firestore/SQL)
        # Structure: user_id -> { person_id: { encoding: [...], name: '...', relation: '...' } }
        self.known_faces_db = {} 
        self.last_sync_time = {}
        
        if not FACE_REC_AVAILABLE:
            logger.warning("IntruderDetector: face_recognition not available. Running in MOCK mode.")

    async def _sync_and_get_known_faces(self, user_id: str):
        """Sync familiar faces from Firestore every 60 seconds."""
        now = time.time()
        last_sync = self.last_sync_time.get(user_id, 0)
        
        if now - last_sync > 60:
            try:
                from app.services.data_aggregator import data_aggregator
                profile = await data_aggregator._fetch_user_profile(user_id)
                manual_members = profile.get('manualFamilyMembers', [])
                
                # Re-enroll from fresh profile
                if manual_members:
                    self.known_faces_db[user_id] = {} # Clear existing
                    for member in manual_members:
                        photo_url = member.get('photoURL')
                        if photo_url:
                            self.enroll_face(user_id, member.get('name', 'Unknown'), member.get('relation', 'Family'), photo_url)
                
                self.last_sync_time[user_id] = now
            except Exception as e:
                logger.error(f"Failed to sync family members for {user_id}: {e}")
                
        return self.known_faces_db.get(user_id, {})

    async def detect_intruder(
        self,
        user_id: str,
        image_base64: str,
        timestamp: datetime
    ) -> Dict:
        """
        Detect if unknown/suspicious person is present
        """
        # Decode image
        image = self._decode_image(image_base64)
        if image is None:
             return self._get_empty_result(timestamp)

        # 1. Detect faces using face_recognition (dlib)
        # Convert to RGB (face_recognition expects RGB)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detect locations and encodings
        if not FACE_REC_AVAILABLE:
            logger.debug("Mocking intruder detection (face_recognition unavailable)")
            return self._get_empty_result(timestamp)

        face_locations = face_recognition.face_locations(image_rgb)
        face_encodings = face_recognition.face_encodings(image_rgb, face_locations)
        
        if len(face_locations) == 0:
            return self._get_empty_result(timestamp)
            
        # 2. Compare with known faces
        known_faces = await self._sync_and_get_known_faces(user_id)
        
        unknown_faces_count = 0
        known_people_names = []
        
        for encoding in face_encodings:
            match = self._match_face(encoding, known_faces)
            if match:
                known_people_names.append(match['name'])
            else:
                unknown_faces_count += 1
                
        # 3. Behavior Analysis (if unknown person)
        suspicious_behavior = False
        behavior_type = None
        if unknown_faces_count > 0 and self.pose_detector:
            # Simple behavior check using Pose
            pose_results = self.pose_detector.process(image_rgb)
            if pose_results and pose_results.pose_landmarks:
                 # Check for "hands raised" or specific postures?
                 # For now, placeholder
                 pass 
        elif unknown_faces_count > 0:
             logger.debug("Skipping pose analysis for intruder (pose_detector not available)")
        # 4. Alert Logic
        intruder_detected = unknown_faces_count > 0
        alert_required = intruder_detected and (
            suspicious_behavior or
            self._is_unusual_time(timestamp) or
            unknown_faces_count > 1
        )
        
        alert_message = None
        if alert_required:
             alert_message = f"⚠️ ALERT: {unknown_faces_count} unknown person(s) detected. Known: {', '.join(known_people_names) if known_people_names else 'None'}."

        return {
            'intruder_detected': intruder_detected,
            'confidence': 0.95 if intruder_detected else 0.0,
            'details': {
                'num_people': len(face_locations),
                'unknown_people': unknown_faces_count,
                'known_people': known_people_names,
                'suspicious_behavior': suspicious_behavior,
            },
            'alert_required': alert_required,
            'alert_message': alert_message,
            'timestamp': timestamp.isoformat()
        }

    def enroll_face(self, user_id: str, name: str, relation: str, image_base64: str):
        """
        Add a known person
        """
        image = self._decode_image(image_base64)
        if image is None: return False
        
        if not FACE_REC_AVAILABLE:
            logger.error("Cannot enroll face: face_recognition not available.")
            return False

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(image_rgb)
        
        if len(encodings) > 0:
            if user_id not in self.known_faces_db:
                self.known_faces_db[user_id] = {}
            
            person_id = str(uuid.uuid4())
            self.known_faces_db[user_id][person_id] = {
                'encoding': encodings[0],
                'name': name,
                'relationship': relation
            }
            return True
        return False

    def _match_face(self, encoding, known_faces):
        if not known_faces:
             return None
             
        # known_faces is dict of person_id -> data
        known_encodings = [data['encoding'] for data in known_faces.values()]
        
        if not FACE_REC_AVAILABLE: return None
        
        matches = face_recognition.compare_faces(known_encodings, encoding, tolerance=self.FACE_MATCH_THRESHOLD)
        
        if True in matches:
            first_match_index = matches.index(True)
            person_id = list(known_faces.keys())[first_match_index]
            return known_faces[person_id]
            
        return None

    def _get_known_faces(self, user_id: str):
        return self.known_faces_db.get(user_id, {})

    def _is_unusual_time(self, timestamp: datetime) -> bool:
        hour = timestamp.hour
        if hour >= 22 or hour < 6:
            return True
        return False

    def _decode_image(self, image_base64: str) -> Optional[np.ndarray]:
        try:
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            nparr = np.frombuffer(base64.b64decode(image_base64), np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception:
            return None

    def _get_empty_result(self, timestamp):
        return {
            'intruder_detected': False,
            'confidence': 0.0,
            'details': {'num_people': 0},
            'alert_required': False,
            'timestamp': timestamp.isoformat()
        }

intruder_detector = IntruderDetector()
