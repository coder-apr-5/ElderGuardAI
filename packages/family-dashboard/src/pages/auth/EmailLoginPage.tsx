// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Email Login Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { emailLogin } from '../../services/authApi';

const EmailLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await emailLogin(email, password);

            if (result.success) {
                if (result.user.role === 'elder') {
                    navigate('/elder/dashboard');
                } else {
                    navigate('/family/dashboard');
                }
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
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
                    <p className="auth-subtitle">Login with your email</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            disabled={isLoading}
                            className={error ? 'error' : ''}
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
                                placeholder="Enter your password"
                                disabled={isLoading}
                                className={error ? 'error' : ''}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <Link to="/auth/forgot-password" className="forgot-password-link">
                        Forgot password?
                    </Link>

                    <button
                        type="submit"
                        className="auth-button primary"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="loading-spinner"></span>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <Link to="/auth/login/phone" className="auth-button secondary">
                    📱 Login with Phone
                </Link>

                <button className="auth-button google-button">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                    Continue with Google
                </button>

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

        .error-message {
          color: #ef4444;
          font-size: 14px;
          margin: 0;
          text-align: center;
        }

        .forgot-password-link {
          color: #6366f1;
          font-size: 14px;
          text-align: right;
          text-decoration: none;
        }

        .forgot-password-link:hover {
          text-decoration: underline;
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

        .auth-button.secondary {
          background: #f8fafc;
          color: #374151;
          border: 2px solid #e2e8f0;
        }

        .auth-button.secondary:hover {
          background: #f1f5f9;
        }

        .auth-button.google-button {
          background: white;
          color: #374151;
          border: 2px solid #e2e8f0;
          margin-top: 8px;
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
      `}</style>
        </div>
    );
};

export default EmailLoginPage;
