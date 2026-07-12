import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TransitOps Driver Portal',
  description: 'TransitOps Fleet Operations - Driver Console with Indian Localization, offline caching, and real-time tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body>
        {children}
      </body>
    </html>
  );
}
