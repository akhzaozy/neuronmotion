'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '@/lib/auth';
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
  const router = useRouter();
  const { logout } = useAuth();
  const { t } = useI18n();

  return (
    <nav className={styles.nav} aria-label={t('nav.label')}>
      <div className={styles.inner}>
        <Link href="/dashboard" className={styles.brand}>
          <Logo size={17} />
        </Link>

        <div className={styles.actions}>
          <LanguageToggle />
          <ThemeToggle size="sm" />
        </div>

        <div className={styles.links}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${active ? styles.linkActive : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          className={styles.logout}
          onClick={() => {
            logout();
            router.push('/login');
          }}
        >
          <LogOut size={14} aria-hidden="true" />
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </nav>
  );
}
