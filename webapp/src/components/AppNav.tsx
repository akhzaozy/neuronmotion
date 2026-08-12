'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import styles from './AppNav.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/riwayat', label: 'Riwayat' },
  { href: '/edukasi', label: 'Edukasi' },
  { href: '/bantuan', label: 'Bantuan' },
  { href: '/profil', label: 'Profil' },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/dashboard" className={styles.brand}>
          <Logo size={30} />
          <span className={styles.brandText}>NeuronMotion</span>
        </Link>
        <div className={styles.links}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${pathname === item.href ? styles.linkActive : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
