import React from 'react';
import { Header } from '@/layouts/Header/Header';
import { Sidebar } from '@/layouts/Sidebar/Sidebar';
import { AppRouter } from '@/router';
import { useApiErrorToast } from '@/hooks/useApiErrorToast';
import { ConfirmDialog } from 'primereact/confirmdialog';

export function AppShell() {
  useApiErrorToast();
  return (
    <div className="h-screen bg-theme-page overflow-hidden relative">
      <Header />
      <Sidebar />
      <main 
        className="h-full overflow-hidden transition-[padding] duration-300 ease-in-out page-layout-wrapper"
        style={{ paddingTop: '64px' }}
      >
        <div className="h-full w-full bg-white dark:bg-slate-900 overflow-auto custom-scrollbar transition-all duration-300">
          <AppRouter />
        </div>
      </main>
      <ConfirmDialog />
    </div>
  );
}
