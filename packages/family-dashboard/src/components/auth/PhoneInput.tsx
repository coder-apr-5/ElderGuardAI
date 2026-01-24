// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phone Input Component with Country Select
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useEffect, useRef } from 'react';

interface Country {
    code: string;
    name: string;
    callingCode: string;
    flag: string;
}

interface PhoneInputProps {
    value: string;
    onChange: (phone: string, countryCode: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    label?: string;
    defaultCountry?: string;
}

// Default countries list (in case API fails)
const DEFAULT_COUNTRIES: Country[] = [
    { code: 'US', name: 'United States', callingCode: '+1', flag: '🇺🇸' },
    { code: 'IN', name: 'India', callingCode: '+91', flag: '🇮🇳' },
    { code: 'GB', name: 'United Kingdom', callingCode: '+44', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', callingCode: '+1', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', callingCode: '+61', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', callingCode: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'France', callingCode: '+33', flag: '🇫🇷' },
    { code: 'SG', name: 'Singapore', callingCode: '+65', flag: '🇸🇬' },
    { code: 'AE', name: 'UAE', callingCode: '+971', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', callingCode: '+966', flag: '🇸🇦' },
    { code: 'MY', name: 'Malaysia', callingCode: '+60', flag: '🇲🇾' },
    { code: 'PH', name: 'Philippines', callingCode: '+63', flag: '🇵🇭' },
    { code: 'TH', name: 'Thailand', callingCode: '+66', flag: '🇹🇭' },
    { code: 'VN', name: 'Vietnam', callingCode: '+84', flag: '🇻🇳' },
    { code: 'ID', name: 'Indonesia', callingCode: '+62', flag: '🇮🇩' },
    { code: 'PK', name: 'Pakistan', callingCode: '+92', flag: '🇵🇰' },
    { code: 'BD', name: 'Bangladesh', callingCode: '+880', flag: '🇧🇩' },
    { code: 'LK', name: 'Sri Lanka', callingCode: '+94', flag: '🇱🇰' },
    { code: 'NP', name: 'Nepal', callingCode: '+977', flag: '🇳🇵' },
    { code: 'ZA', name: 'South Africa', callingCode: '+27', flag: '🇿🇦' },
    { code: 'KE', name: 'Kenya', callingCode: '+254', flag: '🇰🇪' },
    { code: 'NG', name: 'Nigeria', callingCode: '+234', flag: '🇳🇬' },
    { code: 'BR', name: 'Brazil', callingCode: '+55', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', callingCode: '+52', flag: '🇲🇽' },
    { code: 'ES', name: 'Spain', callingCode: '+34', flag: '🇪🇸' },
    { code: 'IT', name: 'Italy', callingCode: '+39', flag: '🇮🇹' },
    { code: 'NL', name: 'Netherlands', callingCode: '+31', flag: '🇳🇱' },
    { code: 'SE', name: 'Sweden', callingCode: '+46', flag: '🇸🇪' },
    { code: 'NO', name: 'Norway', callingCode: '+47', flag: '🇳🇴' },
    { code: 'NZ', name: 'New Zealand', callingCode: '+64', flag: '🇳🇿' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChange,
    placeholder = 'Enter phone number',
    disabled = false,
    error,
    label,
    defaultCountry = 'IN',
}) => {
    const [countries] = useState<Country[]>(DEFAULT_COUNTRIES);
    const [selectedCountry, setSelectedCountry] = useState<Country>(
        countries.find(c => c.code === defaultCountry) || countries[0]
    );
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.callingCode.includes(searchQuery)
    );

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        setSearchQuery('');
        onChange(value, country.code);
        inputRef.current?.focus();
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const phone = e.target.value.replace(/\D/g, '');
        onChange(phone, selectedCountry.code);
    };

    return (
        <div className="phone-input-container">
            {label && <label className="phone-label">{label}</label>}

            <div className={`phone-input-wrapper ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
                {/* Country Selector */}
                <div className="country-selector" ref={dropdownRef}>
                    <button
                        type="button"
                        className="country-button"
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        disabled={disabled}
                    >
                        <span className="country-flag">{selectedCountry.flag}</span>
                        <span className="country-code">{selectedCountry.callingCode}</span>
                        <span className="dropdown-arrow">▼</span>
                    </button>

                    {isOpen && (
                        <div className="country-dropdown">
                            <input
                                type="text"
                                className="country-search"
                                placeholder="Search country..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <div className="country-list">
                                {filteredCountries.map(country => (
                                    <button
                                        key={country.code}
                                        type="button"
                                        className={`country-option ${country.code === selectedCountry.code ? 'selected' : ''}`}
                                        onClick={() => handleCountrySelect(country)}
                                    >
                                        <span className="country-flag">{country.flag}</span>
                                        <span className="country-name">{country.name}</span>
                                        <span className="country-calling-code">{country.callingCode}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Phone Input */}
                <input
                    ref={inputRef}
                    type="tel"
                    className="phone-number-input"
                    value={value}
                    onChange={handlePhoneChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    inputMode="numeric"
                />
            </div>

            {error && <p className="phone-error">{error}</p>}

            <style>{`
        .phone-input-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .phone-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .phone-input-wrapper {
          display: flex;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          transition: all 0.2s ease;
        }

        .phone-input-wrapper:focus-within {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .phone-input-wrapper.error {
          border-color: #ef4444;
        }

        .phone-input-wrapper.disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }

        .country-selector {
          position: relative;
        }

        .country-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 10px;
          background: #f8fafc;
          border: none;
          border-right: 1px solid #e2e8f0;
          cursor: pointer;
          font-size: 14px;
          min-width: 100px;
        }

        .country-button:hover:not(:disabled) {
          background: #f1f5f9;
        }

        .country-button:disabled {
          cursor: not-allowed;
        }

        .country-flag {
          font-size: 20px;
        }

        .country-code {
          color: #374151;
          font-weight: 500;
        }

        .dropdown-arrow {
          font-size: 10px;
          color: #9ca3af;
        }

        .country-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          min-width: 280px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          z-index: 100;
          margin-top: 4px;
          overflow: hidden;
        }

        .country-search {
          width: 100%;
          padding: 12px;
          border: none;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
          outline: none;
        }

        .country-list {
          max-height: 240px;
          overflow-y: auto;
        }

        .country-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border: none;
          background: none;
          cursor: pointer;
          text-align: left;
        }

        .country-option:hover {
          background: #f8fafc;
        }

        .country-option.selected {
          background: #eef2ff;
        }

        .country-name {
          flex: 1;
          font-size: 14px;
          color: #374151;
        }

        .country-calling-code {
          font-size: 13px;
          color: #6b7280;
        }

        .phone-number-input {
          flex: 1;
          padding: 12px;
          border: none;
          font-size: 16px;
          outline: none;
          background: transparent;
        }

        .phone-number-input:disabled {
          cursor: not-allowed;
        }

        .phone-error {
          color: #ef4444;
          font-size: 13px;
          margin: 0;
        }
      `}</style>
        </div>
    );
};

export default PhoneInput;
