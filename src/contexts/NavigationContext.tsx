'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NavigationContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  // IMPORTANT: Use deterministic SSR-safe defaults, then compute real values after mount
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initialize values from window/localStorage AFTER mount to avoid hydration mismatch
    const init = () => {
      try {
        const saved = localStorage.getItem('sidebar-collapsed');
        const initialCollapsed = saved !== null ? JSON.parse(saved) : window.innerWidth < 1280;
        setIsSidebarCollapsed(Boolean(initialCollapsed));
      } catch {
        // noop
      }
      setIsMobile(window.innerWidth < 1024);
    };

    let rafId = 0 as number | 0;
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId as number);
      rafId = requestAnimationFrame(() => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);

        // Auto-collapse sidebar on medium screens
        if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
          setIsSidebarCollapsed(true);
        }
      }) as unknown as number;
    };

    init();
    window.addEventListener('resize', handleResize);
    return () => {
      if (rafId) cancelAnimationFrame(rafId as number);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    const newValue = !isSidebarCollapsed;
    setIsSidebarCollapsed(newValue);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newValue));
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  };

  return (
    <NavigationContext.Provider value={{
      isSidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      isMobile
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
