import React, { useState } from 'react';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/forms/Button';
import { TextInput } from '@/components/forms/TextInput';
import { DropdownSelect } from '@/components/forms/DropdownSelect';
import { TextAreaInput } from '@/components/forms/TextAreaInput';
import { CheckboxInput } from '@/components/forms/CheckboxInput';
import {
  Users, Shield, Zap, Globe, Building, HelpCircle, Bell, Search, Save
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { settingsTabs } from '@/utils/permissions';

export function Settings() {
  const { user } = useAuth();
  const userRole = user?.role?.name;

  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: 'Personal Profile', icon: Users, desc: 'Manage your public presence' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email and desktop alerts' },
    { id: 'localization', label: 'Localization', icon: Globe, desc: 'Language and date formats' },
    ...(settingsTabs.organization(user?.role) ? [{ id: 'organization', label: 'Organization', icon: Building, desc: 'Company branding and profile' }] : []),
    { id: 'security', label: 'Security', icon: Shield, desc: 'Password and authentication' },
    { id: 'automations', label: 'Automations', icon: Zap, desc: 'Workflow triggers and actions' },
  ];

  return (
    <PageLayout title="Settings" isFullHeight>
      <div className="flex-1 flex flex-col lg:flex-row gap-8 max-w-[1600px] mx-auto w-full px-4 lg:px-8 py-6 h-full overflow-hidden">

        { }
        <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
          <div className="mb-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <TextInput
              type="text"
              placeholder="Search settings..."
              className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-teal-500/50 outline-none transition-all placeholder-slate-400 text-slate-700 dark:text-slate-300"
            />
          </div>

          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-2">General</h2>

          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-4 p-3 rounded-2xl transition-all text-left group ${isActive
                    ? 'bg-white dark:bg-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-200/60 dark:border-slate-700'
                    : 'hover:bg-slate-50 border border-transparent dark:hover:bg-slate-800/50'
                  }`}
              >
                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-brand-teal-500 text-white shadow-md shadow-brand-teal-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-brand-teal-600'}`}>
                  <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <div className="flex-1 mt-0.5">
                  <div className={`text-[14px] font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                    {tab.label}
                  </div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-500 line-clamp-1 mt-0.5 font-medium">
                    {tab.desc}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        { }
        <Card className="flex-1 h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700/60 rounded-[2rem] p-0 flex flex-col bg-white dark:bg-[#0f172a] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 xl:p-16 custom-scrollbar pb-32">

            {activeTab === 'personal' && (
              <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-10">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Personal Profile</h1>
                  <p className="text-slate-500 mt-2 text-[15px]">Manage your public presence, bio, and avatar.</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-teal-400 to-brand-teal-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-brand-teal-500/20 border-4 border-white dark:border-slate-800">
                      {(user?.first_name?.[0] || 'A')}{(user?.last_name?.[0] || 'U')}
                    </div>
                    <div>
                      <Button variant="secondary" className="rounded-xl font-bold px-6">Change Avatar</Button>
                      <p className="text-[12px] text-slate-500 mt-3 font-medium">JPG, GIF or PNG. Max size of 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">First Name</label>
                      <TextInput defaultValue={user?.first_name || ''} className="h-12 border-slate-200 dark:border-slate-700 rounded-xl" />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Last Name</label>
                      <TextInput defaultValue={user?.last_name || ''} className="h-12 border-slate-200 dark:border-slate-700 rounded-xl" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Profile Bio</label>
                      <TextAreaInput className="min-h-[120px] border-slate-200 dark:border-slate-700 rounded-xl" placeholder="A few words about yourself..." defaultValue="Product Manager passionate about building scalable Enterprise Software." />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-10">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
                  <p className="text-slate-500 mt-2 text-[15px]">Decide how and when you want to be alerted.</p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/40">
                  {[
                    { label: 'Project Mentions', desc: 'When someone tags you in a comment or document.' },
                    { label: 'Task Assignments', desc: 'When a new task is directly assigned to you.' },
                    { label: 'Status Updates', desc: 'When a project you follow changes status.' },
                    { label: 'Weekly Summary', desc: 'A digest of your work performance sent every Monday.' },
                  ].map((n, i) => (
                    <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                      <div className="pr-8">
                        <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-1">{n.label}</p>
                        <p className="text-[13px] text-slate-500 font-medium">{n.desc}</p>
                      </div>
                      <CheckboxInput checked onChange={() => { }} className="scale-125" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'localization' && (
              <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-10">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Localization</h1>
                  <p className="text-slate-500 mt-2 text-[15px]">Configure your language, region, and time formats.</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3 col-span-2">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Interface Language</label>
                      <DropdownSelect className="h-12 border-slate-200 dark:border-slate-700 rounded-xl" defaultValue="en">
                        <option value="en">English (United States)</option>
                        <option value="uk">English (United Kingdom)</option>
                        <option value="hi">Hindi</option>
                      </DropdownSelect>
                      <p className="text-xs text-slate-400 font-medium ml-1">This changes the language used across the entire application.</p>
                    </div>
                    <div className="divider col-span-2 border-t border-slate-200 dark:border-slate-700 my-2"></div>
                    <div className="space-y-3 col-span-2 sm:col-span-1">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Date Format</label>
                      <DropdownSelect className="h-12 border-slate-200 dark:border-slate-700 rounded-xl" defaultValue="ddmmyyyy">
                        <option value="ddmmyyyy">DD-MM-YYYY</option>
                        <option value="mmddyyyy">MM/DD/YYYY</option>
                        <option value="custom">Custom Format</option>
                      </DropdownSelect>
                    </div>
                    <div className="space-y-3 col-span-2 sm:col-span-1">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Time Format</label>
                      <DropdownSelect className="h-12 border-slate-200 dark:border-slate-700 rounded-xl" defaultValue="12">
                        <option value="12">12-hour (1:00 PM)</option>
                        <option value="24">24-hour (13:00)</option>
                      </DropdownSelect>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'organization' && settingsTabs.organization(userRole) && (
              <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-10">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Organization Settings</h1>
                  <p className="text-slate-500 mt-2 text-[15px]">Manage company branding, timezone, and global defaults.</p>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-8">
                  <div className="flex items-center gap-8 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="w-20 h-20 rounded-2xl bg-brand-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-teal-500/20">
                      TR
                    </div>
                    <div className="flex-1">
                      <p className="text-[18px] font-black text-slate-800 dark:text-white">TechnoRUCS</p>
                      <p className="text-[14px] text-slate-500 font-medium flex items-center gap-2 mt-1">
                        Professional Services • Kolkata, India
                      </p>
                    </div>
                    <Button outlined className="font-bold border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">Change Details</Button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3 col-span-2">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Company Name</label>
                      <TextInput defaultValue="TechnoRUCS" className="h-12 border-slate-200 dark:border-slate-700 rounded-xl" />
                    </div>
                    <div className="space-y-3 col-span-2 sm:col-span-1">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Global Timezone</label>
                      <DropdownSelect className="h-12 border-slate-200 dark:border-slate-700 rounded-xl" defaultValue="IST">
                        <option value="IST">India Standard Time (IST)</option>
                        <option value="EST">Eastern Standard Time (EST)</option>
                        <option value="PST">Pacific Standard Time (PST)</option>
                      </DropdownSelect>
                    </div>
                    <div className="space-y-3 col-span-2 sm:col-span-1">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Fiscal Year Start</label>
                      <DropdownSelect className="h-12 border-slate-200 dark:border-slate-700 rounded-xl" defaultValue="apr">
                        <option value="jan">January 1st</option>
                        <option value="apr">April 1st</option>
                        <option value="jul">July 1st</option>
                      </DropdownSelect>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-10">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Security & Access</h1>
                  <p className="text-slate-500 mt-2 text-[15px]">Manage your passwords and two-factor authentication.</p>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                    <Shield className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Single Sign-On Enabled</h3>
                  <p className="text-slate-500 max-w-sm font-medium mb-8">Your account is currently managed securely by Microsoft Active Directory (O365). Passwords must be changed in your AD portal.</p>
                  <Button disabled variant="secondary" className="font-bold rounded-xl">Managed by IT Department</Button>
                </div>
              </div>
            )}

            {activeTab === 'automations' && (
              <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700 max-w-lg mx-auto">
                <div className="relative mb-8 group">
                  <div className="absolute inset-0 bg-brand-teal-400 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 rounded-full"></div>
                  <div className="relative w-24 h-24 bg-white dark:bg-slate-800 shadow-2xl rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    <Zap className="w-10 h-10 text-brand-teal-500" />
                  </div>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Workflow Automations</h2>
                <p className="text-slate-500 text-[15px] font-medium leading-relaxed mb-10">
                  Create visual rules to automate repetitive tasks across your workspace. Automatically assign issues, change project statuses, or send external notifications based on triggers.
                </p>
                <Button className="bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold py-3.5 px-8 rounded-2xl shadow-xl shadow-brand-teal-500/20 flex items-center gap-2 border-0">
                  <Plus className="w-4 h-4" /> Build Smart Workflow
                </Button>
              </div>
            )}

          </div>

          { }
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between pointer-events-auto shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-3 text-slate-500 font-medium text-[13px]">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Settings save automatically, but profile changes require a manual save.</span>
            </div>
            <div className="flex items-center gap-4">
              <Button className="text-[14px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors px-4">Discard changes</Button>
              <Button variant="primary" className="px-8 !h-12 !rounded-2xl">
                <Save className="w-4 h-4" /> Save Preferences
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}

function Plus(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
