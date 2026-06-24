import { ReactNode } from 'react';
import AdminNav from './AdminNav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminNav />
      <main className="min-h-screen bg-[#0A0A0F] md:pl-52 pt-14 md:pt-0 transition-all duration-200">
        {children}
      </main>
    </>
  );
}
