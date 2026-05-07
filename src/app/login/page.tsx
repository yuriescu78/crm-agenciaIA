"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la raíz ya que el AuthWrapper maneja el login si es necesario
    router.replace('/');
  }, [router]);

  return null;
}
