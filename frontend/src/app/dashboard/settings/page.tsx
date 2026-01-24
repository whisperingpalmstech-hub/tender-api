'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { User, Building, Bell, Shield, Eye, EyeOff, Save, Loader2 } from 'lucide-react';

interface UserProfile {
    id: string;
    full_name: string | null;
    department: string | null;
    role: string | null;
}

export default function SettingsPage() {
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
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return;
            }

            setUserEmail(user.email || '');
            setCompany(user.user_metadata?.company || '');

            // Get user profile from user_profiles table
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setFormData({
                    fullName: profileData.full_name || user.user_metadata?.full_name || '',
                    department: profileData.department || user.user_metadata?.department || '',
                });
            } else {
                // Use metadata as fallback
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

            // Update auth metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: formData.fullName,
                    department: formData.department,
                    company: company,
                },
            });

            if (authError) throw authError;

            // Update or insert user_profiles
            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    full_name: formData.fullName,
                    department: formData.department,
                    updated_at: new Date().toISOString(),
                });

            if (profileError) throw profileError;

            toast.success('Profile updated successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        // Validate passwords
        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setChangingPassword(true);

        try {
            // First verify current password by signing in
            const { data: { user } } = await supabase.auth.getUser();

            if (!user?.email) {
                toast.error('User email not found');
                return;
            }

            // Verify current password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: passwordData.currentPassword,
            });

            if (signInError) {
                toast.error('Current password is incorrect');
                setChangingPassword(false);
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordData.newPassword,
            });

            if (updateError) throw updateError;

            toast.success('Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Settings" subtitle="Manage your account and preferences">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Settings"
            subtitle="Manage your account and preferences"
        >
            <div className="max-w-3xl space-y-6">
                {/* Profile Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-primary-100">
                            <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-surface-900">Profile</h3>
                            <p className="text-sm text-surface-500">Your personal information</p>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="input"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={userEmail}
                                className="input bg-surface-50"
                                disabled
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Department</label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="input"
                                placeholder="Engineering"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Role</label>
                            <input
                                type="text"
                                value={profile?.role || 'USER'}
                                className="input bg-surface-50"
                                disabled
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button onClick={handleSaveProfile} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
                            Save Changes
                        </Button>
                    </div>
                </Card>

                {/* Organization Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-purple-100">
                            <Building className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-surface-900">Organization</h3>
                            <p className="text-sm text-surface-500">Company settings</p>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Company Name</label>
                            <input
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="input"
                                placeholder="Acme Corporation"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1">Industry</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Technology"
                            />
                        </div>
                    </div>
                </Card>

                {/* Notification Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-amber-100">
                            <Bell className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-surface-900">Notifications</h3>
                            <p className="text-sm text-surface-500">Manage notification preferences</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <p className="font-medium text-surface-900">Processing Complete</p>
                                <p className="text-sm text-surface-500">
                                    Notify when document analysis is complete
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.processingComplete}
                                onChange={(e) => setNotifications({ ...notifications, processingComplete: e.target.checked })}
                                className="w-5 h-5 rounded accent-primary-500"
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <p className="font-medium text-surface-900">Response Approved</p>
                                <p className="text-sm text-surface-500">
                                    Notify when responses are approved
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.responseApproved}
                                onChange={(e) => setNotifications({ ...notifications, responseApproved: e.target.checked })}
                                className="w-5 h-5 rounded accent-primary-500"
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <p className="font-medium text-surface-900">Weekly Summary</p>
                                <p className="text-sm text-surface-500">
                                    Receive weekly activity summary
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.weeklySummary}
                                onChange={(e) => setNotifications({ ...notifications, weeklySummary: e.target.checked })}
                                className="w-5 h-5 rounded accent-primary-500"
                            />
                        </label>
                    </div>
                </Card>

                {/* Security Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-red-100">
                            <Shield className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-surface-900">Security</h3>
                            <p className="text-sm text-surface-500">Password and authentication</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-surface-700 mb-1">Current Password</label>
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="input pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-8 text-surface-400 hover:text-surface-600"
                            >
                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-surface-700 mb-1">New Password</label>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="input pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-8 text-surface-400 hover:text-surface-600"
                            >
                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-surface-700 mb-1">Confirm New Password</label>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="input pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-8 text-surface-400 hover:text-surface-600"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button
                            variant="secondary"
                            onClick={handleChangePassword}
                            isLoading={changingPassword}
                            disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        >
                            Change Password
                        </Button>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
