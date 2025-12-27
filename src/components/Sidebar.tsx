import React, { useState } from 'react';
import { LayoutDashboard, Home, Clock, TrendingUp, Coins, ChevronRight, ChevronsLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SIDEBAR_MENU_ITEMS } from '@/config/app';

export type ViewType = 'dashboard' | 'real-estate' | 'pension' | 'stock' | 'crypto';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const getIcon = (id: ViewType) => {
    const iconMap: Record<ViewType, React.ReactNode> = {
      'dashboard': <LayoutDashboard className="w-6 h-6" />,
      'real-estate': <Home className="w-6 h-6" />,
      'pension': <Clock className="w-6 h-6" />,
      'crypto': <TrendingUp className="w-6 h-6" />,
      'stock': <Coins className="w-6 h-6" />,
    };
    return iconMap[id];
  };

  const menuItems = SIDEBAR_MENU_ITEMS.map((item) => ({
    ...item,
    icon: getIcon(item.id as ViewType),
  }));

  const handleMenuClick = (id: ViewType) => {
    onViewChange(id);
    setIsMobileOpen(false); // 모바일에서 클릭 시 닫기
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`bg-slate-900 text-white h-full fixed left-0 top-0 z-[70] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 shadow-2xl lg:shadow-none`}
      >
        <div className="p-6 flex items-center justify-between overflow-hidden">
          {(!isCollapsed || isMobileOpen) && <h1 className="font-bold text-xl truncate tracking-tight">Wealth Dash</h1>}
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="icon"
            className="hidden lg:flex ml-auto text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isCollapsed ? (
              <ChevronRight className="w-6 h-6" />
            ) : (
              <ChevronsLeft className="w-6 h-6" />
            )}
          </Button>

          {/* Mobile Close Button */}
          <Button
            onClick={() => setIsMobileOpen(false)}
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-2">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className="relative"
            >
              <Button
                onClick={() => handleMenuClick(item.id as ViewType)}
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-4 p-3 rounded-xl transition-all duration-200 group h-auto',
                  currentView === item.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <div className={cn(
                  'flex-shrink-0 transition-transform duration-200',
                  currentView === item.id ? 'scale-110' : 'group-hover:scale-110'
                )}>
                  {item.icon}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                )}
              </Button>

              {/* Tooltip for collapsed state (Desktop only) */}
              {isCollapsed && hoveredItem === item.id && !isMobileOpen && (
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg shadow-2xl whitespace-nowrap z-[100] border border-slate-700 pointer-events-none animate-in fade-in slide-in-from-left-2 duration-150">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50 mt-auto">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-sm shadow-inner">L</div>
              <div className="truncate">
                <p className="text-sm font-bold text-white">Leena & Husband</p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Our Family Plan</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto flex items-center justify-center font-bold text-sm shadow-lg">L</div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
