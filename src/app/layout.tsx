import type { Metadata } from 'next';
import './globals.css';
import SidebarClient from '@/components/SidebarClient';

export const metadata: Metadata = {
  title: 'Wealth Dash - 우리 집 재무제표',
  description: '부부의 자산을 한눈에 파악하고 실시간 데이터를 통해 순자산을 관리하는 개인화된 재무 대시보드',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SidebarClient>
          {children}
        </SidebarClient>
      </body>
    </html>
  );
}
