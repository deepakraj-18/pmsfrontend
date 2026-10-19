import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  AlertCircle,
  Clock,
  BarChart3,
  Users,
  UsersRound,
  Shield,
  BellRing,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Milestone,
  LayoutTemplate,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { ROLES, checkPermission, can } from '@/utils/permissions';
import { Button } from 'primereact/button';
import { useChatUnread } from '@/features/chat/hooks/useChat';
import { CHAT } from '@/constants/constants';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
  allowedRoles?: string[];
  requiredPermission?: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={17} />, section: 'Main' },
  { path: '/projects', label: 'Projects', icon: <FolderKanban size={17} />, requiredPermission: 'proj-view' },
  { path: '/tasks', label: 'Tasks', icon: <CheckSquare size={17} />, requiredPermission: 'task-view' },
  { path: '/issues', label: 'Defects', icon: <AlertCircle size={17} />, requiredPermission: 'issue-view' },
  { path: '/time-log', label: 'Time Logs', icon: <Clock size={17} />, requiredPermission: 'time-view' },
  {
    path: '/reports', label: 'Reports', icon: <BarChart3 size={17} />,
    requiredPermission: 'report-view',
  },
  {
    path: '/milestones', label: 'Milestones', icon: <Milestone size={17} />,
    requiredPermission: 'milestone-view',
  },
  {
    path: '/templates', label: 'Templates', icon: <LayoutTemplate size={17} />,
    requiredPermission: 'proj-create'
  },
  {
    path: '/users', label: 'Logged Users', icon: <Users size={17} />,
    section: 'Management',
    requiredPermission: 'user-view',
  },
  {
    path: '/teams', label: 'Teams', icon: <UsersRound size={17} />,
    requiredPermission: 'team-view',
  },
  {
    path: '/roles', label: 'Roles', icon: <Shield size={17} />,
    requiredPermission: 'role-manage',
  },
  { path: '/notification-settings', label: 'Notifications', icon: <BellRing size={17} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={17} />, requiredPermission: 'settings-view' },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const canChat = !user?.is_external || checkPermission(user?.role, CHAT.VIEW_PERMISSION);
  const { data: unreadRooms } = useChatUnread(canChat && !!user);
  const unreadTotal = (unreadRooms ?? []).reduce((sum, r) => sum + r.count, 0);
  const mentionTotal = (unreadRooms ?? []).reduce((sum, r) => sum + (r.mention_count ?? 0), 0);
  const userRole = user?.role?.name ?? '';

  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '68px' : '240px'
    );
  }, [collapsed]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && !collapsed) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1024 && collapsed) {
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  useEffect(() => {
    const toggle = () => setMobileOpen(p => !p);
    window.addEventListener('toggle-mobile-menu', toggle);
    return () => window.removeEventListener('toggle-mobile-menu', toggle);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const visibleItems = navItems.filter(item => {
    const role = user?.role;

    const permissionKey = item.requiredPermission;
    if (permissionKey) {
      const permissionMap: Record<string, keyof typeof can> = {
        'proj-view': 'viewProjects',
        'task-view': 'viewTasks',
        'issue-view': 'viewIssues',
        'time-view': 'viewTimeLogs',
        'report-view': 'viewReports',
        'milestone-view': 'viewMilestones',
        'user-view': 'viewUsers',
        'team-view': 'viewTeams',
        'role-manage': 'viewRoles',
        'settings-view': 'viewSettings',
        'proj-create': 'createProject'
      };

      const canMethod = permissionMap[permissionKey];
      if (canMethod && typeof can[canMethod] === 'function') {
        if (!(can[canMethod] as Function)(role)) return false;
      } else if (!checkPermission(role, permissionKey)) {

        return false;
      }
    }

    if (item.allowedRoles && !item.allowedRoles.includes(userRole)) {
      return false;
    }
    return true;
  });

  let currentSection = '';

  return (
    <>
      { }
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-16 bottom-0 z-40 flex flex-col
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${collapsed ? 'w-[68px]' : 'w-[240px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          willChange: 'width, transform',
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        { }
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 hide-scrollbar">
          {visibleItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            let sectionHeader: React.ReactNode = null;
            if (item.section && item.section !== currentSection) {
              currentSection = item.section;
              sectionHeader = !collapsed ? (
                <div className="px-2 pt-5 pb-1.5 first:pt-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {item.section}
                  </span>
                </div>
              ) : (
                <div className="pt-4 pb-1.5 flex justify-center">
                  <div className="w-5 h-px bg-[var(--border-color)]" />
                </div>
              );
            }

            return (
              <React.Fragment key={item.path}>
                {sectionHeader}
                <Link
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`
                    relative flex items-center gap-3 rounded-[8px] mb-0.5
                    transition-all duration-150
                    ${collapsed ? 'px-[13px] py-2.5 justify-center' : 'px-3 py-2.5'}
                    ${isActive
                      ? 'sidebar-link-active font-semibold'
                      : 'sidebar-link-default font-medium'
                    }
                  `}
                >
                  { }
                  {isActive && (
                    <span
                      className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-r-full"
                      style={{ background: 'var(--sidebar-active-border)' }}
                    />
                  )}
                  <span className="relative flex-shrink-0 transition-transform duration-150 group-hover:scale-105">
                    {item.icon}
                    {collapsed && item.path === '/projects' && unreadTotal > 0 && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500" aria-label="Unread chat messages" />
                    )}
                  </span>
                  {!collapsed && (
                    <span className="text-[13px] truncate leading-normal flex-1">
                      {item.label}
                    </span>
                  )}
                  {!collapsed && item.path === '/projects' && unreadTotal > 0 && (
                    <span
                      className={`ml-auto min-w-[18px] rounded-full px-1.5 text-center text-[10px] font-bold leading-[18px] text-white
                        ${mentionTotal > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      aria-label={`${unreadTotal} unread chat messages${mentionTotal > 0 ? `, ${mentionTotal} mentioning you` : ''}`}
                    >
                      {mentionTotal > 0 ? `@${mentionTotal}` : unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        { }
        <div
          className="flex-shrink-0 px-2.5 py-3"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <Button unstyled onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`
              w-full flex items-center gap-2.5 rounded-[8px] py-2 px-3
              text-[12px] font-medium transition-all duration-150
              ${collapsed ? 'justify-center' : ''}
              sidebar-collapse-btn
            `}
          >
            {collapsed
              ? <PanelLeft size={16} />
              : (
                <>
                  <PanelLeftClose size={16} />
                  <span>Collapse</span>
                </>
              )
            }
          </Button>
        </div>
      </aside>
    </>
  );
}
