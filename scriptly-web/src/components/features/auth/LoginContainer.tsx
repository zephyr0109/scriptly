'use client';

import React from 'react';
import { useLoginForm } from '@/hooks/useLoginForm';
import LoginFormPresenter from './LoginFormPresenter';

export default function LoginContainer() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    login,
  } = useLoginForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
  };

  return (
    <LoginFormPresenter
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
