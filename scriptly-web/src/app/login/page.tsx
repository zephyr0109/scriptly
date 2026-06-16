'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative">
          <div className="absolute top-4 right-4">
            <Sparkles className="text-amber-400 w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Scriptly</h1>
          <p className="text-slate-400 text-sm">드라마 작가를 위한 AI 집필 보조 시스템</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-shake">
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none text-slate-900"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700 block">비밀번호</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                '로그인'
              )}
            </button>

            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-slate-500 text-xs pt-1.5 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>로그인 진행 중입니다. 잠시만 기다려주세요...</span>
              </div>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              계정이 없으신가요?{' '}
              <Link href="/register" className="text-slate-900 font-semibold hover:underline">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
