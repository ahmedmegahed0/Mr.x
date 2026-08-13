import axiosInstance from './axiosInstance';

export interface TokenResponseDTO {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  profilePictureUrl?: string;
}

export interface SendCodeRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Step 1 – Request OTP
 * POST /api/Auth/send-verification-code
 */
export const sendVerificationCode = async (email: string): Promise<void> => {
  await axiosInstance.post('/api/Auth/send-verification-code', { email });
};

/**
 * Step 2 – Verify OTP → receive tokens
 * POST /api/Auth/verify-code
 */
export const verifyCode = async (email: string, code: string): Promise<TokenResponseDTO> => {
  const { data } = await axiosInstance.post<TokenResponseDTO>('/api/Auth/verify-code', { email, code });
  return data;
};

/**
 * Google OAuth redirect URL
 * GET /api/Auth/google-login?returnUrl={encodedCallbackUrl}
 */
export const getGoogleLoginUrl = (returnUrl: string): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/api/Auth/google-login?returnUrl=${encodeURIComponent(returnUrl)}`;
};

/**
 * Refresh access token
 * POST /api/Auth/refresh-token
 */
export const refreshToken = async (refreshTokenValue: string): Promise<TokenResponseDTO> => {
  const { data } = await axiosInstance.post<TokenResponseDTO>('/api/Auth/refresh-token', { refreshToken: refreshTokenValue });
  return data;
};

/**
 * Revoke refresh token
 * POST /api/Auth/revoke-refresh
 */
export const revokeRefresh = async (refreshTokenValue: string): Promise<void> => {
  await axiosInstance.post('/api/Auth/revoke-refresh', { refreshToken: refreshTokenValue });
};

/**
 * Logout (invalidates server-side session)
 * POST /api/Auth/logout
 * Authorization header is auto-attached by axiosInstance interceptor
 */
export const logout = async (): Promise<void> => {
  await axiosInstance.post('/api/Auth/logout');
};

/**
 * Upload/Update Profile Picture
 * PUT /api/Auth/me/profile-picture
 */
export const uploadProfilePicture = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('File', file);
  await axiosInstance.put('/api/Auth/me/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Delete Profile Picture
 * DELETE /api/Auth/me/profile-picture
 */
export const deleteProfilePicture = async (): Promise<void> => {
  await axiosInstance.delete('/api/Auth/me/profile-picture');
};
