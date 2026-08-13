'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle, useI18n } from '@/lib/i18n';
import styles from './AppNav.module.css';

const NAV_ITEMS = [
  { href: '/doctor', key: 'nav.dashboard' },
  { href: '/doctor/edukasi', key: 'nav.edukasi' },
  { href: '/doctor/bantuan', key: 'nav.bantuan' },
  { href: '/doctor/profil', key: 'nav.profil' },
];

export default function DoctorNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/doctor" className={styles.brand}>
          <Logo size={30} />
          <span className={styles.brandText} data-no-translate="">
            NeuronMotion <span className={styles.brandSuffix}>AI</span>
          </span>
        </Link>
        <div className={styles.links}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              // Dashboard hanya aktif pada path persis, agar tidak ikut menyala
              // ketika pengguna berada di submenu seperti /doctor/edukasi
              className={`${styles.link} ${
                (item.href === '/doctor' ? pathname === '/doctor' : pathname.startsWith(item.href))
                  ? styles.linkActive : ''
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </div>
        <div className={styles.actions}>
          <span className={styles.roleBadge}>{t('nav.portalNakes')}</span>
          <LanguageToggle />
          <ThemeToggle size="sm" />
        </div>
      </div>
    </nav>
  );
}
