import { TextInput } from "@/components/forms/TextInput";
import { Button } from 'primereact/button';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, Sun, Moon, X, FolderKanban, CheckSquare, AlertCircle, Clock, Menu, User, LogOut } from 'lucide-react';
import { useTheme } from '@/providers/ThemeContext';
import { useAuth } from '@/auth/AuthProvider';
import { api } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import { Logo } from '@/components/core/Logo';
import { NotificationBell } from './NotificationBell';

function getTypeIcon(type: string) {
  switch (type) {
    case 'project': return <FolderKanban className="w-4 h-4" />;
    case 'task': return <CheckSquare className="w-4 h-4" />;
    case 'issue': return <AlertCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'project': return '#14b8a6';
    case 'task': return '#0284C7';
    case 'issue': return '#DC2626';
    default: return '#6B7280';
  }
}

export function Header() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const displayName = user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';
  const roleName = user?.role?.name || 'Member';
  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() || 'U';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get('/search/', { params: { q: debouncedQuery } });
        setResults(response.data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleResultClick = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowSearch(false);
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b z-50 transition-colors duration-300 header-base">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-3 md:gap-6 flex-1">
          <Button unstyled
            className="md:hidden flex items-center justify-center p-1 rounded-lg text-theme-secondary hover:bg-theme-neutral/50"
            onClick={() => window.dispatchEvent(new Event('toggle-mobile-menu'))}
          >
            <Menu className="w-6 h-6" />
          </Button>

          <div
            onClick={() => navigate('/')}
            className="flex items-center min-w-0 md:w-[200px] lg:w-[240px] flex-shrink-0 cursor-pointer"
          >
            <Logo className="h-8 sm:h-10 md:h-[42px] transition-transform hover:scale-[1.02]" showText={true} />
          </div>

          <div className="relative hidden w-[200px] lg:w-[420px] md:block flex-shrink-0" ref={searchRef}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <TextInput
              type="text"
              placeholder="Search projects, tasks, issues..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              className="w-full h-[38px] !pl-10 !pr-10 rounded-[9px] border text-[13.5px] focus:outline-none transition-all header-search"
              style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            />
            {searchQuery && (
              <Button unstyled onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted">
                <X className="w-4 h-4" />
              </Button>
            )}

            {showSearch && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 rounded-[12px] overflow-hidden z-[100] max-h-[400px] overflow-y-auto animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)' }}>
                {isLoading ? (
                  <div className="p-4 text-center text-[#6B7280]">
                    <div className="animate-spin w-5 h-5 border-2 border-[#14b8a6] border-t-transparent rounded-full mx-auto mb-2"></div>
                    <span className="text-[13px]">Searching...</span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Results ({results.length})</div>
                    {results.map((item) => (
                      <Button unstyled
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleResultClick(item.path)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left group" style={{ color: 'var(--text-primary)' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover-neutral)')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                      >
                        <div
                          className="w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${getTypeColor(item.type)}15`, color: getTypeColor(item.type) }}
                        >
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                          <p className="text-[11.5px] flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                            <span className="font-mono text-[11px] uppercase tracking-wider">{item.id}</span>
                            <span>•</span>
                            <span className="capitalize">{item.type}</span>
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#6B7280]">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-[14px]">No results found for"{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell />

          <Button unstyled
            className="hidden sm:block header-icon-btn !p-1.5 sm:!p-2.5"
            onClick={() => navigate('/settings')}
            title="Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          <Button unstyled
            className="header-icon-btn !p-1.5 sm:!p-2.5"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>

          { }
          <div className="w-px h-6 md:h-8 mx-1 md:mx-2 header-divider" />

          { }
          <div className="relative" ref={userMenuRef}>
            <Button unstyled
              className="flex items-center gap-2 md:gap-2.5 py-1 md:py-1.5 px-0.5 md:px-2.5 rounded-[8px] transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover-neutral)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm text-white text-[11px] sm:text-[12px] font-bold" style={{ background: 'var(--brand-gradient)' }}>
                {initials}
              </div>
              <div className="text-left hidden md:block">
                <span className="text-[13px] font-semibold block leading-tight text-theme-primary">{displayName}</span>
                <span className="text-[10px] block leading-tight text-theme-muted">{roleName}</span>
              </div>
            </Button>

            { }
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-[260px] rounded-[14px] border overflow-hidden animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)', zIndex: 100 }}>
                <div className="p-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: 'var(--brand-gradient)' }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-theme-primary truncate">{displayName}</p>
                      <p className="text-[12px] text-theme-muted truncate">{user?.email || ''}</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <Button unstyled onClick={() => { setShowUserMenu(false); navigate('/profile'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-theme-secondary font-medium hover:bg-brand-teal-50 dark:hover:bg-slate-800 transition-colors">
                    <User className="w-4 h-4" /> My Profile
                  </Button>
                  <Button unstyled onClick={() => { setShowUserMenu(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-theme-secondary font-medium hover:bg-brand-teal-50 dark:hover:bg-slate-800 transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </Button>
                </div>
                <div className="border-t py-1" style={{ borderColor: 'var(--border-color)' }}>
                  <Button unstyled onClick={() => { setShowUserMenu(false); logout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header >
  );
}
