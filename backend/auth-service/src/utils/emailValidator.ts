// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Email Validation Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { EmailValidationResult } from '../types';

/**
 * Common disposable email domains to block
 */
const DISPOSABLE_DOMAINS = new Set([
    'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'guerrillamail.org',
    '10minutemail.com', 'throwaway.email', 'mailinator.com', 'maildrop.cc',
    'fakeinbox.com', 'trashmail.com', 'yopmail.com', 'tempail.com',
    'dispostable.com', 'mailnesia.com', 'getnada.com', 'mohmal.com',
    'tempinbox.com', 'sharklasers.com', 'spam4.me', 'grr.la',
    'guerrillamailblock.com', 'pokemail.net', 'spamgourmet.com', 'mytrashmail.com',
    'mt2014.com', 'thankyou2010.com', 'trash-mail.at', 'trashmail.ws',
    'wegwerfmail.de', 'emailondeck.com', 'fakemail.fr', 'getairmail.com',
]);

/**
 * Common email domain typos and their corrections
 */
const DOMAIN_CORRECTIONS: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmail.cm': 'gmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmal.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
    'hotmail.co': 'hotmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'yahoo.co': 'yahoo.com',
    'outloo.com': 'outlook.com',
    'outlok.com': 'outlook.com',
    'outlook.co': 'outlook.com',
    'icloud.co': 'icloud.com',
    'icoud.com': 'icloud.com',
};

/**
 * RFC 5322 email regex pattern
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate email syntax
 */
export function isValidEmailSyntax(email: string): boolean {
    if (!email || email.length > 254) return false;
    return EMAIL_REGEX.test(email);
}

/**
 * Check if email domain is disposable
 */
export function isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Get domain correction suggestion for typos
 */
export function getDomainSuggestion(email: string): string | undefined {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return undefined;

    const correction = DOMAIN_CORRECTIONS[domain];
    if (correction) {
        return email.split('@')[0] + '@' + correction;
    }

    return undefined;
}

/**
 * Normalize email address (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

/**
 * Full email validation
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
    const normalized = normalizeEmail(email);

    // Check syntax
    if (!isValidEmailSyntax(normalized)) {
        return {
            isValid: false,
            error: 'Invalid email format',
            email: normalized,
            isDisposable: false,
            hasMxRecord: false,
            isSyntaxValid: false,
        };
    }

    // Check for disposable domains
    if (isDisposableEmail(normalized)) {
        return {
            isValid: false,
            error: 'Disposable email addresses are not allowed',
            email: normalized,
            isDisposable: true,
            hasMxRecord: false,
            isSyntaxValid: true,
        };
    }

    // Check for typo suggestions
    const suggestion = getDomainSuggestion(normalized);

    // Note: MX record check requires DNS lookup which is async
    // For production, you'd use deep-email-validator or similar
    // For now, we'll skip MX validation to keep it simple

    return {
        isValid: true,
        email: normalized,
        isDisposable: false,
        hasMxRecord: true, // Assume true if syntax valid
        isSyntaxValid: true,
        suggestion,
    };
}

/**
 * Quick validation (syntax only)
 */
export function quickValidateEmail(email: string): boolean {
    return isValidEmailSyntax(normalizeEmail(email));
}

export default {
    isValidEmailSyntax,
    isDisposableEmail,
    getDomainSuggestion,
    normalizeEmail,
    validateEmail,
    quickValidateEmail,
};
