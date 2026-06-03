import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from 'primereact/button';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  isFullHeight?: boolean;
  showBackButton?: boolean;
  backPath?: string;
  onBack?: () => void;
}

export function PageLayout({
  children,
  title,
  subtitle,
  actions,
  isFullHeight,
  showBackButton = true,
  backPath,
  onBack,
}: PageLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) { onBack(); }
    else if (location.state?.from) { navigate(location.state.from); }
    else if (backPath) { navigate(backPath); }
    else { navigate(-1); }
  };

  return (
    <div
      className={`
        w-full transition-all duration-300
        ${isFullHeight ? 'h-full flex flex-col overflow-hidden' : 'min-h-full'}
      `}
    >
      <div
        className={`
          flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6
          ${isFullHeight ? 'flex-1 overflow-hidden min-h-0' : ''}
        `}
      >
        { }
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 flex-shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              {showBackButton && (
                <Button unstyled onClick={handleBack}
                  className="
                    flex-shrink-0 w-9 h-9 flex items-center justify-center
                    rounded-full border transition-all duration-200
                    hover:bg-[var(--bg-hover-neutral)] hover:scale-105 active:scale-95
                    bg-white dark:bg-slate-800 shadow-sm
                  "
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <ArrowLeft size={18} />
                </Button>
              )}
              {title && (
                <div className="min-w-0">
                  <div
                    className="text-[22px] sm:text-[24px] font-black tracking-tight leading-tight truncate text-theme-primary"
                  >
                    {title}
                  </div>
                  {subtitle && (
                    <p
                      className="text-[13px] font-medium mt-1 text-theme-muted"
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2.5 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        )}

        { }
        <div className={`
          ${isFullHeight ? 'flex-1 overflow-hidden flex flex-col min-h-0' : 'h-full'}
        `}>
          {children}
        </div>
      </div>
    </div>
  );
}
