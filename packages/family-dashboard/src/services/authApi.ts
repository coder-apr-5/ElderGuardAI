// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Auth API Service - Frontend API Client
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    error?: string;
    [key: string]: unknown;
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

interface User {
    uid: string;
    role: 'elder' | 'family';
    phone?: string;
    email?: string;
    fullName: string;
    age?: number;
    accountStatus: string;
    profilePicture?: string;
}

interface AuthResponse extends ApiResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

interface Country {
    code: string;
    name: string;
    callingCode: string;
    flag: string;
}

// Token storage
const TOKEN_KEY = 'eldernest_access_token';
const REFRESH_TOKEN_KEY = 'eldernest_refresh_token';
const USER_KEY = 'eldernest_user';

export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): User | null {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
}

export function storeAuthData(data: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function clearAuthData(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// API helper
async function apiRequest<T = ApiResponse>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getStoredToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
    }

    return data as T;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Elder Signup API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function elderSignupStep1(phone: string, countryCode: string): Promise<ApiResponse> {
    return apiRequest('/auth/elder/signup/step1', {
        method: 'POST',
        body: JSON.stringify({ phone, countryCode }),
    });
}

export async function elderSignupStep2(phone: string, countryCode: string, otp: string): Promise<ApiResponse & { verificationToken?: string }> {
    return apiRequest('/auth/elder/signup/step2', {
        method: 'POST',
        body: JSON.stringify({ phone, countryCode, otp }),
    });
}

export async function elderSignupStep3(data: {
    phone: string;
    countryCode: string;
    fullName: string;
    age: number;
    familyPhone: string;
    familyCountryCode: string;
    familyRelation: string;
    verificationToken: string;
}): Promise<ApiResponse & { pendingConnectionId?: string; familyPhoneDisplay?: string }> {
    return apiRequest('/auth/elder/signup/step3', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function elderSignupStep4(pendingConnectionId: string, otp: string): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/elder/signup/step4', {
        method: 'POST',
        body: JSON.stringify({ pendingConnectionId, otp }),
    });

    if (response.success) {
        storeAuthData(response);
    }

    return response;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Family Signup API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function familySignup(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    countryCode?: string;
}): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/family/signup', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (response.success) {
        storeAuthData(response);
    }

    return response;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Login API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function phoneLoginStep1(phone: string, countryCode: string): Promise<ApiResponse> {
    return apiRequest('/auth/login/phone', {
        method: 'POST',
        body: JSON.stringify({ phone, countryCode }),
    });
}

export async function phoneLoginStep2(phone: string, countryCode: string, otp: string): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, countryCode, otp }),
    });

    if (response.success) {
        storeAuthData(response);
    }

    return response;
}

export async function emailLogin(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login/email', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (response.success) {
        storeAuthData(response);
    }

    return response;
}

export async function googleLogin(idToken: string, role: 'elder' | 'family'): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, role }),
    });

    if (response.success) {
        storeAuthData(response);
    }

    return response;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Token Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function refreshToken(): Promise<{ accessToken: string; expiresIn: number }> {
    const refreshTokenValue = getStoredRefreshToken();

    if (!refreshTokenValue) {
        throw new Error('No refresh token');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        clearAuthData();
        throw new Error('Session expired');
    }

    localStorage.setItem(TOKEN_KEY, data.accessToken);

    return { accessToken: data.accessToken, expiresIn: data.expiresIn };
}

export async function logout(): Promise<void> {
    const refreshTokenValue = getStoredRefreshToken();

    try {
        await apiRequest('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: refreshTokenValue }),
        });
    } catch {
        // Ignore errors during logout
    }

    clearAuthData();
}

export async function getCurrentUser(): Promise<User | null> {
    try {
        const response = await apiRequest<{ user: User }>('/auth/me');
        return response.user;
    } catch {
        return null;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Countries API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getCountries(): Promise<Country[]> {
    const response = await apiRequest<{ countries: Country[] }>('/countries');
    return response.countries;
}

export async function searchCountries(query: string): Promise<Country[]> {
    const response = await apiRequest<{ countries: Country[] }>(`/countries/search?q=${encodeURIComponent(query)}`);
    return response.countries;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Connections API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getConnectedElders(): Promise<User[]> {
    const response = await apiRequest<{ elders: User[] }>('/connections/elders');
    return response.elders;
}

export async function getConnectedFamily(): Promise<User[]> {
    const response = await apiRequest<{ family: User[] }>('/connections/family');
    return response.family;
}

export async function getPendingConnectionStatus(id: string): Promise<{
    id: string;
    elderName: string;
    status: string;
    expiresAt: string;
    familyRelation: string;
}> {
    const response = await apiRequest<{
        connection: {
            id: string;
            elderName: string;
            status: string;
            expiresAt: string;
            familyRelation: string;
        }
    }>(`/connections/pending/${id}`);
    return response.connection;
}

export default {
    // Auth
    elderSignupStep1,
    elderSignupStep2,
    elderSignupStep3,
    elderSignupStep4,
    familySignup,
    phoneLoginStep1,
    phoneLoginStep2,
    emailLogin,
    googleLogin,
    refreshToken,
    logout,
    getCurrentUser,
    // Storage
    getStoredToken,
    getStoredRefreshToken,
    getStoredUser,
    storeAuthData,
    clearAuthData,
    // Countries
    getCountries,
    searchCountries,
    // Connections
    getConnectedElders,
    getConnectedFamily,
    getPendingConnectionStatus,
};
