'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle, useI18n } from '@/lib/i18n';
import styles from './AppNav.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', key: 'nav.dashboard' },
  { href: '/riwayat', key: 'nav.riwayat' },
  { href: '/edukasi', key: 'nav.edukasi' },
  { href: '/bantuan', key: 'nav.bantuan' },
  { href: '/profil', key: 'nav.profil' },
];

export default function AppNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/dashboard" className={styles.brand}>
          <Logo size={30} />
          <span className={styles.brandText} data-no-translate="">NeuronMotion</span>
        </Link>
        <div className={styles.links}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${pathname === item.href ? styles.linkActive : ''}`}
            >
              {t(item.key)}
            </Link>
          ))}
        </div>
        <div className={styles.actions}>
          <LanguageToggle />
          <ThemeToggle size="sm" />
        </div>
      </div>
    </nav>
  );
}
