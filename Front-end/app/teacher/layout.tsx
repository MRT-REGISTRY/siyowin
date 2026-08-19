import type { Metadata } from 'next';
import '@/styles/dashboard.css';

export const metadata: Metadata = {
  title: 'Teacher Dashboard | Siyowin Faculty',
  description: 'Manage your classes, log student marks, and view academic analytics.',
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
