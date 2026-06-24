import { ReactNode } from 'react';
import AdminNav from './AdminNav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminNav />
      <main className="min-h-screen pt-14">{children}</main>
    </>
  );
}
