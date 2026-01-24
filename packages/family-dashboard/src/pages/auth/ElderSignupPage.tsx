// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Elder Signup Page - Multi-Step Registration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from '../../components/auth/PhoneInput';
import OTPInput from '../../components/auth/OTPInput';
import {
    elderSignupStep1,
    elderSignupStep2,
    elderSignupStep3,
    elderSignupStep4,
} from '../../services/authApi';

type Step = 1 | 2 | 3 | 4;

type FamilyRelation = 'son' | 'daughter' | 'spouse' | 'caregiver' | 'sibling' | 'grandchild' | 'other';

const FAMILY_RELATIONS: { value: FamilyRelation; label: string }[] = [
    { value: 'son', label: '👨 Son' },
    { value: 'daughter', label: '👩 Daughter' },
    { value: 'spouse', label: '💑 Spouse' },
    { value: 'caregiver', label: '🏥 Caregiver' },
    { value: 'sibling', label: '👫 Sibling' },
    { value: 'grandchild', label: '👶 Grandchild' },
    { value: 'other', label: '👤 Other' },
];

const ElderSignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Phone
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('IN');

    // Step 2: OTP verification token
    const [verificationToken, setVerificationToken] = useState('');

    // Step 3: Personal info & family
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [familyPhone, setFamilyPhone] = useState('');
    const [familyCountryCode, setFamilyCountryCode] = useState('IN');
    const [familyRelation, setFamilyRelation] = useState<FamilyRelation>('son');
    const [pendingConnectionId, setPendingConnectionId] = useState('');
    const [familyPhoneDisplay, setFamilyPhoneDisplay] = useState('');

    const handlePhoneChange = (newPhone: string, newCountryCode: string) => {
        setPhone(newPhone);
        setCountryCode(newCountryCode);
        setError('');
    };

    const handleFamilyPhoneChange = (newPhone: string, newCountryCode: string) => {
        setFamilyPhone(newPhone);
        setFamilyCountryCode(newCountryCode);
        setError('');
    };

    // Step 1: Send OTP to elder
    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone || phone.length < 6) {
            setError('Please enter a valid phone number');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await elderSignupStep1(phone, countryCode);

            if (result.success) {
                setStep(2);
            } else {
                setError(result.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify elder's OTP
    const handleStep2 = async (otp: string) => {
        setIsLoading(true);
        setError('');

        try {
            const result = await elderSignupStep2(phone, countryCode, otp);

            if (result.success && result.verificationToken) {
                setVerificationToken(result.verificationToken);
                setStep(3);
            } else {
                setError(result.message || 'Invalid OTP');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Submit elder info and family phone
    const handleStep3 = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim()) {
            setError('Please enter your name');
            return;
        }

        const ageNum = parseInt(age, 10);
        if (!age || ageNum < 1 || ageNum > 120) {
            setError('Please enter a valid age');
            return;
        }

        if (!familyPhone || familyPhone.length < 6) {
            setError('Please enter a valid family member phone number');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await elderSignupStep3({
                phone,
                countryCode,
                fullName: fullName.trim(),
                age: ageNum,
                familyPhone,
                familyCountryCode,
                familyRelation,
                verificationToken,
            });

            if (result.success && result.pendingConnectionId) {
                setPendingConnectionId(result.pendingConnectionId);
                setFamilyPhoneDisplay(result.familyPhoneDisplay || familyPhone);
                setStep(4);
            } else {
                setError(result.message || 'Failed to send family verification');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 4: Family verifies
    const handleStep4 = async (otp: string) => {
        setIsLoading(true);
        setError('');

        try {
            const result = await elderSignupStep4(pendingConnectionId, otp);

            if (result.success) {
                navigate('/elder/dashboard');
            } else {
                setError(result.message || 'Verification failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Progress indicator */}
                <div className="progress-bar">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`progress-step ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
                        >
                            <div className="step-circle">
                                {step > s ? '✓' : s}
                            </div>
                            <span className="step-label">
                                {s === 1 && 'Phone'}
                                {s === 2 && 'Verify'}
                                {s === 3 && 'Details'}
                                {s === 4 && 'Family'}
                            </span>
                        </div>
                    ))}
                    <div className="progress-line">
                        <div
                            className="progress-fill"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="auth-header">
                    <h1 className="auth-title">
                        {step === 1 && 'Create Elder Account'}
                        {step === 2 && 'Verify Your Phone'}
                        {step === 3 && 'Your Information'}
                        {step === 4 && 'Family Verification'}
                    </h1>
                    <p className="auth-subtitle">
                        {step === 1 && 'Enter your phone number to get started'}
                        {step === 2 && 'Enter the code sent to your phone'}
                        {step === 3 && 'Tell us about yourself and your family member'}
                        {step === 4 && `Waiting for ${familyPhoneDisplay} to verify`}
                    </p>
                </div>

                {/* Step 1: Phone input */}
                {step === 1 && (
                    <form onSubmit={handleStep1} className="auth-form">
                        <PhoneInput
                            label="Your Phone Number"
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
                            {isLoading ? <span className="loading-spinner"></span> : 'Continue'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP verification */}
                {step === 2 && (
                    <div className="auth-form">
                        <OTPInput
                            onComplete={handleStep2}
                            disabled={isLoading}
                            error={error}
                        />

                        {isLoading && (
                            <div className="verifying-message">
                                <span className="loading-spinner"></span>
                                Verifying...
                            </div>
                        )}

                        <button
                            type="button"
                            className="back-button"
                            onClick={() => setStep(1)}
                        >
                            ← Change phone number
                        </button>
                    </div>
                )}

                {/* Step 3: Personal info & family phone */}
                {step === 3 && (
                    <form onSubmit={handleStep3} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="fullName">Your Full Name</label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="age">Your Age</label>
                            <input
                                id="age"
                                type="number"
                                value={age}
                                onChange={e => setAge(e.target.value)}
                                placeholder="Enter your age"
                                min="1"
                                max="120"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-divider">
                            <span>👨‍👩‍👧‍👦 Family Member Details</span>
                        </div>

                        <div className="form-group">
                            <label>Relationship to You</label>
                            <div className="relation-grid">
                                {FAMILY_RELATIONS.map(rel => (
                                    <button
                                        key={rel.value}
                                        type="button"
                                        className={`relation-button ${familyRelation === rel.value ? 'selected' : ''}`}
                                        onClick={() => setFamilyRelation(rel.value)}
                                    >
                                        {rel.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <PhoneInput
                            label="Family Member's Phone Number"
                            value={familyPhone}
                            onChange={handleFamilyPhoneChange}
                            placeholder="Enter their phone number"
                            disabled={isLoading}
                        />

                        <p className="info-text">
                            We'll send a verification code to your family member to confirm your connection.
                        </p>

                        {error && <p className="error-message">{error}</p>}

                        <button
                            type="submit"
                            className="auth-button primary"
                            disabled={isLoading || !fullName || !age || !familyPhone}
                        >
                            {isLoading ? <span className="loading-spinner"></span> : 'Send Verification to Family'}
                        </button>

                        <button
                            type="button"
                            className="back-button"
                            onClick={() => setStep(2)}
                        >
                            ← Go back
                        </button>
                    </form>
                )}

                {/* Step 4: Family OTP verification */}
                {step === 4 && (
                    <div className="auth-form">
                        <div className="waiting-illustration">
                            📱
                        </div>

                        <p className="waiting-text">
                            We've sent a verification code to your family member at <strong>{familyPhoneDisplay}</strong>.
                            Ask them to share the 6-digit code with you.
                        </p>

                        <OTPInput
                            onComplete={handleStep4}
                            disabled={isLoading}
                            error={error}
                        />

                        {isLoading && (
                            <div className="verifying-message">
                                <span className="loading-spinner"></span>
                                Creating your account...
                            </div>
                        )}

                        <button
                            type="button"
                            className="back-button"
                            onClick={() => setStep(3)}
                        >
                            ← Change family details
                        </button>
                    </div>
                )}

                <div className="auth-footer">
                    <p>Already have an account?</p>
                    <Link to="/auth/login/phone">Login</Link>
                </div>
            </div>

            <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .auth-container {
          width: 100%;
          max-width: 480px;
          background: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        }

        .progress-bar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
          position: relative;
        }

        .progress-line {
          position: absolute;
          top: 16px;
          left: 40px;
          right: 40px;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          z-index: 0;
        }

        .progress-fill {
          height: 100%;
          background: #10b981;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 1;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          transition: all 0.3s ease;
        }

        .progress-step.active .step-circle {
          background: #10b981;
          color: white;
        }

        .progress-step.completed .step-circle {
          background: #10b981;
          color: white;
        }

        .step-label {
          font-size: 12px;
          color: #6b7280;
        }

        .progress-step.active .step-label {
          color: #10b981;
          font-weight: 600;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-title {
          font-size: 24px;
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
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input {
          height: 48px;
          padding: 0 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.2s ease;
          outline: none;
        }

        .form-group input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        .form-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 8px 0;
        }

        .form-divider::before,
        .form-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .form-divider span {
          color: #374151;
          font-size: 14px;
          font-weight: 500;
        }

        .relation-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .relation-button {
          padding: 10px 8px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .relation-button:hover {
          border-color: #10b981;
        }

        .relation-button.selected {
          border-color: #10b981;
          background: #ecfdf5;
          color: #059669;
        }

        .info-text {
          font-size: 13px;
          color: #6b7280;
          text-align: center;
          margin: 8px 0;
        }

        .error-message {
          color: #ef4444;
          font-size: 14px;
          margin: 0;
          text-align: center;
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
          border: none;
        }

        .auth-button.primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .auth-button.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }

        .auth-button.primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          border-color: rgba(16, 185, 129, 0.3);
          border-top-color: #10b981;
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

        .waiting-illustration {
          font-size: 64px;
          text-align: center;
          margin-bottom: 16px;
        }

        .waiting-text {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 16px;
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
          color: #10b981;
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

export default ElderSignupPage;
