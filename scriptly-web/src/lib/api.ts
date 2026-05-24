import axios from 'axios';
import { useAuthStore } from '@/hooks/useAuth';

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 접두사 /api/v1이 누락된 경우 자동으로 추가
if (!API_BASE_URL.endsWith('/api/v1')) {
  // 끝에 슬래시가 있다면 제거 후 추가
  API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api/v1';
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 자동 주입
api.interceptors.request.use(
  (config) => {
    // Zustand store에서 토큰 가져오기 (비동기 스토리지 고려 안함)
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 인증 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 로그인 요청(/auth/login)에서 발생한 401 에러는 리다이렉트하지 않고 페이지단에서 에러 처리를 하도록 건너뜁니다.
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        // 인증 만료 또는 유효하지 않은 토큰
        useAuthStore.getState().logout();
        // 브라우저 환경인 경우 로그인 페이지로 리다이렉트 유도
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
