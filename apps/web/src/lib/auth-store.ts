/**
 * Auth state management using Zustand.
 * Stores access and refresh tokens with persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  clearTokens: () => void;
  isAuthenticated: () => boolean;
}

/**
 * Auth store for managing authentication tokens.
 * Persists to localStorage automatically.
 * Also syncs to cookies for middleware access.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (tokens) => {
        set(tokens);
        // Sync to cookie for middleware
        if (typeof document !== 'undefined') {
          document.cookie = `auth-storage=${JSON.stringify(tokens)}; path=/; max-age=604800`; // 7 days
        }
      },
      clearTokens: () => {
        set({ accessToken: null, refreshToken: null });
        // Clear cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-storage=; path=/; max-age=0';
        }
      },
      isAuthenticated: () => {
        return !!get().accessToken;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

