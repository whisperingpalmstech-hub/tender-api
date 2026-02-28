'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';
import {
    Users, UserPlus, Shield, Trash2, Edit3, Search, ChevronDown,
    Mail, Building, Award, Loader2, CheckCircle, XCircle, MoreVertical, X,
    Crown, BarChart3, PenTool, Eye, UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgUser {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    designation: string | null;
    department: string | null;
    is_active: boolean;
    created_at: string | null;
}

interface RoleInfo {
    role_name: string;
    description: string;
    is_system?: boolean;
}

const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'bg-red-50 text-red-700 border-red-200',
    MANAGER: 'bg-purple-50 text-purple-700 border-purple-200',
    BID_WRITER: 'bg-blue-50 text-blue-700 border-blue-200',
    AUDITOR: 'bg-amber-50 text-amber-700 border-amber-200',
    USER: 'bg-surface-50 text-surface-600 border-surface-200',
};

const ROLE_ICON_COMPONENTS: Record<string, React.ReactNode> = {
    ADMIN: <Crown className="w-4 h-4" />,
    MANAGER: <BarChart3 className="w-4 h-4" />,
    BID_WRITER: <PenTool className="w-4 h-4" />,
    AUDITOR: <Eye className="w-4 h-4" />,
    USER: <UserCircle className="w-4 h-4" />,
};

const ROLE_GRADIENT: Record<string, string> = {
    ADMIN: 'from-red-500 to-rose-600',
    MANAGER: 'from-purple-500 to-violet-600',
    BID_WRITER: 'from-blue-500 to-indigo-600',
    AUDITOR: 'from-amber-500 to-orange-600',
    USER: 'from-slate-400 to-slate-500',
};

export default function AdminPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<OrgUser[]>([]);
    const [roles, setRoles] = useState<RoleInfo[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState('');
    const [currentUserId, setCurrentUserId] = useState('');
    const [search, setSearch] = useState('');

    // Invite modal
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: '', full_name: '', role: 'BID_WRITER', designation: '', department: '',
    });

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editUser, setEditUser] = useState<OrgUser | null>(null);
    const [editForm, setEditForm] = useState({
        role: '', designation: '', department: '', full_name: '',
    });

    // Action menu
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const setAuthToken = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            apiClient.setAuthToken(session.access_token);
        }
    }, [supabase]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            await setAuthToken();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setCurrentUserId(user.id);

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const role = (profile as any)?.role || 'USER';
            setCurrentUserRole(role);

            if (role !== 'ADMIN') {
                toast.error('Access denied. Only administrators can manage users.');
                router.push('/dashboard');
                return;
            }

            const [usersData, rolesData] = await Promise.all([
                apiClient.getAdminUsers(),
                apiClient.getAdminRoles(),
            ]);

            setUsers(usersData || []);
            setRoles(rolesData?.default_roles || []);
        } catch (error: any) {
            console.error('Failed to load admin data:', error);
            toast.error(error.message || 'Failed to load admin data');
        } finally {
            setLoading(false);
        }
    }, [supabase, router, setAuthToken]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInvite = async () => {
        if (!inviteForm.email || !inviteForm.full_name) {
            toast.error('Email and name are required');
            return;
        }

        setInviteLoading(true);
        try {
            await setAuthToken();
            const result = await apiClient.inviteUser(inviteForm);

            if (result.temp_password) {
                // Show temp password prominently - keep toast visible longer
                toast.success(
                    `✅ Account created for ${inviteForm.email}\n\n🔑 Temporary Password: ${result.temp_password}\n\nShare this securely with the user.`,
                    { duration: 15000 }
                );
            } else {
                toast.success(result.message || 'User invited successfully');
            }

            setShowInviteModal(false);
            setInviteForm({ email: '', full_name: '', role: 'BID_WRITER', designation: '', department: '' });
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to invite user');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!editUser) return;

        setEditLoading(true);
        try {
            await setAuthToken();
            await apiClient.updateUser(editUser.id, editForm);
            toast.success('User updated successfully');
            setShowEditModal(false);
            setEditUser(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (userId: string, name: string) => {
        if (!confirm(`Are you sure you want to remove "${name}" from the organization? This action can be undone by re-inviting them.`)) return;

        try {
            await setAuthToken();
            await apiClient.deleteUser(userId);
            toast.success('User removed from organization');
            setActiveMenu(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to remove user');
        }
    };

    const openEditModal = (user: OrgUser) => {
        setEditUser(user);
        setEditForm({
            role: user.role,
            designation: user.designation || '',
            department: user.department || '',
            full_name: user.full_name || '',
        });
        setShowEditModal(true);
        setActiveMenu(null);
    };

    const filteredUsers = users.filter(u =>
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase()) ||
        u.designation?.toLowerCase().includes(search.toLowerCase()))
    );

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'ADMIN').length,
        active: users.filter(u => u.is_active !== false).length,
    };

    if (loading) {
        return (
            <DashboardLayout title="Admin Panel" subtitle="Organization Management">
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                        <p className="text-surface-400 font-medium animate-pulse">Loading organization data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Admin Panel" subtitle="Manage users, roles & organization settings">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 border-surface-200 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-surface-400 uppercase tracking-widest">Total Members</p>
                                <p className="text-4xl font-black text-surface-900 mt-2 tracking-tight">{stats.total}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary-50 text-primary-600 group-hover:scale-110 transition-transform">
                                <Users className="w-7 h-7" />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 border-surface-200 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-surface-400 uppercase tracking-widest">Administrators</p>
                                <p className="text-4xl font-black text-red-600 mt-2 tracking-tight">{stats.admins}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-red-50 text-red-600 group-hover:scale-110 transition-transform">
                                <Shield className="w-7 h-7" />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 border-surface-200 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-surface-400 uppercase tracking-widest">Active Users</p>
                                <p className="text-4xl font-black text-emerald-600 mt-2 tracking-tight">{stats.active}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                                <CheckCircle className="w-7 h-7" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Users Table */}
                <Card className="border-surface-200 overflow-visible pb-16">
                    {/* Header */}
                    <div className="p-6 border-b border-surface-100 bg-white rounded-t-xl">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-surface-900 tracking-tight">Organization Members</h2>
                                <p className="text-sm text-surface-400 mt-1">Manage team access and permissions</p>
                            </div>
                            <Button
                                onClick={() => setShowInviteModal(true)}
                                className="px-6 h-11 rounded-2xl shadow-xl shadow-primary-500/20 font-bold gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Member
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="relative mt-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="input h-11 pl-11 bg-surface-50 border-surface-100 rounded-xl w-full max-w-md focus:bg-white transition-all"
                                placeholder="Search members by name, email, role..."
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-visible">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-50/50">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-surface-400 uppercase tracking-widest">Member</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-surface-400 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-surface-400 uppercase tracking-widest hidden md:table-cell">Designation</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-surface-400 uppercase tracking-widest hidden md:table-cell">Department</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-surface-400 uppercase tracking-widest hidden lg:table-cell">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-surface-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-50">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-surface-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold",
                                                    u.id === currentUserId
                                                        ? "bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-500/20"
                                                        : "bg-surface-100 text-surface-500"
                                                )}>
                                                    {u.full_name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-surface-900 text-sm">
                                                        {u.full_name || 'Unnamed'}
                                                        {u.id === currentUserId && (
                                                            <span className="ml-2 text-[10px] bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-black">YOU</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-surface-400 font-mono">{u.email || 'No email'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5",
                                                ROLE_COLORS[u.role] || ROLE_COLORS.USER
                                            )}>
                                                {ROLE_ICON_COMPONENTS[u.role] || <UserCircle className="w-3.5 h-3.5" />}
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-sm text-surface-600">{u.designation || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-sm text-surface-600">{u.department || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            {u.is_active !== false ? (
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-surface-400">
                                                    <span className="w-2 h-2 bg-surface-300 rounded-full" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}
                                                    className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-all"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                {activeMenu === u.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-2xl border border-surface-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <button
                                                            onClick={() => openEditModal(u)}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-colors"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                            Edit Member
                                                        </button>
                                                        {u.id !== currentUserId && (
                                                            <button
                                                                onClick={() => handleDelete(u.id, u.full_name || 'this user')}
                                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Remove Member
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-16">
                            <Users className="w-12 h-12 text-surface-200 mx-auto mb-3" />
                            <p className="text-surface-400 font-medium">No members found</p>
                        </div>
                    )}
                </Card>

                {/* Roles Overview */}
                <Card className="p-6 border-surface-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-lg shadow-primary-500/20">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-surface-900 tracking-tight">Available Roles</h3>
                            <p className="text-xs text-surface-400 mt-0.5">System-defined access levels for your organization</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {roles.map((role) => (
                            <div
                                key={role.role_name}
                                className="group p-5 rounded-2xl bg-white border border-surface-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform",
                                        ROLE_GRADIENT[role.role_name] || 'from-slate-400 to-slate-500'
                                    )}>
                                        {ROLE_ICON_COMPONENTS[role.role_name] || <UserCircle className="w-5 h-5" />}
                                    </div>
                                    <span className="font-black text-sm text-surface-900 uppercase tracking-wider">{role.role_name.replace('_', ' ')}</span>
                                </div>
                                <p className="text-xs text-surface-500 leading-relaxed">{role.description}</p>
                                <div className="mt-3 pt-3 border-t border-surface-50">
                                    <span className="text-[10px] font-bold text-surface-300 uppercase tracking-widest">
                                        {users.filter(u => u.role === role.role_name).length} member{users.filter(u => u.role === role.role_name).length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <div className="p-6 border-b border-surface-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-primary-50 text-primary-600">
                                        <UserPlus className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-surface-900 tracking-tight">Add Team Member</h3>
                                        <p className="text-xs text-surface-400 mt-0.5">Invite a new member to your organization</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">Full Name *</label>
                                <input
                                    type="text"
                                    value={inviteForm.full_name}
                                    onChange={e => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                                    className="input h-12 bg-surface-50 border-surface-100 rounded-xl w-full focus:bg-white transition-all"
                                    placeholder="e.g. John Smith"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">Email Address *</label>
                                <input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    className="input h-12 bg-surface-50 border-surface-100 rounded-xl w-full focus:bg-white transition-all"
                                    placeholder="john@company.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">Role *</label>
                                    <select
                                        value={inviteForm.role}
                                        onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                                        className="input h-12 bg-surface-50 border-surface-100 rounded-xl w-full focus:bg-white transition-all"
                                    >
                                        {roles.map(r => (
                                            <option key={r.role_name} value={r.role_name}>{r.role_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">Designation</label>
                                    <input
                                        type="text"
                                        value={inviteForm.designation}
                                        onChange={e => setInviteForm({ ...inviteForm, designation: e.target.value })}
                                        className="input h-12 bg-surface-50 border-surface-100 rounded-xl w-full focus:bg-white transition-all"
                                        placeholder="e.g. Senior Analyst"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">Department</label>
                                <input
                                    type="text"
                                    value={inviteForm.department}
                                    onChange={e => setInviteForm({ ...inviteForm, department: e.target.value })}
                                    className="input h-12 bg-surface-50 border-surface-100 rounded-xl w-full focus:bg-white transition-all"
                                    placeholder="e.g. Business Development"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-surface-100 flex items-center justify-end gap-3">
                            <Button variant="secondary" onClick={() => setShowInviteModal(false)} className="px-6 h-11 rounded-xl">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleInvite}
                                isLoading={inviteLoading}
                                className="px-8 h-11 rounded-xl shadow-lg shadow-primary-500/20 font-bold"
                            >
                                Add Member
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <div className="p-6 border-b border-surface-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                                        <Edit3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-surface-900 tracking-tight">Edit Member</h3>
                                        <p className="text-xs text-surface-400 mt-0.5">{editUser.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                    className="input h-12 bg-surface-50 border-surface-100 rounded-xl w-full focus:bg-white transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">Role</label>
                                    <select
                                        value={editForm.role}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                        className="input h-12 bg-surface-50 border-surface-100 rounded-xl w-full focus:bg-white transition-all"
                                        disabled={editUser.id === currentUserId}
                                    >
                                        {roles.map(r => (
                                            <option key={r.role_name} value={r.role_name}>{r.role_name}</option>
                                        ))}
                                    </select>
                                    {editUser.id === currentUserId && (
                                        <p className="text-[10px] text-amber-500 mt-1 font-bold">You cannot change your own role</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">Designation</label>
                                    <input
                                        type="text"
                                        value={editForm.designation}
                                        onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
                                        className="input h-12 bg-surface-50 border-surface-100 rounded-xl w-full focus:bg-white transition-all"
                                        placeholder="e.g. Lead Analyst"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 uppercase tracking-widest">Department</label>
                                <input
                                    type="text"
                                    value={editForm.department}
                                    onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                    className="input h-12 bg-surface-50 border-surface-100 rounded-xl w-full focus:bg-white transition-all"
                                    placeholder="e.g. Procurement"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-surface-100 flex items-center justify-end gap-3">
                            <Button variant="secondary" onClick={() => setShowEditModal(false)} className="px-6 h-11 rounded-xl">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEdit}
                                isLoading={editLoading}
                                className="px-8 h-11 rounded-xl shadow-lg shadow-primary-500/20 font-bold"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
