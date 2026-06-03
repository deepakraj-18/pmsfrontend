import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Card } from '@/components/layout/Card';
import { Button } from 'primereact/button';
import { Bell, CheckCheck, FolderKanban, CheckSquare, AlertCircle, Clock, User, Settings as SettingsIcon, Trash2 } from 'lucide-react';

interface Notification {
    id: string;
    type: 'project' | 'task' | 'issue' | 'system' | 'user';
    title: string;
    message: string;
    time: string;
    read: boolean;
    link?: string;
}

const mockNotifications: Notification[] = [
    {
        id: '1',
        type: 'task',
        title: 'Task Assigned',
        message: 'Sarah Chen assigned you to"Implement authentication API" in Enterprise Portal Redesign.',
        time: '5 minutes ago',
        read: false,
        link: '/tasks/TSK-002',
    },
    {
        id: '2',
        type: 'issue',
        title: 'New Issue Reported',
        message: 'A critical issue"Login authentication fails on mobile" has been reported on Enterprise Portal.',
        time: '15 minutes ago',
        read: false,
        link: '/issues/ISS-001',
    },
    {
        id: '3',
        type: 'project',
        title: 'Project Milestone Reached',
        message: 'Cloud Migration Project has reached the"Phase 2 Complete" milestone.',
        time: '1 hour ago',
        read: false,
        link: '/projects/PRJ-004',
    },
    {
        id: '4',
        type: 'user',
        title: 'New Team Member',
        message: 'Marcus Rivera has joined the Mobile App Development team.',
        time: '2 hours ago',
        read: true,
        link: '/teams/TEAM-002',
    },
    {
        id: '5',
        type: 'task',
        title: 'Task Completed',
        message: 'Alex Wong completed"Design homepage mockup" ahead of schedule.',
        time: '3 hours ago',
        read: true,
        link: '/tasks/TSK-001',
    },
    {
        id: '6',
        type: 'issue',
        title: 'Issue Resolved',
        message: '"Dashboard loading performance issue" has been resolved by the dev team.',
        time: '5 hours ago',
        read: true,
        link: '/issues/ISS-002',
    },
    {
        id: '7',
        type: 'system',
        title: 'System Update',
        message: 'Scheduled maintenance will occur on March 1st from 2:00 AM to 4:00 AM UTC.',
        time: '1 day ago',
        read: true,
    },
    {
        id: '8',
        type: 'project',
        title: 'Budget Alert',
        message: 'API Integration Platform has used 85% of its allocated budget.',
        time: '1 day ago',
        read: true,
        link: '/projects/PRJ-003',
    },
    {
        id: '9',
        type: 'task',
        title: 'Task Overdue',
        message: '"Database schema optimization" is overdue by 2 days.',
        time: '2 days ago',
        read: true,
        link: '/tasks/TSK-003',
    },
];

function getNotificationIcon(type: string) {
    switch (type) {
        case 'project': return <FolderKanban className="w-5 h-5" />;
        case 'task': return <CheckSquare className="w-5 h-5" />;
        case 'issue': return <AlertCircle className="w-5 h-5" />;
        case 'system': return <SettingsIcon className="w-5 h-5" />;
        case 'user': return <User className="w-5 h-5" />;
        default: return <Bell className="w-5 h-5" />;
    }
}

function getNotificationIconColor(type: string) {
    switch (type) {
        case 'project': return { bg: 'rgba(5, 150, 105, 0.12)', color: '#14b8a6' };
        case 'task': return { bg: 'rgba(2, 132, 199, 0.12)', color: '#0284C7' };
        case 'issue': return { bg: 'rgba(220, 38, 38, 0.12)', color: '#DC2626' };
        case 'system': return { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748B' };
        case 'user': return { bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' };
        default: return { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748B' };
    }
}

export function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(mockNotifications);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const unreadCount = notifications.filter(n => !n.read).length;
    const displayedNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const deleteNotification = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <PageLayout
            title="Notifications"
            actions={
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button outlined onClick={markAllRead}>
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Mark All Read
                    </Button>
                    <Button outlined onClick={() => navigate('/notification-settings')}>
                        <SettingsIcon className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                { }
                <Card className="p-3">
                    <div className="flex items-center gap-3">
                        <Button unstyled
                            className={`px-4 py-2 rounded-[8px] text-[13px] font-bold transition-all ${filter === 'all'
                                ? 'bg-brand-teal-600 text-white shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            onClick={() => setFilter('all')}
                        >
                            All ({notifications.length})
                        </Button>
                        <Button unstyled
                            className={`px-4 py-2 rounded-[8px] text-[13px] font-bold transition-all ${filter === 'unread'
                                ? 'bg-brand-teal-600 text-white shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread ({unreadCount})
                        </Button>
                    </div>
                </Card>

                { }
                <Card className="p-0 overflow-hidden" glass>
                    {displayedNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Bell className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-[16px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            </p>
                            <p className="text-[13px] text-slate-500">
                                {filter === 'unread' ? "You're all caught up!" : "When you receive notifications, they'll appear here."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {displayedNotifications.map((notification) => {
                                const iconStyle = getNotificationIconColor(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        className={`group relative transition-colors cursor-pointer ${notification.read
                                                ? 'bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                                                : 'bg-brand-teal-50/20 dark:bg-brand-teal-900/5 hover:bg-brand-teal-50/30 dark:hover:bg-brand-teal-900/10'
                                            }`}
                                        onClick={() => handleClick(notification)}
                                    >
                                        <div className="flex items-start gap-4 px-6 py-5">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border border-white/20 dark:border-slate-700/30"
                                                style={{ backgroundColor: iconStyle.bg, color: iconStyle.color }}
                                            >
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-1.5 sm:gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            {!notification.read && <div className="w-2 h-2 rounded-full bg-brand-teal-500 animate-pulse" />}
                                                            <p className={`text-[14px] font-bold ${notification.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{notification.title}</p>
                                                        </div>
                                                        <p className={`text-[13px] mt-1 line-clamp-2 ${notification.read ? 'text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>{notification.message}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
                                                        <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">{notification.time}</span>
                                                        <Button unstyled
                                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                                                            onClick={(e) => deleteNotification(notification.id, e)}
                                                            title="Delete notification"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>
        </PageLayout>
    );
}
