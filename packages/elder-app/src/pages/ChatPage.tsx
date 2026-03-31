// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AI Companion Chat Page
// Full-screen chat experience for elders
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useEffect } from 'react';
import AICompanionChat from '../components/chat/AICompanionChat';
import { auth } from '@elder-nest/shared';

const ChatPage: React.FC = () => {
    const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('large');
    const [detectedMood, setDetectedMood] = useState<string | null>(null);
    const [elderName, setElderName] = useState<string>('Friend');
    const [elderId, setElderId] = useState<string>('elder-demo');

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                setElderId(user.uid);
                try {
                    const userDataStr = localStorage.getItem(`users_${user.uid}`);
                    if (userDataStr) {
                        const userData = JSON.parse(userDataStr);
                        if (userData && userData.fullName) {
                            setElderName(userData.fullName.split(' ')[0]);
                        }
                    } else if (user.displayName) {
                        setElderName(user.displayName.split(' ')[0]);
                    }
                } catch (e) {
                    // Ignore parse error
                }
            }
        };
        fetchUserData();
    }, []);

    const handleMoodDetected = (mood: string) => {
        setDetectedMood(mood);
        console.log('Mood detected:', mood);
    };

    return (
        <div className="chat-page">
            {/* Top Controls */}
            <div className="page-controls">
                <div className="font-size-controls">
                    <span>Text Size:</span>
                    <button
                        className={fontSize === 'normal' ? 'active' : ''}
                        onClick={() => setFontSize('normal')}
                    >
                        A
                    </button>
                    <button
                        className={fontSize === 'large' ? 'active' : ''}
                        onClick={() => setFontSize('large')}
                    >
                        A+
                    </button>
                    <button
                        className={fontSize === 'extra-large' ? 'active' : ''}
                        onClick={() => setFontSize('extra-large')}
                    >
                        A++
                    </button>
                </div>

                {detectedMood && (
                    <div className={`mood-indicator ${detectedMood}`}>
                        {detectedMood === 'happy' && '😊 Feeling good!'}
                        {detectedMood === 'sad' && '💙 We\'re here for you'}
                        {detectedMood === 'lonely' && '🤗 You\'re not alone'}
                        {detectedMood === 'anxious' && '💆 Take deep breaths'}
                        {detectedMood === 'neutral' && '😌 Doing okay'}
                    </div>
                )}
            </div>

            {/* Chat Component */}
            <div className="chat-container">
                <AICompanionChat
                    key={elderId} // re-mount if ID changes
                    elderId={elderId}
                    elderName={elderName}
                    companionName="Mira"
                    fontSize={fontSize}
                    onMoodDetected={handleMoodDetected}
                />
            </div>

            {/* Emergency Button */}
            <button className="emergency-button" aria-label="Emergency - Call for help">
                🆘 Need Help
            </button>

            <style>{`
        .chat-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #f0f4ff 0%, #e8f4f8 100%);
          padding: 16px;
        }

        .page-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: white;
          border-radius: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .font-size-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .font-size-controls span {
          color: #64748b;
          font-size: 14px;
          margin-right: 8px;
        }

        .font-size-controls button {
          width: 40px;
          height: 40px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-weight: 600;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .font-size-controls button:hover {
          border-color: #6366f1;
        }

        .font-size-controls button.active {
          background: #6366f1;
          border-color: #6366f1;
          color: white;
        }

        .mood-indicator {
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 500;
        }

        .mood-indicator.happy {
          background: #dcfce7;
          color: #166534;
        }

        .mood-indicator.sad,
        .mood-indicator.lonely {
          background: #dbeafe;
          color: #1e40af;
        }

        .mood-indicator.anxious {
          background: #fef3c7;
          color: #92400e;
        }

        .mood-indicator.neutral {
          background: #f1f5f9;
          color: #475569;
        }

        .chat-container {
          flex: 1;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }

        .emergency-button {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 16px 24px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
          transition: all 0.2s ease;
          z-index: 1000;
        }

        .emergency-button:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(239, 68, 68, 0.5);
        }

        @media (max-width: 768px) {
          .chat-page {
            padding: 8px;
          }

          .page-controls {
            flex-direction: column;
            gap: 12px;
          }

          .emergency-button {
            bottom: 16px;
            right: 16px;
            padding: 12px 20px;
            font-size: 16px;
          }
        }
      `}</style>
        </div>
    );
};

export default ChatPage;
