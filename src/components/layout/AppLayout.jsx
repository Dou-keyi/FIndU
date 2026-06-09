import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarNav from './SidebarNav';
import BottomNav from '../BottomNav';
import MobileHeader from './MobileHeader';

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header (hidden on desktop) */}
      <MobileHeader />

      {/* Desktop Sidebar (hidden on mobile) */}
      <SidebarNav />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-[100dvh] relative pt-14 pb-[60px] md:pt-0 md:pb-0 min-w-0">
        {/* Children (Outlet will be rendered here if using nested routes, or direct children) */}
        {children || <Outlet />}
      </div>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <BottomNav />
    </div>
  );
}
