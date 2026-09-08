import type { Metadata, Viewport } from 'next';
import '../index.css';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'Painel Arroba do Boi & Simulação Estratégica',
  description: 'Painel completo de cotações CEPEA e simulador estratégico para pecuária de corte com IA.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Arroba Boi'
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#059669'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-emerald-500 selection:text-white">
        <PWAInstallPrompt />
        {children}
      </body>
    </html>
  );
}
