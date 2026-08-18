'use client';
import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import styles from './ProcessButton.module.css';

export type ProcessState = 'idle' | 'loading' | 'success' | 'error';

interface ProcessButtonProps {
  status?: ProcessState;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
  'aria-label'?: string;
  title?: string;
}

export default function ProcessButton({
  status = 'idle',
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loadingText = 'Memproses...',
  successText = 'Berhasil',
  errorText = 'Gagal',
  icon,
  children,
  className = '',
  onClick,
  style,
  'aria-label': ariaLabel,
  title,
}: ProcessButtonProps) {
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isIdle = status === 'idle';

  return (
    <motion.button
      type={type}
      layout
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 32,
      }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      disabled={disabled || isLoading}
      onClick={onClick}
      style={style}
      aria-label={ariaLabel}
      title={title}
      className={`
        ${styles.btn}
        ${styles[variant]}
        ${styles[`btn_${size}`]}
        ${fullWidth ? styles.btn_full : ''}
        ${isLoading ? styles.loading : ''}
        ${isSuccess ? styles.success : ''}
        ${isError ? styles.error : ''}
        ${className}
      `}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {isLoading && (
          <motion.span
            key="loading"
            className={styles.contentWrapper}
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.92 }}
            transition={{ duration: 0.2 }}
          >
            <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className={styles.spinner} />
            <span>{loadingText}</span>
          </motion.span>
        )}

        {isSuccess && (
          <motion.span
            key="success"
            className={styles.contentWrapper}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          >
            <Check size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
            <span>{successText}</span>
          </motion.span>
        )}

        {isError && (
          <motion.span
            key="error"
            className={styles.contentWrapper}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          >
            <AlertCircle size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
            <span>{errorText}</span>
          </motion.span>
        )}

        {isIdle && (
          <motion.span
            key="idle"
            className={styles.contentWrapper}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            {icon}
            <span>{children}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
