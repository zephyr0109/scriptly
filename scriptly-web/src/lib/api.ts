import axios from 'axios';

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

// 요청 인터셉터: 토큰 자동 주입 (Zustand 임포트 제거하여 순환 참조 원천 차단)
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        const authDataStr = localStorage.getItem('scriptly-auth-storage');
        if (authDataStr) {
          const authData = JSON.parse(authDataStr);
          // Zustand persist 구조: state 내부에 accessToken 존재
          const token = authData.state?.accessToken;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (e) {
        console.error('Failed to parse auth token from localStorage:', e);
      }
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
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        // 브라우저 환경에서 로컬 스토리지 삭제 및 로그인 리다이렉트
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('scriptly-auth-storage');
          } catch (e) {
            console.error('Failed to clean auth storage:', e);
          }
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
