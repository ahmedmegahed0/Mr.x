import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTokens, loadTokens, saveTokens } from '../api/axiosInstance';
import { logout as apiLogout, revokeRefresh, TokenResponseDTO } from '../api/auth.api';

// ─── Interfaces ───────────────────────────────────────────────
export interface PendingBooking {
  barberId: string | number;
  bookingDate: string;
  startTime: string;
  serviceIds: (string | number)[];
  couponCode?: string;
}

export interface AuthContextValue {
  tokens: TokenResponseDTO | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  handleLoginSuccess: (tokenData: TokenResponseDTO) => void;
  handleLogout: () => Promise<void>;
  updateProfilePictureUrl: (newUrl: string) => void;
}

// ─── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<TokenResponseDTO | null>(() => loadTokens());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /** Derived: true when we have a valid access token */
  const isAuthenticated = Boolean(tokens?.accessToken);

  /**
   * Called after successful OTP verification or Google OAuth callback.
   * Persists TokenResponseDTO and checks for pending bookings to redirect.
   */
  const handleLoginSuccess = useCallback((tokenData: TokenResponseDTO) => {
    saveTokens(tokenData);
    setTokens(tokenData);

    // Check for pending booking state in sessionStorage
    const pendingBookingRaw = sessionStorage.getItem('pendingBooking');
    if (pendingBookingRaw) {
      try {
        const pendingBooking: PendingBooking = JSON.parse(pendingBookingRaw);
        if (pendingBooking.barberId) {
          navigate(`/barbers/${pendingBooking.barberId}/book`, { replace: true });
          return;
        }
      } catch (err) {
        console.error('Failed to parse pending booking', err);
      }
    }

    // Default redirect
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  /**
   * Full logout:
   *  1. Revoke the refresh token on the server
   *  2. Call /api/Auth/logout
   *  3. Clear local storage & state → redirect to /auth
   */
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const currentTokens = loadTokens();
      if (currentTokens?.refreshToken) {
        // Best-effort – don't block logout on failure
        await revokeRefresh(currentTokens.refreshToken).catch(() => {});
      }
      await apiLogout().catch(() => {});
    } finally {
      clearTokens();
      setTokens(null);
      setIsLoggingOut(false);
      navigate('/auth', { replace: true });
    }
  }, [navigate]);

  /**
   * Listen for the global `auth:expired` event fired by the
   * Axios interceptor when token refresh fails.
   */
  useEffect(() => {
    const onExpired = () => {
      clearTokens();
      setTokens(null);
      navigate('/auth', { replace: true });
    };

    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [navigate]);

  /**
   * Update the user's profile picture URL in context and local storage
   */
  const updateProfilePictureUrl = useCallback((newUrl: string) => {
    setTokens((prev) => {
      if (!prev) return prev;
      const updated: TokenResponseDTO = { ...prev, profilePictureUrl: newUrl };
      saveTokens(updated);
      return updated;
    });
  }, []);

  // ── Context value ────────────────────────────────────────────
  const value = useMemo(
    () => ({
      tokens,
      isAuthenticated,
      isLoggingOut,
      handleLoginSuccess,
      handleLogout,
      updateProfilePictureUrl,
    }),
    [tokens, isAuthenticated, isLoggingOut, handleLoginSuccess, handleLogout, updateProfilePictureUrl]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
