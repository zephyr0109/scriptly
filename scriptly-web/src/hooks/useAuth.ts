import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'ADMIN' | 'USER';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ 
        user, 
        accessToken: token, 
        isAuthenticated: true 
      }),

      logout: () => set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false 
      }),

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'scriptly-auth-storage', // 로컬 스토리지 키
    }
  )
);
