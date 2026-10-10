import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sim Racing Coach',
  description: 'Learn racing technique, vehicle dynamics, braking, cornering, and racecraft.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
