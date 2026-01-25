#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Data Aggregator Service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fetches and aggregates user data from Firestore for
multi-modal risk assessment.

Data Sources:
- Chat messages (sentiment analysis)
- Mood check-ins
- Vision/camera events
- Activity logs (eating, sleep, movement)
- Health metrics (medicine adherence, complaints)
"""

import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from loguru import logger

# Firebase imports with fallback
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    from google.cloud.firestore_v1 import FieldFilter
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("Firebase Admin SDK not available. Using mock data.")


class DataAggregator:
    """
    Data aggregator for multi-modal risk assessment.
    
    Fetches data from multiple sources in Firestore and
    prepares it for the risk prediction model.
    """
    
    def __init__(self, initialize_firebase: bool = True):
        """
        Initialize DataAggregator.
        
        Args:
            initialize_firebase: Whether to initialize Firebase connection
        """
        self.firebase_initialized = False
        self.db = None
        
        if initialize_firebase and FIREBASE_AVAILABLE:
            self._initialize_firebase()
        
        logger.info(f"✅ DataAggregator initialized (Firebase: {self.firebase_initialized})")
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK."""
        try:
            # Check if already initialized
            try:
                app = firebase_admin.get_app()
                self.db = firestore.client()
                self.firebase_initialized = True
                return
            except ValueError:
                pass
            
            # Environment-based initialization
            project_id = os.getenv('FIREBASE_PROJECT_ID')
            private_key = os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n')
            client_email = os.getenv('FIREBASE_CLIENT_EMAIL')
            
            if project_id and private_key and client_email:
                cred = credentials.Certificate({
                    'type': 'service_account',
                    'project_id': project_id,
                    'private_key': private_key,
                    'client_email': client_email,
                    'token_uri': 'https://oauth2.googleapis.com/token'
                })
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.firebase_initialized = True
            else:
                logger.warning("Firebase credentials not found")
                
        except Exception as e:
            logger.error(f"Firebase initialization error: {e}")
    
    async def fetch_user_data(
        self,
        user_id: str,
        days: int = 7
    ) -> Dict:
        """
        Fetch all user data for risk assessment.
        
        Args:
            user_id: Elder's user ID
            days: Number of days to look back
            
        Returns:
            Aggregated user data:
            {
                'user_id': str,
                'elder_name': str,
                'family_members': [...],
                'chat': {...},
                'mood': {...},
                'vision': {...},
                'activity': {...},
                'health': {...},
                'events': [...]
            }
        """
        if not self.firebase_initialized:
            logger.debug(f"Using mock data for user {user_id}")
            return self._get_mock_data(user_id, days)
        
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Fetch all data in parallel-like fashion
            user_doc = await self._fetch_user_profile(user_id)
            chat_data = await self._fetch_chat_data(user_id, cutoff_date)
            mood_data = await self._fetch_mood_data(user_id, cutoff_date)
            vision_data = await self._fetch_vision_data(user_id, cutoff_date)
            activity_data = await self._fetch_activity_data(user_id, cutoff_date)
            health_data = await self._fetch_health_data(user_id, cutoff_date)
            events = await self._fetch_recent_events(user_id, cutoff_date)
            
            return {
                'user_id': user_id,
                'elder_name': user_doc.get('name', 'Elder'),
                'family_members': user_doc.get('family_members', []),
                'chat': chat_data,
                'mood': mood_data,
                'vision': vision_data,
                'activity': activity_data,
                'health': health_data,
                'events': events,
                'period_days': days,
                'fetched_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching user data: {e}")
            return self._get_mock_data(user_id, days)
    
    async def _fetch_user_profile(self, user_id: str) -> Dict:
        """Fetch user profile document."""
        try:
            doc = self.db.collection('users').document(user_id).get()
            if doc.exists:
                return doc.to_dict()
            return {}
        except Exception as e:
            logger.error(f"Error fetching user profile: {e}")
            return {}
    
    async def _fetch_chat_data(
        self,
        user_id: str,
        cutoff_date: datetime
    ) -> Dict:
        """
        Fetch chat sentiment data.
        
        Returns aggregated sentiment statistics.
        """
        try:
            # Fetch chat messages
            messages = (
                self.db.collection('chats')
                .document(user_id)
                .collection('messages')
                .where(filter=FieldFilter('timestamp', '>=', cutoff_date))
                .order_by('timestamp', direction='DESCENDING')
                .limit(100)
                .stream()
            )
            
            sentiments = []
            lonely_mentions = 0
            health_complaints = 0
            
            lonely_keywords = ['lonely', 'alone', 'nobody', 'miss', 'sad', 'isolated']
            health_keywords = ['pain', 'hurt', 'sick', 'tired', 'weak', 'dizzy', 'ache']
            
            for msg in messages:
                data = msg.to_dict()
                sentiment = data.get('sentiment', 0)
                text = data.get('text', '').lower()
                
                sentiments.append(sentiment)
                
                # Count keyword mentions
                for keyword in lonely_keywords:
                    if keyword in text:
                        lonely_mentions += 1
                        break
                
                for keyword in health_keywords:
                    if keyword in text:
                        health_complaints += 1
                        break
            
            avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0.0
            
            return {
                'avg_sentiment': round(avg_sentiment, 3),
                'message_count': len(sentiments),
                'lonely_mentions': lonely_mentions,
                'health_complaints': health_complaints,
                'negative_chat_count': sum(1 for s in sentiments if s < -0.3)
            }
            
        except Exception as e:
            logger.error(f"Error fetching chat data: {e}")
            return {
                'avg_sentiment': 0.0,
                'message_count': 0,
                'lonely_mentions': 0,
                'health_complaints': 0,
                'negative_chat_count': 0
            }
    
    async def _fetch_mood_data(
        self,
        user_id: str,
        cutoff_date: datetime
    ) -> Dict:
        """
        Fetch mood check-in data.
        
        Returns aggregated mood statistics.
        """
        try:
            moods = (
                self.db.collection('moods')
                .where(filter=FieldFilter('user_id', '==', user_id))
                .where(filter=FieldFilter('timestamp', '>=', cutoff_date))
                .order_by('timestamp', direction='DESCENDING')
                .stream()
            )
            
            mood_scores = []
            sad_count = 0
            inactive_days = set()
            all_dates = set()
            
            for mood in moods:
                data = mood.to_dict()
                score = data.get('mood_score', 3)  # 1-5 scale
                mood_type = data.get('mood', 'neutral').lower()
                date = data.get('timestamp').date() if hasattr(data.get('timestamp'), 'date') else None
                
                mood_scores.append(score)
                
                if mood_type in ['sad', 'depressed', 'down', 'low']:
                    sad_count += 1
                
                if date:
                    all_dates.add(date)
            
            # Calculate inactive days (days with no mood check-in)
            if all_dates:
                date_range = (datetime.now().date() - cutoff_date.date()).days
                inactive_days = date_range - len(all_dates)
            else:
                inactive_days = 7
            
            avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 2.5
            normalized_mood = (avg_mood - 1) / 4  # Convert 1-5 to 0-1
            
            return {
                'avg_mood_score': round(avg_mood, 2),
                'normalized_mood': round(normalized_mood, 3),
                'check_in_count': len(mood_scores),
                'sad_count': sad_count,
                'inactive_days': max(0, inactive_days)
            }
            
        except Exception as e:
            logger.error(f"Error fetching mood data: {e}")
            return {
                'avg_mood_score': 2.5,
                'normalized_mood': 0.5,
                'check_in_count': 0,
                'sad_count': 0,
                'inactive_days': 0
            }
    
    async def _fetch_vision_data(
        self,
        user_id: str,
        cutoff_date: datetime
    ) -> Dict:
        """
        Fetch camera/vision event data.
        
        Returns aggregated vision statistics.
        """
        try:
            events = (
                self.db.collection('vision_events')
                .where(filter=FieldFilter('user_id', '==', user_id))
                .where(filter=FieldFilter('timestamp', '>=', cutoff_date))
                .order_by('timestamp', direction='DESCENDING')
                .stream()
            )
            
            emotion_scores = []
            fall_count = 0
            distress_count = 0
            pain_count = 0
            last_activity = None
            
            for event in events:
                data = event.to_dict()
                
                # Emotion data
                emotion_score = data.get('emotion_score', 0)
                emotion_scores.append(emotion_score)
                
                # Fall detection
                if data.get('fall_detected'):
                    fall_count += 1
                
                # Distress
                if data.get('distress_level') in ['high', 'critical']:
                    distress_count += 1
                
                # Pain
                if data.get('pain_detected'):
                    pain_count += 1
                
                # Track last activity
                if data.get('activity_detected') and last_activity is None:
                    last_activity = data.get('timestamp')
            
            # Calculate inactivity
            inactivity_hours = 0.0
            if last_activity:
                try:
                    if hasattr(last_activity, 'timestamp'):
                        last_activity = last_activity.timestamp()
                    inactivity_hours = (datetime.now().timestamp() - last_activity) / 3600
                except:
                    pass
            
            avg_emotion = sum(emotion_scores) / len(emotion_scores) if emotion_scores else 0.0
            
            return {
                'emotion_score': round(avg_emotion, 3),
                'event_count': len(emotion_scores),
                'fall_count': fall_count,
                'distress_count': distress_count,
                'pain_count': pain_count,
                'inactivity_hours': round(inactivity_hours, 2)
            }
            
        except Exception as e:
            logger.error(f"Error fetching vision data: {e}")
            return {
                'emotion_score': 0.0,
                'event_count': 0,
                'fall_count': 0,
                'distress_count': 0,
                'pain_count': 0,
                'inactivity_hours': 0.0
            }
    
    async def _fetch_activity_data(
        self,
        user_id: str,
        cutoff_date: datetime
    ) -> Dict:
        """
        Fetch activity data (meals, sleep, movement).
        
        Returns aggregated activity statistics.
        """
        try:
            # Fetch meals
            meals = list(
                self.db.collection('meals')
                .where(filter=FieldFilter('user_id', '==', user_id))
                .where(filter=FieldFilter('timestamp', '>=', cutoff_date))
                .stream()
            )
            
            # Fetch sleep
            sleep_logs = list(
                self.db.collection('sleep')
                .where(filter=FieldFilter('user_id', '==', user_id))
                .where(filter=FieldFilter('date', '>=', cutoff_date.date().isoformat()))
                .stream()
            )
            
            # Meal analysis
            meal_dates = set()
            for meal in meals:
                data = meal.to_dict()
                ts = data.get('timestamp')
                if hasattr(ts, 'date'):
                    meal_dates.add(ts.date())
            
            days_range = (datetime.now().date() - cutoff_date.date()).days
            days_without_eating = max(0, days_range - len(meal_dates))
            eating_irregularity = 1.0 - (len(meals) / (days_range * 3)) if days_range > 0 else 0.5
            
            # Sleep analysis
            sleep_hours = []
            for log in sleep_logs:
                data = log.to_dict()
                hours = data.get('sleep_hours', 0)
                if hours > 0:
                    sleep_hours.append(hours)
            
            avg_sleep = sum(sleep_hours) / len(sleep_hours) if sleep_hours else 7.0
            sleep_quality = min(1.0, avg_sleep / 8.0)  # 8 hours = 1.0
            
            return {
                'meal_count': len(meals),
                'days_without_eating': days_without_eating,
                'eating_irregularity': round(min(1.0, max(0.0, eating_irregularity)), 3),
                'sleep_quality': round(sleep_quality, 3),
                'avg_sleep_hours': round(avg_sleep, 2),
                'concerning': days_without_eating > 1 or eating_irregularity > 0.5
            }
            
        except Exception as e:
            logger.error(f"Error fetching activity data: {e}")
            return {
                'meal_count': 0,
                'days_without_eating': 0,
                'eating_irregularity': 0.5,
                'sleep_quality': 0.7,
                'avg_sleep_hours': 7.0,
                'concerning': False
            }
    
    async def _fetch_health_data(
        self,
        user_id: str,
        cutoff_date: datetime
    ) -> Dict:
        """
        Fetch health metrics data.
        
        Returns aggregated health statistics.
        """
        try:
            # Fetch medicine logs
            medicines = list(
                self.db.collection('medicines')
                .where(filter=FieldFilter('user_id', '==', user_id))
                .where(filter=FieldFilter('date', '>=', cutoff_date.date().isoformat()))
                .stream()
            )
            
            taken = 0
            missed = 0
            
            for med in medicines:
                data = med.to_dict()
                if data.get('taken'):
                    taken += 1
                else:
                    missed += 1
            
            adherence = taken / (taken + missed) if (taken + missed) > 0 else 1.0
            
            # Check for emergency button presses
            emergency_presses = 0
            emergencies = (
                self.db.collection('emergency_events')
                .where(filter=FieldFilter('user_id', '==', user_id))
                .where(filter=FieldFilter('timestamp', '>=', cutoff_date))
                .stream()
            )
            
            for _ in emergencies:
                emergency_presses += 1
            
            return {
                'medicine_taken': taken,
                'medicine_missed': missed,
                'adherence_rate': round(adherence, 3),
                'emergency_button_presses': emergency_presses,
                'health_complaints': 0,  # Would come from chat analysis
                'pain_score': 0.0
            }
            
        except Exception as e:
            logger.error(f"Error fetching health data: {e}")
            return {
                'medicine_taken': 0,
                'medicine_missed': 0,
                'adherence_rate': 1.0,
                'emergency_button_presses': 0,
                'health_complaints': 0,
                'pain_score': 0.0
            }
    
    async def _fetch_recent_events(
        self,
        user_id: str,
        cutoff_date: datetime
    ) -> List[Dict]:
        """Fetch recent notable events."""
        try:
            events = (
                self.db.collection('events')
                .where(filter=FieldFilter('user_id', '==', user_id))
                .where(filter=FieldFilter('timestamp', '>=', cutoff_date))
                .order_by('timestamp', direction='DESCENDING')
                .limit(20)
                .stream()
            )
            
            return [e.to_dict() for e in events]
            
        except Exception as e:
            logger.error(f"Error fetching events: {e}")
            return []
    
    def _get_mock_data(self, user_id: str, days: int) -> Dict:
        """Return mock data for testing when Firebase unavailable."""
        return {
            'user_id': user_id,
            'elder_name': 'Test Elder',
            'family_members': [
                {
                    'id': 'family-1',
                    'name': 'Test Family',
                    'fcm_token': None,
                    'phone': None
                }
            ],
            'chat': {
                'avg_sentiment': 0.2,
                'message_count': 10,
                'lonely_mentions': 1,
                'health_complaints': 1,
                'negative_chat_count': 2
            },
            'mood': {
                'avg_mood_score': 3.5,
                'normalized_mood': 0.625,
                'check_in_count': 5,
                'sad_count': 1,
                'inactive_days': 1
            },
            'vision': {
                'emotion_score': 0.3,
                'event_count': 20,
                'fall_count': 0,
                'distress_count': 0,
                'pain_count': 0,
                'inactivity_hours': 8.0
            },
            'activity': {
                'meal_count': 18,
                'days_without_eating': 0,
                'eating_irregularity': 0.15,
                'sleep_quality': 0.75,
                'avg_sleep_hours': 7.5,
                'concerning': False
            },
            'health': {
                'medicine_taken': 12,
                'medicine_missed': 2,
                'adherence_rate': 0.857,
                'emergency_button_presses': 0,
                'health_complaints': 1,
                'pain_score': 0.0
            },
            'events': [],
            'period_days': days,
            'mock_data': True,
            'fetched_at': datetime.now().isoformat()
        }


# Create global instance for import
data_aggregator = DataAggregator(initialize_firebase=False)  # Lazy init
