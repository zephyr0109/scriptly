'use client';

import React from 'react';
import { useRegisterForm } from '@/hooks/useRegisterForm';
import RegisterFormPresenter from './RegisterFormPresenter';

export default function RegisterContainer() {
  const {
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
  } = useRegisterForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register();
  };

  return (
    <RegisterFormPresenter
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      fullName={fullName}
      setFullName={setFullName}
      isLoading={isLoading}
      error={error}
      success={success}
      onSubmit={handleSubmit}
    />
  );
}
