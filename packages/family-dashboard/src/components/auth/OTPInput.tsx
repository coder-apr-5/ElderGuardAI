// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OTP Input Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
    length?: number;
    onComplete: (otp: string) => void;
    disabled?: boolean;
    error?: string;
    autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
    length = 6,
    onComplete,
    disabled = false,
    error,
    autoFocus = true,
}) => {
    const [values, setValues] = useState<string[]>(Array(length).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus]);

    const handleChange = (index: number, value: string) => {
        // Only accept digits
        const digit = value.replace(/\D/g, '').slice(-1);

        const newValues = [...values];
        newValues[index] = digit;
        setValues(newValues);

        // Move to next input
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if complete
        const otp = newValues.join('');
        if (otp.length === length && !otp.includes('')) {
            onComplete(otp);
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!values[index] && index > 0) {
                // Move to previous input if current is empty
                inputRefs.current[index - 1]?.focus();
                const newValues = [...values];
                newValues[index - 1] = '';
                setValues(newValues);
            } else {
                // Clear current input
                const newValues = [...values];
                newValues[index] = '';
                setValues(newValues);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

        if (pastedData) {
            const newValues = [...values];
            for (let i = 0; i < pastedData.length; i++) {
                newValues[i] = pastedData[i];
            }
            setValues(newValues);

            // Focus on the next empty input or last input
            const nextEmptyIndex = newValues.findIndex(v => !v);
            if (nextEmptyIndex !== -1) {
                inputRefs.current[nextEmptyIndex]?.focus();
            } else {
                inputRefs.current[length - 1]?.focus();
            }

            // Check if complete
            const otp = newValues.join('');
            if (otp.length === length) {
                onComplete(otp);
            }
        }
    };

    return (
        <div className="otp-input-container">
            <div className="otp-inputs">
                {values.map((value, index) => (
                    <input
                        key={index}
                        ref={el => inputRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={e => handleChange(index, e.target.value)}
                        onKeyDown={e => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        disabled={disabled}
                        className={`otp-input ${error ? 'error' : ''} ${value ? 'filled' : ''}`}
                        aria-label={`Digit ${index + 1}`}
                    />
                ))}
            </div>
            {error && <p className="otp-error">{error}</p>}

            <style>{`
        .otp-input-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .otp-inputs {
          display: flex;
          gap: 8px;
        }
        
        .otp-input {
          width: 48px;
          height: 56px;
          text-align: center;
          font-size: 24px;
          font-weight: 600;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          color: #1a202c;
          transition: all 0.2s ease;
          outline: none;
        }
        
        .otp-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        
        .otp-input.filled {
          border-color: #6366f1;
          background: #f8faff;
        }
        
        .otp-input.error {
          border-color: #ef4444;
          background: #fef2f2;
        }
        
        .otp-input:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }
        
        .otp-error {
          color: #ef4444;
          font-size: 14px;
          margin: 0;
        }
        
        @media (max-width: 400px) {
          .otp-input {
            width: 40px;
            height: 48px;
            font-size: 20px;
          }
          
          .otp-inputs {
            gap: 6px;
          }
        }
      `}</style>
        </div>
    );
};

export default OTPInput;
