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
  hasHydrated: boolean; // 로컬 스토리지 인증 복원 상태 추가
  
  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: false, // 초기값 false

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
      setHasHydrated: (state) => set({ hasHydrated: state })
    }),
    {
      name: 'scriptly-auth-storage', // 로컬 스토리지 키
      onRehydrateStorage: () => (state) => {
        // 로컬 스토리지 복원 완료 시점에 호출
        state?.setHasHydrated(true);
      }
    }
  )
);
