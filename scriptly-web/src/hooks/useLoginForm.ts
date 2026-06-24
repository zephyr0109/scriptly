import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import api from '@/lib/api';

export function useLoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setIsLoading(true);
    setError('');

    try {
      // 1. 로그인 요청 (OAuth2 Password flow: form-data 형식)
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const loginRes = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { access_token } = loginRes.data;

      // 2. 내 정보 가져오기
      const userRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      // 3. 스토어 저장 및 리다이렉트
      setAuth(userRes.data, access_token);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    login,
  };
}
