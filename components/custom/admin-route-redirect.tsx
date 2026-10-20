'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSiteAuth } from './site-auth-provider';

export function AdminRouteRedirect() {
  const { authState, isAdmin } = useSiteAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (authState === 'authenticated' && isAdmin && pathname !== '/admin') {
      router.replace('/admin');
    }
  }, [authState, isAdmin, pathname, router]);

  return null;
}