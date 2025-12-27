
import React, { useState } from 'react';

export type ViewType = 'dashboard' | 'real-estate' | 'pension' | 'crypto' | 'stock';

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

  const menuItems = [
    { id: 'dashboard', label: '종합 대시보드', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
    )},
    { id: 'real-estate', label: '부동산 집중 분석', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
    )},
    { id: 'pension', label: '퇴직연금 집중 분석', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    )},
    { id: 'crypto', label: '가상자산 집중 분석', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
    )},
    { id: 'stock', label: '주식 집중 분석', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
    )},
  ];

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
        className={`bg-slate-900 text-white h-full fixed left-0 top-0 z-[70] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 shadow-2xl lg:shadow-none`}
      >
        <div className="p-6 flex items-center justify-between overflow-hidden">
          {(!isCollapsed || isMobileOpen) && <h1 className="font-bold text-xl truncate tracking-tight">Wealth Dash</h1>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1.5 hover:bg-slate-800 rounded-lg transition-colors ml-auto text-slate-400 hover:text-white"
          >
            {isCollapsed ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-2">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className="relative"
            >
              <button
                onClick={() => handleMenuClick(item.id as ViewType)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className={`flex-shrink-0 transition-transform duration-200 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                )}
              </button>

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
