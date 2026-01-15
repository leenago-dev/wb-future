'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar, { ViewType } from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const routes: Record<ViewType, string> = {
    'dashboard': '/',
    'real-estate': '/real-estate',
    'pension': '/pension',
    'crypto': '/crypto',
    'stock': '/stock',
  };

  const getCurrentView = (): ViewType => {
    if (!pathname) return 'dashboard';
    if (pathname === '/') return 'dashboard';

    const matchedView = (Object.entries(routes) as [ViewType, string][]).find(
      ([, route]) => route !== '/' && pathname.startsWith(route)
    );

    return matchedView?.[0] ?? 'dashboard';
  };

  const handleViewChange = (view: ViewType) => {
    const targetRoute = routes[view];
    if (pathname === targetRoute) {
      return;
    }
    try {
      router.push(targetRoute);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-muted/50">
      <Sidebar
        currentView={getCurrentView()}
        onViewChange={handleViewChange}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0`}>
        {children}
      </div>
    </div>
  );
}

export default function SidebarClient({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarLayout>{children}</SidebarLayout>
    </SidebarProvider>
  );
}
