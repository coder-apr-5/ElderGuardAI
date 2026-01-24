// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phone Login Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from '../../components/auth/PhoneInput';
import OTPInput from '../../components/auth/OTPInput';
import { phoneLoginStep1, phoneLoginStep2 } from '../../services/authApi';

type Step = 'phone' | 'otp';

const PhoneLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('IN');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const handlePhoneChange = (newPhone: string, newCountryCode: string) => {
        setPhone(newPhone);
        setCountryCode(newCountryCode);
        setError('');
    };

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone || phone.length < 6) {
            setError('Please enter a valid phone number');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await phoneLoginStep1(phone, countryCode);

            if (result.success) {
                setOtpSent(true);
                setStep('otp');
            } else {
                setError(result.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (otp: string) => {
        setIsLoading(true);
        setError('');

        try {
            const result = await phoneLoginStep2(phone, countryCode, otp);

            if (result.success) {
                // Redirect based on role
                if (result.user.role === 'elder') {
                    navigate('/elder/dashboard');
                } else {
                    navigate('/family/dashboard');
                }
            } else {
                setError(result.message || 'Invalid OTP');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await phoneLoginStep1(phone, countryCode);

            if (result.success) {
                setError(''); // Clear any errors
                // Show success message briefly
            } else {
                setError(result.message || 'Failed to resend OTP');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">🏠</div>
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Login with your phone number</p>
                </div>

                {step === 'phone' && (
                    <form onSubmit={handleSendOTP} className="auth-form">
                        <PhoneInput
                            label="Phone Number"
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder="Enter your phone number"
                            error={error}
                            disabled={isLoading}
                        />

                        <button
                            type="submit"
                            className="auth-button primary"
                            disabled={isLoading || !phone}
                        >
                            {isLoading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                'Send OTP'
                            )}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <div className="auth-form">
                        <div className="otp-info">
                            <p>We've sent a 6-digit code to</p>
                            <p className="otp-phone">+{countryCode === 'IN' ? '91' : '1'} {phone}</p>
                        </div>

                        <OTPInput
                            onComplete={handleVerifyOTP}
                            disabled={isLoading}
                            error={error}
                        />

                        {isLoading && (
                            <div className="verifying-message">
                                <span className="loading-spinner"></span>
                                Verifying...
                            </div>
                        )}

                        <div className="resend-section">
                            <button
                                type="button"
                                className="resend-button"
                                onClick={handleResendOTP}
                                disabled={isLoading}
                            >
                                Didn't receive code? Resend
                            </button>
                        </div>

                        <button
                            type="button"
                            className="back-button"
                            onClick={() => {
                                setStep('phone');
                                setError('');
                            }}
                        >
                            ← Change phone number
                        </button>
                    </div>
                )}

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <Link to="/auth/login/email" className="auth-button secondary">
                    Login with Email
                </Link>

                <div className="auth-footer">
                    <p>Don't have an account?</p>
                    <Link to="/auth/signup">Create Account</Link>
                </div>
            </div>

            <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .auth-container {
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-logo {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .auth-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 8px 0;
        }

        .auth-subtitle {
          color: #6b7280;
          margin: 0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .otp-info {
          text-align: center;
          margin-bottom: 8px;
        }

        .otp-info p {
          margin: 0;
          color: #6b7280;
        }

        .otp-phone {
          font-weight: 600;
          color: #1a202c !important;
          margin-top: 4px !important;
        }

        .auth-button {
          height: 52px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border: none;
        }

        .auth-button.primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
        }

        .auth-button.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
        }

        .auth-button.primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-button.secondary {
          background: #f8fafc;
          color: #374151;
          border: 2px solid #e2e8f0;
        }

        .auth-button.secondary:hover {
          background: #f1f5f9;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .verifying-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #6b7280;
          font-size: 14px;
        }

        .verifying-message .loading-spinner {
          border-color: rgba(99, 102, 241, 0.3);
          border-top-color: #6366f1;
        }

        .resend-section {
          text-align: center;
        }

        .resend-button {
          background: none;
          border: none;
          color: #6366f1;
          cursor: pointer;
          font-size: 14px;
        }

        .resend-button:hover:not(:disabled) {
          text-decoration: underline;
        }

        .resend-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .back-button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 14px;
          margin-top: 8px;
        }

        .back-button:hover {
          color: #374151;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 24px 0;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .auth-divider span {
          color: #9ca3af;
          font-size: 14px;
        }

        .auth-footer {
          text-align: center;
          margin-top: 24px;
        }

        .auth-footer p {
          color: #6b7280;
          margin: 0 0 8px 0;
        }

        .auth-footer a {
          color: #6366f1;
          font-weight: 600;
          text-decoration: none;
        }

        .auth-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
        </div>
    );
};

export default PhoneLoginPage;
