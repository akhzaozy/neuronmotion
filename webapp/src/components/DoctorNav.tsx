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
          <Logo size={17} />
        </Link>

        <div className={styles.actions}>
          {/* Penanda portal dibedakan lewat label teks, bukan lencana berwarna,
              supaya nakes selalu tahu ia sedang berada di sisi mana. */}
          <span className={styles.roleTag}>{t('nav.portalNakes')}</span>
          <LanguageToggle />
          <ThemeToggle size="sm" />
        </div>

        <div className={styles.links}>
          {NAV_ITEMS.map(item => {
            // Beranda hanya aktif pada path persis, agar tidak ikut menyala
            // ketika pengguna berada di submenu seperti /doctor/edukasi
            const active =
              item.href === '/doctor' ? pathname === '/doctor' : pathname.startsWith(item.href);
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
      </div>
    </nav>
  );
}
