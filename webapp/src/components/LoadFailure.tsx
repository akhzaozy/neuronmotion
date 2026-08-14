'use client';
import { useI18n } from '@/lib/i18n';
import styles from './LoadFailure.module.css';

/**
 * Keterangan bahwa data tidak berhasil diambil.
 *
 * Ada karena keadaan "gagal memuat" sebelumnya jatuh menjadi keadaan "belum
 * ada data". Bagi produk yang isinya rekam pengukuran, kedua hal itu tidak
 * boleh terlihat sama: yang satu berarti pasien memang belum pernah
 * diperiksa, yang lain berarti pemeriksaannya ada tetapi tidak terambil.
 * Menyamakan keduanya membuat aplikasi mengatakan sesuatu yang tidak benar
 * tentang riwayat kesehatan seseorang.
 *
 * Karena itu blok ini selalu menyebut bahwa datanya aman dan hanya gagal
 * diambil, lalu menawarkan percobaan ulang alih-alih menyuruh memulai
 * skrining baru.
 */
export default function LoadFailure({
  onRetry,
  detail,
}: {
  onRetry: () => void;
  detail?: string;
}) {
  const { t } = useI18n();

  return (
    <div className={styles.block} role="alert">
      <h2 className={styles.title}>{t('err.loadTitle')}</h2>
      <p className={styles.body}>{t('err.loadBody')}</p>
      {detail && (
        <p className={styles.detail} data-no-translate="">
          {detail}
        </p>
      )}
      <button type="button" className="btn btn--primary" onClick={onRetry}>
        {t('err.retry')}
      </button>
    </div>
  );
}
