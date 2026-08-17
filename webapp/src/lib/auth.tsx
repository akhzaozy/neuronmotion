'use client';
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, SESSION_EXPIRED_EVENT, api } from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null,
  login: () => {}, logout: () => {}, isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('gs_token');
    const savedUser = localStorage.getItem('gs_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        // Segarkan data profil dari server untuk memastikan kelengkapan field wilayah
        api.getMe(savedToken).then((fresh) => {
          if (fresh) {
            setUser(fresh);
            localStorage.setItem('gs_user', JSON.stringify(fresh));
          }
        }).catch(() => {});
      } catch {
        // ignore parse error
      }
    }
    setIsLoading(false);
  }, []);

  const login = (user: UserProfile, token: string) => {
    localStorage.setItem('gs_token', token);
    localStorage.setItem('gs_user', JSON.stringify(user));
    setUser(user);
    setToken(token);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('gs_token');
    localStorage.removeItem('gs_user');
    setUser(null);
    setToken(null);
  }, []);

  /* ── Sesi berakhir ────────────────────────────────────────────────────────
     Token berlaku 24 jam. Ketika server menolaknya, lapisan api menembakkan
     peristiwa ini dan di sinilah pengguna benar-benar dikeluarkan, lalu
     dibawa ke halaman masuk dengan penanda ?expired=1 supaya ia membaca
     penjelasan alih-alih menyimpulkan sendiri bahwa aplikasinya rusak.

     Ditangani terpusat, bukan di setiap halaman: kalau tidak, setiap
     pemanggilan API baru di kemudian hari harus mengingat penanganan yang
     sama, dan yang terlupa akan mengulang persoalan ini. */
  useEffect(() => {
    const onExpired = () => {
      logout();
      router.replace('/login?expired=1');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout, router]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
