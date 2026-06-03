import React, { useState, useEffect } from 'react';
import { useToast } from '@/providers/ToastContext';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Card } from '@/components/layout/Card';
import { Button } from 'primereact/button';
import { TextInput } from '@/components/forms/TextInput';
import { DropdownSelect } from '@/components/forms/DropdownSelect';
import { useAuth } from '@/auth/AuthProvider';
import { usersService } from '@/features/users/api/users.api';
import {
    User, Mail, Phone, MapPin, Building, Calendar, Shield,
    Camera, Save, Key, Bell, Clock, Globe, Edit,
    Monitor, Smartphone, Laptop, LogOut, CheckCircle,
    ShieldCheck, Smartphone as SmartphoneIcon, Mail as MailIcon,
    ChevronRight, ExternalLink, Trash2, Plus, Briefcase
} from 'lucide-react';

const profileTabs = [
    { id: 'profile', label: 'Profile', icon: User, description: 'Basic info and contact details' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Password and 2FA settings' },
    { id: 'sessions', label: 'Sessions', icon: Monitor, description: 'Manage active devices' },
    { id: 'emails', label: 'Emails', icon: Mail, description: 'Manage secondary emails' },
];

export function Profile() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('profile');
    const { user, logout, refreshProfile } = useAuth();
    const [stats, setStats] = useState({ activeProjects: 0, completedTasks: 0, totalHours: 0, openIssues: 0 });

    const displayName = user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    const email = user?.email || '';
    const roleName = user?.role?.name || 'Member';
    const publicId = user?.public_id || '—';
    const initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || 'U';

    const [formData, setFormData] = useState({
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        gender: 'Prefer not to say',
        country: 'India',
        language: 'English',
        timezone: user?.timezone || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                display_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                timezone: user.timezone || '',
            }));
        }
    }, [user]);

    const isTabActive = (id: string) => activeTab === id;

    const handleSave = async () => {
        if (!user?.id) return;

        setIsSaving(true);
        try {
            await usersService.updateUser(user.id, formData);
            await refreshProfile();
            showToast('error', 'Notification', 'Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            showToast('error', 'Notification', 'Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PageLayout title="My Profile" isFullHeight>
            <div className="flex flex-col lg:flex-row h-full border rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                { }
                <aside className="w-full lg:w-[280px] border-b lg:border-b-0 lg:border-r flex flex-col flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                    <div className="p-6 lg:p-8 pb-4 flex flex-col items-center border-b mb-4" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="relative group mb-4">
                            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center text-white text-2xl lg:text-3xl font-bold border-4 shadow-lg" style={{ background: 'var(--brand-gradient)', borderColor: 'var(--bg-primary)' }}>
                                {initials}
                            </div>
                            <Button text className="absolute bottom-0 right-0 !w-8 !h-8 !p-0 border rounded-full flex items-center justify-center shadow-sm transition-colors !bg-white dark:!bg-slate-900" style={{ borderColor: 'var(--border-color)' }}>
                                <Camera className="w-4 h-4 text-theme-muted" />
                            </Button>
                        </div>
                        <h2 className="text-[18px] font-bold text-theme-primary">{displayName}</h2>
                        <p className="text-[13px] text-theme-muted flex items-center gap-2 mt-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            {roleName}
                        </p>
                        <p className="text-[11px] text-theme-muted mt-1 font-mono">{publicId}</p>
                    </div>

                    <nav className="flex-1 px-3 lg:px-4 space-y-1 overflow-y-auto">
                        {profileTabs.map((tab) => (
                            <Button
                                key={tab.id}
                                text
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 lg:gap-4 !px-3 lg:!px-4 !py-3 lg:!py-3.5 !rounded-lg transition-all text-left ${isTabActive(tab.id)
                                    ? '!bg-brand-teal-50 dark:!bg-brand-teal-900/20 shadow-sm'
                                    : 'hover:!bg-brand-teal-50/50 dark:hover:!bg-slate-800'
                                    }`}
                            >
                                <div className={`p-2 rounded-md flex-shrink-0 ${isTabActive(tab.id) ? 'bg-brand-teal-600 text-white' : 'text-theme-muted'}`} style={!isTabActive(tab.id) ? { backgroundColor: 'var(--bg-secondary)' } : {}}>
                                    <tab.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className={`text-[14px] font-semibold ${isTabActive(tab.id) ? 'text-brand-teal-700 dark:text-brand-teal-400' : 'text-theme-primary'}`}>
                                        {tab.label}
                                    </p>
                                    <p className="text-[11px] text-theme-muted truncate hidden lg:block font-normal">{tab.description}</p>
                                </div>
                                {isTabActive(tab.id) && <ChevronRight className="w-4 h-4 text-brand-teal-400 hidden lg:block" />}
                            </Button>
                        ))}
                    </nav>

                    { }
                    <div className="p-3 lg:p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <Button
                            text
                            severity="danger"
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 !py-2.5 !rounded-lg hover:!bg-red-50 dark:hover:!bg-red-900/20 transition-colors !text-[13px] font-medium"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </aside>

                { }
                <main className="flex-1 flex flex-col overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <div className="p-6 lg:p-10 max-w-4xl w-full mx-auto">
                        {activeTab === 'profile' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <header>
                                    <h1 className="text-[22px] font-bold text-theme-primary mb-2">Profile Information</h1>
                                    <p className="text-[14px] text-theme-muted">Update your account details and contact information.</p>
                                </header>

                                { }
                                <Card className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold text-theme-primary">Microsoft SSO Account</p>
                                            <p className="text-[12px] text-theme-muted">Your profile is synced with your Microsoft organization. Some fields may be managed by your IT admin.</p>
                                        </div>
                                    </div>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-theme-secondary">First Name</label>
                                        <TextInput className="h-11" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-theme-secondary">Last Name</label>
                                        <TextInput className="h-11" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-theme-secondary">Display Name</label>
                                        <TextInput className="h-11" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-theme-secondary">Gender</label>
                                        <DropdownSelect className="h-11" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Non-binary">Non-binary</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </DropdownSelect>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-theme-secondary">Email Address</label>
                                        <div className="flex items-center gap-2 p-3 rounded-lg border h-11" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                                            <Mail className="w-4 h-4 text-theme-muted" />
                                            <span className="text-[14px] text-theme-primary flex-1">{email}</span>
                                            <span className="text-[10px] font-bold text-brand-teal-600 bg-brand-teal-100 dark:bg-brand-teal-900/30 px-2 py-0.5 rounded-full uppercase tracking-tight">Primary</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-theme-secondary">Role</label>
                                        <div className="flex items-center gap-2 p-3 rounded-lg border h-11" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                                            <Shield className="w-4 h-4 text-theme-muted" />
                                            <span className="text-[14px] text-theme-primary flex-1">{roleName}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-theme-secondary">Country/Region</label>
                                        <DropdownSelect className="h-11" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}>
                                            <option value="India">India</option>
                                            <option value="United States">United States</option>
                                            <option value="United Kingdom">United Kingdom</option>
                                        </DropdownSelect>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-theme-secondary">Language</label>
                                        <DropdownSelect className="h-11" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
                                            <option value="English">English</option>
                                            <option value="French">French</option>
                                            <option value="Spanish">Spanish</option>
                                        </DropdownSelect>
                                    </div>

                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-[13px] font-semibold text-theme-secondary">Timezone</label>
                                        <DropdownSelect className="h-11" value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}>
                                            <option value="Asia/Kolkata">(GMT+05:30) IST - Kolkata</option>
                                            <option value="America/New_York">(GMT-05:00) Eastern Time</option>
                                            <option value="UTC">(GMT+00:00) UTC</option>
                                        </DropdownSelect>
                                    </div>
                                </div>

                                <div className="pt-8 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border-color)' }}>
                                    <Button
                                        outlined
                                        className="!h-10 !px-6 !text-[13px] font-semibold"
                                        disabled={isSaving}
                                        onClick={() => user && setFormData({
                                            display_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
                                            first_name: user.first_name || '',
                                            last_name: user.last_name || '',
                                            gender: 'Prefer not to say',
                                            country: 'India',
                                            language: 'English',
                                            timezone: user.timezone || '',
                                        })}
                                    >
                                        Discard
                                    </Button>
                                    <Button
                                        className="btn-gradient !h-10 !px-8 !text-[13px] font-semibold"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <header>
                                    <h1 className="text-[22px] font-bold text-theme-primary mb-2">Security Settings</h1>
                                    <p className="text-[14px] text-theme-muted">Manage your password and account security preferences.</p>
                                </header>

                                <div className="space-y-6">
                                    <Card className="p-0 shadow-none">
                                        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                                    <Key className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[15px] font-semibold text-theme-primary">Password</p>
                                                    <p className="text-[12px] text-theme-muted">Managed by Microsoft SSO</p>
                                                </div>
                                            </div>
                                            <Button outlined className="!px-3 !py-1.5 !text-[12px] font-semibold">Change via Microsoft</Button>
                                        </div>
                                        <div className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-brand-teal-50 dark:bg-brand-teal-900/30 text-brand-teal-600 dark:text-brand-teal-400 rounded-lg">
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[15px] font-semibold text-theme-primary">Multi-factor Authentication</p>
                                                        <span className="text-[10px] font-bold text-brand-teal-600 bg-brand-teal-100 dark:bg-brand-teal-900/30 px-2 py-0.5 rounded-full uppercase">Enabled</span>
                                                    </div>
                                                    <p className="text-[12px] text-theme-muted">Secure your account with an extra layer of security</p>
                                                </div>
                                            </div>
                                            <Button outlined className="!px-3 !py-1.5 !text-[12px] font-semibold">Manage MFA</Button>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {activeTab === 'sessions' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <header>
                                    <h1 className="text-[22px] font-bold text-theme-primary mb-2">Connected Sessions</h1>
                                    <p className="text-[14px] text-theme-muted">View and manage all your active login sessions.</p>
                                </header>

                                <div className="divide-y border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                                    {[
                                        { device: 'Current Browser', icon: Monitor, location: 'Current Session', ip: '—', status: 'Active now', current: true },
                                    ].map((session, idx) => (
                                        <div key={idx} className="p-6 flex items-center justify-between transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                            <div className="flex items-center gap-5">
                                                <div className={`p-3 rounded-xl ${session.current ? 'bg-brand-teal-600 text-white' : ''}`} style={!session.current ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' } : {}}>
                                                    <session.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className="text-[15px] font-bold text-theme-primary">{session.device}</p>
                                                        {session.current && <span className="text-[9px] font-black text-brand-teal-600 bg-brand-teal-100 dark:bg-brand-teal-900/30 px-2 py-0.5 rounded-full uppercase tracking-tighter">Current</span>}
                                                    </div>
                                                    <p className="text-[12px] text-theme-muted font-medium">
                                                        Logged in as {email}
                                                    </p>
                                                    <p className="text-[11px] text-theme-muted mt-1">{session.status}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'emails' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <header>
                                    <h1 className="text-[22px] font-bold text-theme-primary mb-2">Email Addresses</h1>
                                    <p className="text-[14px] text-theme-muted">Manage the email addresses associated with your account.</p>
                                </header>

                                <div className="space-y-4">
                                    <div className="border rounded-xl p-6 flex items-center justify-between shadow-sm" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-lg text-theme-muted" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                                <MailIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-bold text-theme-primary">{email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-brand-teal-600 bg-brand-teal-100 dark:bg-brand-teal-900/30 px-2 py-0.5 rounded-full uppercase">Primary</span>
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full uppercase">Verified</span>
                                                    <span className="text-[10px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full uppercase">SSO</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button outlined className="w-full !h-14 border-dashed border-2 !text-theme-muted hover:!text-brand-teal-700 dark:hover:!text-brand-teal-400 transition-all flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4 mr-2" />
                                        <span className="text-[14px] font-semibold">Add Secondary Email</span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </PageLayout>
    );
}
