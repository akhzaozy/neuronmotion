'use client';
import { useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import styles from './ReportPrintHost.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Menampilkan laporan sebagai pratinjau layar penuh lalu memanggil dialog cetak.
 *
 * Sebelumnya tombol PDF memanggil window.print() langsung pada halaman, sehingga
 * yang tercetak adalah tampilan dashboard lengkap dengan navigasi dan tombol.
 * Di sini seluruh isi halaman disembunyikan saat mencetak dan hanya kotak laporan
 * yang ikut, sehingga hasilnya rapi tanpa perlu pustaka PDF tambahan.
 */
export default function ReportPrintHost({ open, onClose, children }: Props) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Kelas pada <body> dipakai stylesheet cetak untuk menyembunyikan sisa halaman
    document.body.classList.add('printing-report');
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.classList.remove('printing-report');
      window.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.toolbar}>
        <span className={styles.hint}>{t('report.previewHint')}</span>
        <div className={styles.actions}>
          <button className="btn" onClick={onClose}>{t('common.close')}</button>
          <button className="btn btn--primary" onClick={() => window.print()}>{t('report.print')}</button>
        </div>
      </div>
      <div className={styles.paperWrap} ref={ref}>
        {children}
      </div>
    </div>
  );
}
