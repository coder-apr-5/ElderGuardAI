/**
 * ElderNest AI - Auth API Services
 * Handles phone-based authentication flow.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

/**
 * Helper to process the standardized API response and flatten it for backward compatibility
 */
const processResponse = async (response: Response): Promise<ApiResponse> => {
  try {
    const result = await response.json();
    
    // If successful and has a data property, flatten it to the top level
    if (result.success && result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
      return {
        ...result,
        ...result.data
      };
    }
    
    // If it's an error and has an 'error' field instead of 'message', bridge it
    if (!result.success && result.error && !result.message) {
      return {
        ...result,
        message: result.error
      };
    }
    
    return result;
  } catch (error) {
    console.error('Failed to parse API response:', error);
    return { success: false, message: 'Invalid server response. Please try again.' };
  }
};

/**
 * Step 1: Send OTP to elder's phone
 * @param phone Phone number without country code
 * @param countryCode ISO country code (e.g., 'IN')
 */
export const elderSignupStep1 = async (phone: string, countryCode: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/elder/signup/step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, countryCode }),
    });

    return await processResponse(response);
  } catch (error) {
    console.error('API Error in Step 1:', error);
    return { success: false, message: 'Network error. Please check your connection.' };
  }
};

/**
 * Step 2: Verify elder's OTP
 * @param phone Phone number without country code
 * @param countryCode ISO country code
 * @param otp 6-digit OTP
 */
export const elderSignupStep2 = async (phone: string, countryCode: string, otp: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/elder/signup/step2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, countryCode, otp }),
    });

    return await processResponse(response);
  } catch (error) {
    console.error('API Error in Step 2:', error);
    return { success: false, message: 'Network error. Verification failed.' };
  }
};

/**
 * Step 3: Register elder details and trigger family member verification
 * @param data Elder details and family member phone
 */
export const elderSignupStep3 = async (data: {
  phone: string;
  countryCode: string;
  fullName: string;
  age: number;
  familyPhone: string;
  familyCountryCode: string;
  familyRelation: string;
  verificationToken: string;
}): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/elder/signup/step3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return await processResponse(response);
  } catch (error) {
    console.error('API Error in Step 3:', error);
    return { success: false, message: 'Registration failed. Network error.' };
  }
};

/**
 * Step 4: Verify family member's verification code
 * @param pendingConnectionId ID from Step 3
 * @param otp Security code from family member
 */
export const elderSignupStep4 = async (pendingConnectionId: string, otp: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/elder/signup/step4`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pendingConnectionId, otp }),
    });

    return await processResponse(response);
  } catch (error) {
    console.error('API Error in Step 4:', error);
    return { success: false, message: 'Security verification failed.' };
  }
};

