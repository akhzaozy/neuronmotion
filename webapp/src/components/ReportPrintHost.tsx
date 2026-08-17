'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Printer, X, FileText, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import styles from './ReportPrintHost.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  patientName?: string;
  children: React.ReactNode;
}

/**
 * Menghasilkan nama berkas PDF dengan format: nama-tanggal cetak.pdf
 * Contoh: budi-17-08-2026.pdf
 */
function generateFilename(patientName?: string): string {
  const cleanName = (patientName || 'pasien')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  return `${cleanName || 'pasien'}-${day}-${month}-${year}.pdf`;
}

export default function ReportPrintHost({ open, onClose, patientName, children }: Props) {
  const { t } = useI18n();
  const paperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('printing-report');
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.classList.remove('printing-report');
      window.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose, isGenerating]);

  const handleDownloadPdf = async () => {
    if (!paperRef.current || isGenerating) return;

    try {
      setIsGenerating(true);

      // Beri sedikit jeda agar transisi animasi modal loading tampil dengan mulus
      await new Promise((resolve) => setTimeout(resolve, 800));

      const element = paperRef.current;

      const canvas = await html2canvas(element, {
        scale: 2, // 2x resolusi untuk ketajaman teks & grafik
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const filename = generateFilename(patientName);
      pdf.save(filename);
    } catch (err) {
      console.error('Gagal menghasilkan PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!open || !mounted) return null;

  const content = (
    <div className={styles.backdrop} data-report-host="true">
      {/* Bilah Aksi Atas */}
      <div className={styles.toolbar}>
        <span className={styles.hint}>{t('report.previewHint')}</span>
        <div className={styles.actions}>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isGenerating}
          >
            <X size={16} aria-hidden="true" />
            {t('common.close')}
          </button>
          <button
            type="button"
            className={`btn ${styles.btnPrint}`}
            onClick={handlePrint}
            disabled={isGenerating}
          >
            <Printer size={16} aria-hidden="true" />
            {t('report.print')}
          </button>
          <button
            type="button"
            className={`btn ${styles.btnDownload}`}
            onClick={handleDownloadPdf}
            disabled={isGenerating}
          >
            <Download size={16} aria-hidden="true" />
            {t('report.downloadDirect')}
          </button>
        </div>
      </div>

      {/* Area Lembar Laporan A4 */}
      <div className={styles.paperWrap} ref={paperRef} data-report-paper="true">
        {children}
      </div>

      {/* Modal Animasi Loading Saat Menyiapkan PDF */}
      {isGenerating && (
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
          <div className={styles.loadingCard}>
            <div className={styles.iconWrapper}>
              <div className={styles.spinnerRing} />
              <FileText size={32} className={styles.iconFile} />
            </div>

            <div>
              <h3 className={styles.loadingTitle}>{t('report.preparingPdf')}</h3>
              <p className={styles.loadingDesc}>{t('report.preparingHint')}</p>
            </div>

            <div className={styles.progressBar}>
              <div className={styles.progressFill} />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
