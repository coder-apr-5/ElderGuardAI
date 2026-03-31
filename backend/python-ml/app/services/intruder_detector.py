try:
    from deepface import DeepFace
    FACE_REC_AVAILABLE = True
except ImportError:
    FACE_REC_AVAILABLE = False
import numpy as np
import base64
import cv2
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional
import time

logger = logging.getLogger(__name__)

class IntruderDetector:
    def __init__(self):
        # YOLOv8 Pose for behavior analysis - robust loading
        try:
            from ultralytics import YOLO
            self.pose_detector = YOLO('yolov8n-pose.pt')
            # Initialize with empty run to load weights
            self.pose_detector.predict(np.zeros((64, 64, 3), dtype=np.uint8), verbose=False)
        except Exception as e:
            self.pose_detector = None
            logger.error(f"IntruderDetector: YOLO Pose module NOT available: {e}")
        
        # Thresholds
        self.FACE_MATCH_THRESHOLD = 0.4  # Lower = stricter (Cosine distance)
        self.ALERT_COOLDOWN = 300  # 5 minutes
        
        # Mock database for known faces (In prod, load from Firestore/SQL)
        # Structure: user_id -> { person_id: { encoding: [...], name: '...', relation: '...' } }
        self.known_faces_db = {} 
        self.last_sync_time = {}
        
        if not FACE_REC_AVAILABLE:
            logger.warning("IntruderDetector: DeepFace not available. Running in MOCK mode.")

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

        # 1. Detect faces using DeepFace
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        if not FACE_REC_AVAILABLE:
            logger.debug("Mocking intruder detection (DeepFace unavailable)")
            return self._get_empty_result(timestamp)

        try:
            # Extract face embeddings for all faces in image
            face_encodings = DeepFace.represent(img_path=image_rgb, model_name="Facenet", enforce_detection=True)
            face_locations = [face.get('facial_area', {}) for face in face_encodings]
        except ValueError:
            # DeepFace raises ValueError if no face is detected
            return self._get_empty_result(timestamp)
        
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
            # Simple behavior check using YOLO Pose
            results = self.pose_detector.predict(image_rgb, verbose=False)
            if results and len(results) > 0 and hasattr(results[0], 'keypoints') and results[0].keypoints is not None:
                # Check for "hands raised" or specific postures
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
            logger.error("Cannot enroll face: DeepFace not available.")
            return False

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        try:
            # Extract embedding
            encodings = DeepFace.represent(img_path=image_rgb, model_name="Facenet", enforce_detection=True)
        except ValueError:
            encodings = []
        
        if len(encodings) > 0:
            if user_id not in self.known_faces_db:
                self.known_faces_db[user_id] = {}
            
            person_id = str(uuid.uuid4())
            self.known_faces_db[user_id][person_id] = {
                'encoding': encodings[0]['embedding'],
                'name': name,
                'relationship': relation
            }
            return True
        return False

    def _match_face(self, encoding_data, known_faces):
        if not known_faces:
             return None
             
        if not FACE_REC_AVAILABLE: return None
        
        target_embedding = encoding_data.get('embedding', encoding_data)
        
        # Check against all known encodings
        best_match_id = None
        best_distance = float('inf')
        
        for person_id, data in known_faces.items():
            known_embedding = data['encoding']
            
            # Calculate Cosine Distance
            a = np.array(target_embedding)
            b = np.array(known_embedding)
            distance = 1 - (np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
            
            if distance < self.FACE_MATCH_THRESHOLD and distance < best_distance:
                best_distance = distance
                best_match_id = person_id
                
        if best_match_id:
            return known_faces[best_match_id]
            
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
