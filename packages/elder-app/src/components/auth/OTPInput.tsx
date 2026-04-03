// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OTP Input Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useRef, useEffect } from 'react';

interface OTPInputProps {
  onComplete: (otp: string) => void;
  disabled?: boolean;
  error?: string;
  length?: number;
}

const OTPInput: React.FC<OTPInputProps> = ({
  onComplete,
  disabled = false,
  error,
  length = 6
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Take only the last character if multiple characters are entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if OTP is complete
    const combinedOtp = newOtp.join('');
    if (combinedOtp.length === length) {
      onComplete(combinedOtp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus last filled or next empty input
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === length) {
      onComplete(pastedData);
    }
  };

  return (
    <div className="otp-container">
      <div className={`otp-inputs ${error ? 'has-error' : ''}`}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={disabled}
            className="otp-digit-input"
          />
        ))}
      </div>
      
      {error && <p className="otp-error-text">{error}</p>}

      <style>{`
        .otp-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .otp-inputs {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .otp-digit-input {
          width: 48px;
          height: 56px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          text-align: center;
          font-size: 24px;
          font-weight: 700;
          color: #1a202c;
          background: white;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }

        .otp-digit-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
          transform: translateY(-2px);
        }

        .otp-digit-input:disabled {
          background: #f7fafc;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .otp-inputs.has-error .otp-digit-input {
          border-color: #ef4444;
        }

        .otp-inputs.has-error .otp-digit-input:focus {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
        }

        .otp-error-text {
          color: #ef4444;
          font-size: 14px;
          margin: 0;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default OTPInput;
