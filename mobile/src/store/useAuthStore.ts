import * as authApi from '@/src/api/authApi';
import { authKeys, setItem } from '@/src/auth/storage';
import { setHttpAccessToken, setHttpRefreshHooks } from '@/src/lib/http';
import { registerForPushNotifications } from '@/src/lib/pushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const TOKEN_KEY = '@finoryx_token';
const REFRESH_TOKEN_KEY = '@finoryx_refresh_token';

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: authApi.UserProfile | null;
  pendingVerificationEmail: string | null;

  // Actions
  initialize: () => Promise<void>;
  loginUser: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  registerUser: (fullName: string, email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
  user: null,
  pendingVerificationEmail: null,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

      if (token) {
        setHttpAccessToken(token);
        try {
          setHttpRefreshHooks({
            getRefreshToken: () => get().refreshToken,
            onNewAccessToken: async (newInfo) => {
              // The hook contract might return just the string, or an object. 
              // Based on http.ts: `const nextAccessToken = await refreshPromise;` -> it returns a string.
              // Logic in AuthContext just updated the state. 
              // We need to re-verify this assumption from internal logic or just update the token.

              // However, checking http.ts: `await refreshHooks.onNewAccessToken(nextAccessToken);`
              // So the arg is the string accessToken.

              const currentRefreshToken = get().refreshToken;
              if (currentRefreshToken) {
                // If we wanted to parse the token to update user profile we could, 
                // but simplest is just update the token for now.
                setHttpAccessToken(newInfo);
                set({ token: newInfo });
                await AsyncStorage.setItem(TOKEN_KEY, newInfo);
              }
            },
            onAuthFailure: async () => {
              await get().logoutUser();
            }
          });

          const user = await authApi.getUserProfile();
          set({
            token,
            refreshToken,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          void registerForPushNotifications();
        } catch (error) {
          // Token invalid, clear storage
          await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
          setHttpAccessToken(null);
          setHttpRefreshHooks(null);
          set({
            token: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  loginUser: async (email: string, password: string, rememberMe: boolean = true) => {
    console.log('Login attempt:', { email, passwordLength: password.length });

    const result = await authApi.login({ email, password });

    if (result.requiresOtp) {
      set({ pendingVerificationEmail: email });
      await setItem(authKeys.pendingEmail, email);
      const err = new Error('OTP verification required. Please check your email for the code.') as Error & {
        status?: number;
      };
      err.status = 403;
      throw err;
    }

    const tokens = result;
    console.log('Login successful, tokens received');

    // Check if tokens exist before storing
    if (!tokens?.accessToken) {
      throw new Error('Invalid response from server');
    }

    // Store tokens only if Remember Me is enabled
    if (rememberMe) {
      await AsyncStorage.setItem(TOKEN_KEY, tokens.accessToken);
      if (tokens.refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      } else {
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } else {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
    }

    // Set HTTP token
    setHttpAccessToken(tokens.accessToken);

    // Get user profile
    const user = await authApi.getUserProfile();

    set({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
      user,
      isAuthenticated: true,
    });
    void registerForPushNotifications();
  },

  registerUser: async (fullName: string, email: string, password: string) => {
    console.log('Register attempt:', { fullName, email, passwordLength: password.length });
    await authApi.register({ fullName, email, password });
    console.log('Registration successful, awaiting OTP verification');

    // Store email for OTP verification
    set({
      pendingVerificationEmail: email,
      isAuthenticated: false,
    });

    await setItem(authKeys.pendingEmail, email);
  },

  verifyOtp: async (email: string, otp: string) => {
    console.log('OTP verification attempt:', { email, otp });
    const tokens = await authApi.verifyOtp({ email, otp });
    console.log('OTP verified, tokens received');

    // Check if tokens exist before storing
    if (!tokens?.accessToken) {
      throw new Error('Invalid response from server');
    }

    // Store tokens
    await AsyncStorage.setItem(TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } else {
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    // Set HTTP token
    setHttpAccessToken(tokens.accessToken);

    // Get user profile
    const user = await authApi.getUserProfile();

    set({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
      user,
      isAuthenticated: true,
      pendingVerificationEmail: null,
    });
    void registerForPushNotifications();

    await setItem(authKeys.pendingEmail, null);
  },

  logoutUser: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API fails
    }

    // Clear storage
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);

    // Clear HTTP token
    setHttpAccessToken(null);

    // Clear state
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  clearError: () => {
    // For future error state if needed
  },
}));
