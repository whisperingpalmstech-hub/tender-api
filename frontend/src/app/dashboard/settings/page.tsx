'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { User, Building, Bell, Shield, Eye, EyeOff, Save, Loader2, Globe, Palette, CheckCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useLanguageStore, Language } from '@/store/use-language-store';
import { cn } from '@/lib/utils';

interface UserProfile {
    id: string;
    full_name: string | null;
    department: string | null;
    role: string | null;
}

const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇦🇪' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '简体中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export default function SettingsPage() {
    const { t, language: currentLang } = useI18n();
    const { setLanguage } = useLanguageStore();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [userEmail, setUserEmail] = useState('');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [company, setCompany] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        department: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [notifications, setNotifications] = useState({
        processingComplete: true,
        responseApproved: true,
        weeklySummary: false,
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserEmail(user.email || '');
            setCompany(user.user_metadata?.company || '');

            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                const profile = profileData as { full_name?: string; department?: string };
                setFormData({
                    fullName: profile.full_name || user.user_metadata?.full_name || '',
                    department: profile.department || user.user_metadata?.department || '',
                });
            } else {
                setFormData({
                    fullName: user.user_metadata?.full_name || '',
                    department: user.user_metadata?.department || '',
                });
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Not authenticated');
                return;
            }

            await supabase.auth.updateUser({
                data: {
                    full_name: formData.fullName,
                    department: formData.department,
                    company: company,
                },
            });

            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    full_name: formData.fullName,
                    department: formData.department,
                    updated_at: new Date().toISOString(),
                } as any);

            if (profileError) throw profileError;
            toast.success('Profile updated successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setChangingPassword(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) return;

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: passwordData.currentPassword,
            });

            if (signInError) {
                toast.error('Current password incorrect');
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordData.newPassword,
            });

            if (updateError) throw updateError;
            toast.success('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setChangingPassword(false);
        }
    };

    const isRtl = currentLang === 'ar';

    if (loading) {
        return (
            <DashboardLayout title={t('settings')} subtitle={t('manageAccount')}>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title={t('settings')} subtitle={t('manageAccount')}>
            <div className={cn("max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500", isRtl && "text-right")}>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Language Settings */}
                    <Card className="p-8 border-surface-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
                        <div className={cn("flex items-center gap-4 mb-8", isRtl && "flex-row-reverse")}>
                            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className={isRtl ? "text-right" : ""}>
                                <h3 className="text-xl font-black text-surface-900 tracking-tight">{t('language')}</h3>
                                <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mt-1">{t('userInterface')}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code)}
                                    className={cn(
                                        "relative flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm transition-all text-left group/btn",
                                        currentLang === lang.code
                                            ? "bg-primary-50 border-primary-500 text-primary-700 font-black shadow-lg shadow-primary-500/10"
                                            : "border-surface-100 hover:bg-surface-50 text-surface-600 hover:border-surface-200",
                                        isRtl && "flex-row-reverse text-right"
                                    )}
                                >
                                    <span className="text-xl flex-shrink-0">{lang.flag}</span>
                                    <span className="truncate">{lang.name}</span>
                                    {currentLang === lang.code && (
                                        <CheckCircle className={cn("absolute w-4 h-4 text-primary-500", isRtl ? "left-3" : "right-3")} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Theme Settings */}
                    <Card className="p-8 border-surface-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
                        <div className={cn("flex items-center gap-4 mb-8", isRtl && "flex-row-reverse")}>
                            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                                <Palette className="w-6 h-6" />
                            </div>
                            <div className={isRtl ? "text-right" : ""}>
                                <h3 className="text-xl font-black text-surface-900 tracking-tight">{t('theme')}</h3>
                                <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mt-1">{t('visualSettings')}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <button className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-primary-500 bg-primary-50 text-primary-700 font-black shadow-lg shadow-primary-500/10">
                                <div className="w-full aspect-video bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
                                    <div className="h-2 w-full bg-surface-50 border-b border-surface-100" />
                                    <div className="p-2 space-y-1">
                                        <div className="h-1 w-3/4 bg-surface-100 rounded" />
                                        <div className="h-1 w-1/2 bg-surface-100 rounded" />
                                    </div>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest">{t('light')}</span>
                            </button>
                            <button className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-transparent hover:border-surface-200 bg-surface-50 text-surface-400">
                                <div className="w-full aspect-video bg-surface-900 rounded-xl border border-surface-800 shadow-sm overflow-hidden">
                                    <div className="h-2 w-full bg-surface-800" />
                                    <div className="p-2 space-y-1">
                                        <div className="h-1 w-3/4 bg-surface-700 rounded" />
                                        <div className="h-1 w-1/2 bg-surface-700 rounded" />
                                    </div>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest">{t('dark')}</span>
                            </button>
                            <button className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-transparent hover:border-surface-200 bg-surface-50 text-surface-400">
                                <div className="w-full aspect-video bg-gradient-to-tr from-white to-surface-900 rounded-xl border border-surface-200 shadow-sm" />
                                <span className="text-[10px] uppercase tracking-widest">{t('system')}</span>
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Profile Settings */}
                <Card className="p-8 border-surface-200 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className={cn("flex items-center gap-4 mb-8", isRtl && "flex-row-reverse")}>
                        <div className="p-3 rounded-2xl bg-primary-50 text-primary-600">
                            <User className="w-6 h-6" />
                        </div>
                        <div className={isRtl ? "text-right" : ""}>
                            <h3 className="text-xl font-black text-surface-900 tracking-tight">{t('profile')}</h3>
                            <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mt-1">Personal information</p>
                        </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className={isRtl ? "text-right" : ""}>
                            <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">{t('profile')} {t('title')}</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className={cn("input h-12 bg-surface-50/50 border-surface-100 hover:border-primary-200 focus:bg-white transition-all", isRtl && "text-right")}
                                placeholder="Full Name"
                            />
                        </div>
                        <div className={isRtl ? "text-right" : ""}>
                            <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">{t('email')}</label>
                            <input
                                type="email"
                                value={userEmail}
                                className={cn("input h-12 bg-surface-50 cursor-not-allowed opacity-70", isRtl && "text-right")}
                                disabled
                            />
                        </div>
                        <div className={isRtl ? "text-right" : ""}>
                            <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">{t('department')}</label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className={cn("input h-12 bg-surface-50/50 border-surface-100 hover:border-primary-200 focus:bg-white transition-all", isRtl && "text-right")}
                                placeholder="e.g. Engineering"
                            />
                        </div>
                        <div className={isRtl ? "text-right" : ""}>
                            <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">{t('role')}</label>
                            <input
                                type="text"
                                value={profile?.role || 'USER'}
                                className={cn("input h-12 bg-surface-50 cursor-not-allowed opacity-70", isRtl && "text-right")}
                                disabled
                            />
                        </div>
                    </div>
                    <div className={cn("flex justify-end mt-8", isRtl && "justify-start")}>
                        <Button
                            onClick={handleSaveProfile}
                            isLoading={saving}
                            className="px-10 h-12 rounded-2xl shadow-xl shadow-primary-500/20 font-black"
                            leftIcon={!isRtl && <Save className="w-5 h-5" />}
                            rightIcon={isRtl && <Save className="w-5 h-5" />}
                        >
                            {t('saveChanges')}
                        </Button>
                    </div>
                </Card>

                {/* Organization & Security */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Organization Settings */}
                    <Card className="p-8 border-surface-200">
                        <div className={cn("flex items-center gap-4 mb-8", isRtl && "flex-row-reverse")}>
                            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                                <Building className="w-6 h-6" />
                            </div>
                            <div className={isRtl ? "text-right" : ""}>
                                <h3 className="text-xl font-black text-surface-900 tracking-tight">{t('organization')}</h3>
                                <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mt-1">{t('organizationIdentification')}</p>
                            </div>
                        </div>
                        <div className={isRtl ? "text-right" : ""}>
                            <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">{t('companyName')}</label>
                            <input
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className={cn("input h-12 bg-surface-50/50 border-surface-100 focus:bg-white", isRtl && "text-right")}
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                    </Card>

                    {/* Security Settings */}
                    <Card className="p-8 border-surface-200 bg-surface-50/20 border-dashed">
                        <div className={cn("flex items-center gap-4 mb-8", isRtl && "flex-row-reverse")}>
                            <div className="p-3 rounded-2xl bg-red-50 text-red-600">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div className={isRtl ? "text-right" : ""}>
                                <h3 className="text-xl font-black text-surface-900 tracking-tight">{t('security')}</h3>
                                <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mt-1">{t('changePassword')}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className={cn("input h-11 pr-12", isRtl && "text-right pl-12 pr-4")}
                                    placeholder={t('current')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className={cn("absolute top-3 text-surface-300 hover:text-surface-500", isRtl ? "left-4" : "right-4")}
                                >
                                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className={cn("input h-11 pr-12", isRtl && "text-right pl-12 pr-4")}
                                    placeholder={t('new')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className={cn("absolute top-3 text-surface-300 hover:text-surface-500", isRtl ? "left-4" : "right-4")}
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className={cn("input h-11 pr-12", isRtl && "text-right pl-12 pr-4")}
                                    placeholder={t('confirm')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className={cn("absolute top-3 text-surface-300 hover:text-surface-500", isRtl ? "left-4" : "right-4")}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div className={cn("flex justify-end mt-6", isRtl && "justify-start")}>
                            <Button
                                variant="secondary"
                                onClick={handleChangePassword}
                                isLoading={changingPassword}
                                disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                className="w-full h-11 rounded-xl font-bold border-surface-200"
                            >
                                {t('changePassword')}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
