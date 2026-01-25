#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Firebase Client
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Firebase Admin SDK initialization and utilities.
"""

import os
from typing import Optional
from loguru import logger

# Firebase imports
try:
    import firebase_admin
    from firebase_admin import credentials, firestore, messaging
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("Firebase Admin SDK not installed")


class FirebaseClient:
    """
    Firebase client for Firestore and FCM operations.
    
    Provides centralized Firebase initialization and access.
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Firebase client."""
        if not FirebaseClient._initialized:
            self.db = None
            self.app = None
            self._initialize()
            FirebaseClient._initialized = True
    
    def _initialize(self):
        """Initialize Firebase Admin SDK."""
        if not FIREBASE_AVAILABLE:
            logger.warning("Firebase not available")
            return
        
        try:
            # Check if already initialized
            try:
                self.app = firebase_admin.get_app()
                self.db = firestore.client()
                logger.info("Firebase already initialized")
                return
            except ValueError:
                pass
            
            # Try environment-based initialization
            project_id = os.getenv('FIREBASE_PROJECT_ID')
            private_key = os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n')
            client_email = os.getenv('FIREBASE_CLIENT_EMAIL')
            
            if project_id and private_key and client_email:
                cred = credentials.Certificate({
                    'type': 'service_account',
                    'project_id': project_id,
                    'private_key_id': os.getenv('FIREBASE_PRIVATE_KEY_ID', ''),
                    'private_key': private_key,
                    'client_email': client_email,
                    'client_id': os.getenv('FIREBASE_CLIENT_ID', ''),
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': 'https://oauth2.googleapis.com/token',
                    'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
                    'client_x509_cert_url': f'https://www.googleapis.com/robot/v1/metadata/x509/{client_email}'
                })
                self.app = firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                logger.info("Firebase initialized from environment variables")
                return
            
            # Try service account file
            sa_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
            if sa_path and os.path.exists(sa_path):
                cred = credentials.Certificate(sa_path)
                self.app = firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                logger.info(f"Firebase initialized from {sa_path}")
                return
            
            logger.warning("No Firebase credentials found")
            
        except Exception as e:
            logger.error(f"Firebase initialization failed: {e}")
    
    @property
    def is_available(self) -> bool:
        """Check if Firebase is available."""
        return self.db is not None
    
    def get_firestore(self):
        """Get Firestore client."""
        return self.db
    
    def send_fcm_notification(
        self,
        token: str,
        title: str,
        body: str,
        data: Optional[dict] = None
    ) -> bool:
        """
        Send FCM push notification.
        
        Args:
            token: Device FCM token
            title: Notification title
            body: Notification body
            data: Optional data payload
            
        Returns:
            True if sent successfully
        """
        if not self.is_available:
            logger.debug(f"FCM mock: {title}")
            return True
        
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data={k: str(v) for k, v in (data or {}).items()},
                token=token
            )
            
            response = messaging.send(message)
            logger.debug(f"FCM sent: {response}")
            return True
            
        except Exception as e:
            logger.error(f"FCM error: {e}")
            return False


# Create global instance
firebase_client = FirebaseClient()

# Export utilities
def get_db():
    """Get Firestore client."""
    return firebase_client.get_firestore()

def send_notification(token: str, title: str, body: str, data: dict = None) -> bool:
    """Send push notification."""
    return firebase_client.send_fcm_notification(token, title, body, data)

__all__ = [
    'FirebaseClient',
    'firebase_client',
    'get_db',
    'send_notification'
]
