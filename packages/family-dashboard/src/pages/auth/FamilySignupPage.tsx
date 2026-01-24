// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Family Signup Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from '../../components/auth/PhoneInput';
import { familySignup } from '../../services/authApi';

const FamilySignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('IN');
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    const handlePhoneChange = (newPhone: string, newCountryCode: string) => {
        setPhone(newPhone);
        setCountryCode(newCountryCode);
    };

    const validateForm = (): string | null => {
        if (!fullName.trim()) {
            return 'Please enter your full name';
        }
        if (!email.trim()) {
            return 'Please enter your email';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return 'Please enter a valid email address';
        }
        if (!password) {
            return 'Please enter a password';
        }
        if (password.length < 8) {
            return 'Password must be at least 8 characters';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        if (password !== confirmPassword) {
            return 'Passwords do not match';
        }
        if (!agreeTerms) {
            return 'Please agree to the Terms of Service';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await familySignup({
                email: email.trim().toLowerCase(),
                password,
                fullName: fullName.trim(),
                phone: phone || undefined,
                countryCode: phone ? countryCode : undefined,
            });

            if (result.success) {
                navigate('/family/dashboard');
            } else {
                setError(result.message || 'Signup failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Signup failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = (): { strength: number; label: string; color: string } => {
        if (!password) return { strength: 0, label: '', color: '#e2e8f0' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength <= 2) return { strength: 1, label: 'Weak', color: '#ef4444' };
        if (strength <= 3) return { strength: 2, label: 'Medium', color: '#f59e0b' };
        if (strength <= 4) return { strength: 3, label: 'Strong', color: '#10b981' };
        return { strength: 4, label: 'Very Strong', color: '#059669' };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">👨‍👩‍👧</div>
                    <h1 className="auth-title">Create Family Account</h1>
                    <p className="auth-subtitle">Join ElderNest to care for your loved ones</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
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
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Create a strong password"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {password && (
                            <div className="password-strength">
                                <div className="strength-bars">
                                    {[1, 2, 3, 4].map(level => (
                                        <div
                                            key={level}
                                            className="strength-bar"
                                            style={{
                                                background: passwordStrength.strength >= level
                                                    ? passwordStrength.color
                                                    : '#e2e8f0'
                                            }}
                                        />
                                    ))}
                                </div>
                                <span style={{ color: passwordStrength.color }}>
                                    {passwordStrength.label}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            disabled={isLoading}
                            className={confirmPassword && confirmPassword !== password ? 'error' : ''}
                        />
                        {confirmPassword && confirmPassword !== password && (
                            <span className="field-error">Passwords don't match</span>
                        )}
                    </div>

                    <PhoneInput
                        label="Phone Number (Optional)"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="Enter your phone number"
                        disabled={isLoading}
                    />

                    <div className="terms-checkbox">
                        <input
                            type="checkbox"
                            id="agreeTerms"
                            checked={agreeTerms}
                            onChange={e => setAgreeTerms(e.target.checked)}
                        />
                        <label htmlFor="agreeTerms">
                            I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
                        </label>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button
                        type="submit"
                        className="auth-button primary"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="loading-spinner"></span>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <button className="auth-button google-button">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                    Continue with Google
                </button>

                <div className="auth-footer">
                    <p>Already have an account?</p>
                    <Link to="/auth/login/email">Login</Link>
                </div>

                <div className="elder-signup-link">
                    <p>Are you an elder?</p>
                    <Link to="/auth/signup/elder">Create Elder Account →</Link>
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
          max-width: 440px;
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
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .form-group input.error {
          border-color: #ef4444;
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-input-wrapper input {
          width: 100%;
          padding-right: 48px;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
        }

        .password-strength {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .strength-bars {
          display: flex;
          gap: 4px;
          flex: 1;
        }

        .strength-bar {
          height: 4px;
          flex: 1;
          border-radius: 2px;
          transition: background 0.3s ease;
        }

        .password-strength span {
          font-size: 12px;
          font-weight: 500;
        }

        .field-error {
          color: #ef4444;
          font-size: 12px;
        }

        .terms-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 8px;
        }

        .terms-checkbox input {
          margin-top: 4px;
          width: 16px;
          height: 16px;
        }

        .terms-checkbox label {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
        }

        .terms-checkbox a {
          color: #6366f1;
          text-decoration: none;
        }

        .terms-checkbox a:hover {
          text-decoration: underline;
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
          gap: 10px;
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

        .auth-button.google-button {
          background: white;
          color: #374151;
          border: 2px solid #e2e8f0;
        }

        .auth-button.google-button:hover {
          background: #f8fafc;
        }

        .auth-button.google-button img {
          width: 20px;
          height: 20px;
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

        .elder-signup-link {
          text-align: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .elder-signup-link p {
          color: #6b7280;
          margin: 0 0 4px 0;
          font-size: 14px;
        }

        .elder-signup-link a {
          color: #10b981;
          font-weight: 600;
          text-decoration: none;
        }

        .elder-signup-link a:hover {
          text-decoration: underline;
        }
      `}</style>
        </div>
    );
};

export default FamilySignupPage;
