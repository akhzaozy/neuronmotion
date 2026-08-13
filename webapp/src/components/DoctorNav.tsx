'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { ThemeToggle } from '@/lib/theme';
import styles from './AppNav.module.css';

const NAV_ITEMS = [
  { href: '/doctor', label: 'Dashboard' },
  { href: '/doctor/edukasi', label: 'Edukasi' },
  { href: '/doctor/bantuan', label: 'Bantuan' },
  { href: '/doctor/profil', label: 'Profil' },
];

export default function DoctorNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/doctor" className={styles.brand}>
          <Logo size={30} />
          <span className={styles.brandText}>
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
              {item.label}
            </Link>
          ))}
        </div>
        <div className={styles.actions}>
          <span className={styles.roleBadge}>Portal Nakes</span>
          <ThemeToggle size="sm" />
        </div>
      </div>
    </nav>
  );
}
