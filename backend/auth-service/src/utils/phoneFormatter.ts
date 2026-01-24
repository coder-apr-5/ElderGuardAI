// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phone Number Formatting & Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
    parsePhoneNumber,
    isValidPhoneNumber,
    getCountryCallingCode,
    CountryCode,
    PhoneNumber,
} from 'libphonenumber-js';
import type { PhoneValidationResult, CountryConfig } from '../types';

/**
 * Supported countries configuration
 */
export const COUNTRY_CONFIGS: CountryConfig[] = [
    // North America
    { code: 'US', name: 'United States', callingCode: '+1', phoneFormat: '(XXX) XXX-XXXX', minLength: 10, maxLength: 10, flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', callingCode: '+1', phoneFormat: '(XXX) XXX-XXXX', minLength: 10, maxLength: 10, flag: '🇨🇦' },

    // Europe
    { code: 'GB', name: 'United Kingdom', callingCode: '+44', phoneFormat: 'XXXX XXXXXX', minLength: 10, maxLength: 11, flag: '🇬🇧' },
    { code: 'FR', name: 'France', callingCode: '+33', phoneFormat: 'X XX XX XX XX', minLength: 9, maxLength: 9, flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', callingCode: '+49', phoneFormat: 'XXX XXXXXXXX', minLength: 10, maxLength: 12, flag: '🇩🇪' },
    { code: 'ES', name: 'Spain', callingCode: '+34', phoneFormat: 'XXX XXX XXX', minLength: 9, maxLength: 9, flag: '🇪🇸' },
    { code: 'IT', name: 'Italy', callingCode: '+39', phoneFormat: 'XXX XXX XXXX', minLength: 9, maxLength: 11, flag: '🇮🇹' },
    { code: 'NL', name: 'Netherlands', callingCode: '+31', phoneFormat: 'X XXXXXXXX', minLength: 9, maxLength: 9, flag: '🇳🇱' },
    { code: 'SE', name: 'Sweden', callingCode: '+46', phoneFormat: 'XX XXX XX XX', minLength: 9, maxLength: 9, flag: '🇸🇪' },
    { code: 'NO', name: 'Norway', callingCode: '+47', phoneFormat: 'XXX XX XXX', minLength: 8, maxLength: 8, flag: '🇳🇴' },
    { code: 'DK', name: 'Denmark', callingCode: '+45', phoneFormat: 'XX XX XX XX', minLength: 8, maxLength: 8, flag: '🇩🇰' },
    { code: 'FI', name: 'Finland', callingCode: '+358', phoneFormat: 'XX XXX XXXX', minLength: 9, maxLength: 10, flag: '🇫🇮' },

    // Asia
    { code: 'IN', name: 'India', callingCode: '+91', phoneFormat: 'XXXXX XXXXX', minLength: 10, maxLength: 10, flag: '🇮🇳' },
    { code: 'PK', name: 'Pakistan', callingCode: '+92', phoneFormat: 'XXX XXXXXXX', minLength: 10, maxLength: 10, flag: '🇵🇰' },
    { code: 'BD', name: 'Bangladesh', callingCode: '+880', phoneFormat: 'XXXX XXXXXX', minLength: 10, maxLength: 10, flag: '🇧🇩' },
    { code: 'LK', name: 'Sri Lanka', callingCode: '+94', phoneFormat: 'XX XXX XXXX', minLength: 9, maxLength: 9, flag: '🇱🇰' },
    { code: 'NP', name: 'Nepal', callingCode: '+977', phoneFormat: 'XXX XXX XXXX', minLength: 10, maxLength: 10, flag: '🇳🇵' },
    { code: 'SG', name: 'Singapore', callingCode: '+65', phoneFormat: 'XXXX XXXX', minLength: 8, maxLength: 8, flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', callingCode: '+60', phoneFormat: 'XX XXXX XXXX', minLength: 9, maxLength: 10, flag: '🇲🇾' },
    { code: 'TH', name: 'Thailand', callingCode: '+66', phoneFormat: 'XX XXX XXXX', minLength: 9, maxLength: 9, flag: '🇹🇭' },
    { code: 'PH', name: 'Philippines', callingCode: '+63', phoneFormat: 'XXX XXX XXXX', minLength: 10, maxLength: 10, flag: '🇵🇭' },
    { code: 'VN', name: 'Vietnam', callingCode: '+84', phoneFormat: 'XXX XXX XXXX', minLength: 9, maxLength: 10, flag: '🇻🇳' },
    { code: 'ID', name: 'Indonesia', callingCode: '+62', phoneFormat: 'XXX XXXX XXXX', minLength: 10, maxLength: 12, flag: '🇮🇩' },

    // Middle East
    { code: 'AE', name: 'UAE', callingCode: '+971', phoneFormat: 'XX XXX XXXX', minLength: 9, maxLength: 9, flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', callingCode: '+966', phoneFormat: 'XX XXX XXXX', minLength: 9, maxLength: 9, flag: '🇸🇦' },

    // Africa
    { code: 'ZA', name: 'South Africa', callingCode: '+27', phoneFormat: 'XX XXX XXXX', minLength: 9, maxLength: 9, flag: '🇿🇦' },
    { code: 'KE', name: 'Kenya', callingCode: '+254', phoneFormat: 'XXX XXX XXX', minLength: 9, maxLength: 9, flag: '🇰🇪' },
    { code: 'NG', name: 'Nigeria', callingCode: '+234', phoneFormat: 'XXX XXX XXXX', minLength: 10, maxLength: 10, flag: '🇳🇬' },
    { code: 'GH', name: 'Ghana', callingCode: '+233', phoneFormat: 'XX XXX XXXX', minLength: 9, maxLength: 9, flag: '🇬🇭' },
    { code: 'EG', name: 'Egypt', callingCode: '+20', phoneFormat: 'XX XXXX XXXX', minLength: 10, maxLength: 10, flag: '🇪🇬' },

    // Latin America
    { code: 'BR', name: 'Brazil', callingCode: '+55', phoneFormat: 'XX XXXXX XXXX', minLength: 10, maxLength: 11, flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', callingCode: '+52', phoneFormat: 'XX XXXX XXXX', minLength: 10, maxLength: 10, flag: '🇲🇽' },
    { code: 'AR', name: 'Argentina', callingCode: '+54', phoneFormat: 'XX XXXX XXXX', minLength: 10, maxLength: 10, flag: '🇦🇷' },
    { code: 'CL', name: 'Chile', callingCode: '+56', phoneFormat: 'X XXXX XXXX', minLength: 9, maxLength: 9, flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', callingCode: '+57', phoneFormat: 'XXX XXX XXXX', minLength: 10, maxLength: 10, flag: '🇨🇴' },
    { code: 'PE', name: 'Peru', callingCode: '+51', phoneFormat: 'XXX XXX XXX', minLength: 9, maxLength: 9, flag: '🇵🇪' },

    // Oceania
    { code: 'AU', name: 'Australia', callingCode: '+61', phoneFormat: 'XXX XXX XXX', minLength: 9, maxLength: 9, flag: '🇦🇺' },
    { code: 'NZ', name: 'New Zealand', callingCode: '+64', phoneFormat: 'XX XXX XXXX', minLength: 9, maxLength: 10, flag: '🇳🇿' },
];

/**
 * Get supported country codes from environment
 */
export function getSupportedCountries(): string[] {
    const envCountries = process.env.SUPPORTED_COUNTRIES;
    if (envCountries) {
        return envCountries.split(',').map(c => c.trim().toUpperCase());
    }
    return COUNTRY_CONFIGS.map(c => c.code);
}

/**
 * Check if country is supported
 */
export function isCountrySupported(countryCode: string): boolean {
    return getSupportedCountries().includes(countryCode.toUpperCase());
}

/**
 * Get country configuration
 */
export function getCountryConfig(countryCode: string): CountryConfig | undefined {
    return COUNTRY_CONFIGS.find(c => c.code === countryCode.toUpperCase());
}

/**
 * Validate phone number for a specific country
 */
export function validatePhone(phoneNumber: string, countryCode?: string): PhoneValidationResult {
    try {
        // Remove all non-digit characters except +
        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

        // Try to parse the phone number
        let parsedNumber: PhoneNumber | undefined;

        if (countryCode) {
            // Validate country is supported
            if (!isCountrySupported(countryCode)) {
                return {
                    isValid: false,
                    error: `Country ${countryCode} is not supported`,
                };
            }

            parsedNumber = parsePhoneNumber(cleanNumber, countryCode.toUpperCase() as CountryCode);
        } else {
            // Try to parse with + prefix (E.164 format)
            if (cleanNumber.startsWith('+')) {
                parsedNumber = parsePhoneNumber(cleanNumber);
            } else {
                return {
                    isValid: false,
                    error: 'Country code is required for national format numbers',
                };
            }
        }

        if (!parsedNumber) {
            return {
                isValid: false,
                error: 'Unable to parse phone number',
            };
        }

        // Validate the number
        if (!isValidPhoneNumber(parsedNumber.number)) {
            return {
                isValid: false,
                error: 'Invalid phone number format',
            };
        }

        // Check if the country is supported
        const detectedCountry = parsedNumber.country;
        if (detectedCountry && !isCountrySupported(detectedCountry)) {
            return {
                isValid: false,
                error: `Country ${detectedCountry} is not supported`,
            };
        }

        // Check if it's a mobile number (optional, depends on your requirements)
        const numberType = parsedNumber.getType();
        const isMobile = numberType === 'MOBILE' || numberType === 'FIXED_LINE_OR_MOBILE';

        return {
            isValid: true,
            e164Format: parsedNumber.format('E.164'),
            nationalFormat: parsedNumber.formatNational(),
            countryCode: parsedNumber.country,
            countryCallingCode: '+' + getCountryCallingCode(parsedNumber.country as CountryCode),
            isMobile,
        };
    } catch (error) {
        return {
            isValid: false,
            error: 'Invalid phone number',
        };
    }
}

/**
 * Format phone number to E.164
 */
export function formatToE164(phoneNumber: string, countryCode: string): string | null {
    const validation = validatePhone(phoneNumber, countryCode);
    return validation.isValid ? validation.e164Format! : null;
}

/**
 * Format phone number for display
 */
export function formatForDisplay(e164Phone: string): string {
    try {
        const parsed = parsePhoneNumber(e164Phone);
        return parsed?.formatNational() || e164Phone;
    } catch {
        return e164Phone;
    }
}

/**
 * Mask phone number for display (show last 4 digits)
 */
export function maskPhoneNumber(phone: string): string {
    if (phone.length < 4) return '****';
    return '****' + phone.slice(-4);
}

export default {
    COUNTRY_CONFIGS,
    getSupportedCountries,
    isCountrySupported,
    getCountryConfig,
    validatePhone,
    formatToE164,
    formatForDisplay,
    maskPhoneNumber,
};
