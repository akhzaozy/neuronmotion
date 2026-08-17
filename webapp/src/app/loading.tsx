'use client';
import LoadingScreen from '@/components/LoadingScreen';

export default function GlobalLoading() {
  return <LoadingScreen fullScreen title="Memuat Halaman..." subtitle="Menyiapkan komponen dan data NeuronMotion..." />;
}
