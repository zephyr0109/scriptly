import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export function useRegisterForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const register = async () => {
    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });

      setSuccess(true);
      // 2초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.response?.data?.detail || '회원가입에 실패했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    isLoading,
    error,
    success,
    register,
  };
}
