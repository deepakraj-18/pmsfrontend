import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from 'primereact/button';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-bg">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-theme-primary mb-3">
          Access Denied
        </h1>
        <p className="text-theme-muted text-sm mb-8 leading-relaxed">
          You don&apos;t have permission to access this page.
          Please contact your administrator if you believe this is a mistake.
        </p>

        <Button unstyled onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
            bg-theme-surface border border-theme-border text-theme-secondary hover:text-theme-primary hover:border-theme-muted"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
