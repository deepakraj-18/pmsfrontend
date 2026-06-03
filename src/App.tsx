import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { LoginPage } from '@/features/auth/LoginPage';
import { MSCallbackPage } from '@/features/auth/MSCallbackPage';

import { AppLoader } from '@/components/feedback/AppLoader';
import { AppShell } from '@/layouts/AppShell';
import { AuthGuard } from '@/components/core/AuthGuard';

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/ms-callback" element={<MSCallbackPage />} />
          <Route path="/redirect" element={<MSCallbackPage />} />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <AppShell />
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
