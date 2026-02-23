'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Building2,
    Users,
    FileCheck,
    Briefcase,
    Plus,
    Trash2,
    Save,
    MapPin,
    Globe,
    Mail,
    Phone,
    ShieldCheck,
    Search,
    ChevronRight,
    Star,
    Award,
    FileText,
    Linkedin
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type TabType = "profile" | "past-performance" | "team" | "certifications";

export default function CompanyProfilePage() {
    const [activeTab, setActiveTab] = useState<TabType>("profile");
    const [loading, setLoading] = useState(true);

    // States for various sections
    const [capabilities, setCapabilities] = useState<string[]>([]);
    const [newCapability, setNewCapability] = useState("");

    const [pastPerformance, setPastPerformance] = useState<any[]>([]);
    const [team, setTeam] = useState<any[]>([]);
    const [orgMembers, setOrgMembers] = useState<any[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<string>("USER");

    const { register, handleSubmit, setValue, getValues, reset: resetProfile } = useForm();
    const [certifications, setCertifications] = useState<any[]>([]);
    const { register: regPP, handleSubmit: handlePPSubmit, reset: resetPP } = useForm();
    const { register: regTeam, handleSubmit: handleTeamSubmit, reset: resetTeam } = useForm();
    const { register: regCert, handleSubmit: handleCertSubmit, reset: resetCert } = useForm();

    useEffect(() => {
        const initialize = async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                apiClient.setAuthToken(session.access_token);
            }
            loadAllData();
        };
        initialize();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [profile, pp, members, orgMembersData] = await Promise.all([
                apiClient.getCompanyProfile().catch(() => null),
                apiClient.getPastPerformance().catch(() => []),
                apiClient.getTeamProfiles().catch(() => []),
                apiClient.getOrgMembers().catch(() => [])
            ]);

            if (profile) {
                Object.keys(profile).forEach(key => {
                    setValue(key as any, profile[key]);
                });
                setCapabilities(profile.capabilities || []);
                setCertifications(profile.certifications || []);
            }

            setPastPerformance(pp || []);
            setTeam(members || []);
            setOrgMembers(orgMembersData || []);

            // Get current user and role from session/supabase
            const supabase = (await import('@/lib/supabase/client')).createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const currentMember = orgMembersData.find((m: any) => m.id === user?.id);
            if (currentMember) {
                setCurrentUserRole(currentMember.role);
            }
        } catch (e) {
            console.error("Error loading company data", e);
        } finally {
            setLoading(false);
        }
    };

    const onProfileSubmit = async (data: any) => {
        try {
            await apiClient.updateCompanyProfile({ ...data, capabilities, certifications });
            toast.success("Main profile updated successfully");
        } catch (e: any) {
            toast.error("Error: " + (e.message || "Failed to update"));
        }
    };

    const addCapability = () => {
        if (newCapability.trim() && !capabilities.includes(newCapability)) {
            setCapabilities([...capabilities, newCapability.trim()]);
            setNewCapability("");
        }
    };

    const removeCapability = (cap: string) => {
        setCapabilities(capabilities.filter(c => c !== cap));
    };

    const onPPSubmit = async (data: any) => {
        try {
            const res = await apiClient.addPastPerformance(data);
            setPastPerformance([...pastPerformance, res]);
            resetPP();
            toast.success("Case study added successfully");
        } catch (e: any) {
            toast.error("Failed to add project");
        }
    };

    const onTeamSubmit = async (data: any) => {
        try {
            const res = await apiClient.addTeamProfile(data);
            setTeam([...team, res]);
            resetTeam();
            toast.success("Team member onboarded");
        } catch (e: any) {
            toast.error("Failed to add member");
        }
    };

    const handleDeletePP = async (id: string) => {
        try {
            await apiClient.deletePastPerformance(id);
            setPastPerformance(pastPerformance.filter(p => p.id !== id));
            toast.success("Project removed");
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: string) => {
        try {
            await apiClient.updateMemberRole(memberId, newRole);
            toast.success(`Role updated to ${newRole}`);
            const updated = await apiClient.getOrgMembers();
            setOrgMembers(updated);
        } catch (e: any) {
            toast.error(e.message || "Failed to update role");
        }
    };

    const handleDeleteTeam = async (id: string) => {
        try {
            await apiClient.deleteTeamMember(id);
            setTeam(team.filter(t => t.id !== id));
            toast.success("Expert removed");
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const onCertSubmit = async (data: any) => {
        try {
            const currentProfile = getValues();
            const updatedCerts = [...certifications, data];
            await apiClient.updateCompanyProfile({ ...currentProfile, capabilities, certifications: updatedCerts });
            setCertifications(updatedCerts);
            resetCert();
            toast.success("Certification added successfully");
        } catch (e: any) {
            toast.error("Failed to add certification");
        }
    };

    const handleDeleteCert = async (index: number) => {
        try {
            const currentProfile = getValues();
            const updatedCerts = certifications.filter((_, i) => i !== index);
            await apiClient.updateCompanyProfile({ ...currentProfile, capabilities, certifications: updatedCerts });
            setCertifications(updatedCerts);
            toast.success("Certification removed");
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const isAuthorized = currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER';

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Enterprise Matrix</h1>
                        <p className="text-slate-500 font-medium">Define your company's core capabilities, project history, and expert team to power AI responses.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                    {[
                        { id: "profile", label: "Legal Profile", icon: Building2 },
                        { id: "past-performance", label: "Case Studies", icon: Briefcase },
                        { id: "team", label: "Expert Team", icon: Users },
                        { id: "certifications", label: "Certifications", icon: FileCheck },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
                                activeTab === tab.id
                                    ? "bg-white text-primary-600 shadow-sm shadow-slate-200"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Enterprise Data...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === "profile" && (
                            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Card className="p-8 border-slate-200 rounded-3xl shadow-xl shadow-slate-100/50">
                                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-primary-500" />
                                            Legal & Compliance
                                        </h3>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Official Company Name</label>
                                                <input {...register("legal_name", { required: true })} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-4 focus:ring-primary-500/5 transition-all outline-none" placeholder="e.g. Acme Solutions Ltd" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Tax ID / VAT</label>
                                                    <input {...register("tax_id")} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="Tax Number" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Reg. Number</label>
                                                    <input {...register("registration_number")} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="CR / Reg No" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Headquarters Address</label>
                                                <textarea {...register("company_address")} rows={6} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none resize-none" placeholder="Full legal address..." />
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-8 border-slate-200 rounded-3xl shadow-xl shadow-slate-100/50">
                                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <Globe className="w-5 h-5 text-primary-500" />
                                            Digital Presence & Contact
                                        </h3>
                                        <div className="space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block flex items-center gap-1"><Mail className="w-3 h-3" /> Tender Email</label>
                                                    <input {...register("contact_email")} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="bids@company.com" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
                                                    <input {...register("contact_phone")} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="+1 234..." />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Corporate Website</label>
                                                <input {...register("website")} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="https://..." />
                                            </div>

                                            <div className="pt-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Expertise Tags</label>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {capabilities.map(cap => (
                                                        <span key={cap} className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-2 border border-primary-100 group">
                                                            {cap}
                                                            <button type="button" onClick={() => removeCapability(cap)} className="hover:text-red-600 transition-colors">
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={newCapability}
                                                        onChange={(e) => setNewCapability(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
                                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-4 focus:ring-primary-500/5"
                                                        placeholder="Add skill (e.g. Cybersecurity)"
                                                    />
                                                    <Button type="button" onClick={addCapability} className="rounded-xl px-4 h-10 font-black" variant="secondary"><Plus className="w-4 h-4" /></Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" className="h-14 px-12 rounded-2xl font-black bg-slate-900 shadow-2xl shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                        <Save className="w-5 h-5 mr-3" />
                                        Save Enterprise Profile
                                    </Button>
                                </div>
                            </form>
                        )}

                        {activeTab === "past-performance" && (
                            <div className="space-y-8">
                                <Card className="p-8 border-slate-200 rounded-3xl shadow-xl shadow-slate-100/50">
                                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                        <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                                        Log New Case Study
                                    </h3>
                                    <form onSubmit={handlePPSubmit(onPPSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Project Title</label>
                                                <input {...regPP("project_title", { required: true })} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="e.g. Cloud Infrastructure Migration" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Client / Organization</label>
                                                <input {...regPP("client_name")} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="Ministry of Technology" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Value</label>
                                                    <input {...regPP("project_value", { valueAsNumber: true })} type="number" className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="500000" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Currency</label>
                                                    <select {...regPP("currency")} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none">
                                                        <option value="USD">USD</option>
                                                        <option value="SAR">SAR</option>
                                                        <option value="AED">AED</option>
                                                        <option value="EUR">EUR</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Executive Summary & Solution</label>
                                                <textarea {...regPP("description")} rows={4} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none resize-none" placeholder="Briefly explain what was done and the core value delivered..." />
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <Button type="submit" className="px-10 h-14 rounded-2xl font-black shadow-xl shadow-primary-500/20">
                                                    Deploy Case Study
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pastPerformance.map(pp => (
                                        <Card key={pp.id} className="p-6 border-slate-200 rounded-3xl hover:border-primary-200 transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-all">
                                                <Briefcase className="w-12 h-12 text-slate-200" />
                                            </div>
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-lg">
                                                    {pp.project_title[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{pp.project_title}</h4>
                                                    <p className="text-xs font-bold text-slate-400">{pp.client_name}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium mb-6 line-clamp-3 leading-relaxed">
                                                {pp.description || "No description provided."}
                                            </p>
                                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                                <span className="text-xs font-black bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg">
                                                    {pp.currency} {pp.project_value?.toLocaleString()}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-slate-400 hover:text-red-500 h-8 px-2"
                                                    onClick={() => handleDeletePP(pp.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                    {pastPerformance.length === 0 && (
                                        <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-white rounded-3xl border border-slate-100 flex items-center justify-center mx-auto mb-4">
                                                <Briefcase className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <h4 className="font-black text-slate-800 mb-1">No Past Performance Logged</h4>
                                            <p className="text-slate-400 text-sm font-medium">Add your previous wins to boost AI response relevance.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "team" && (
                            <div className="space-y-8">
                                <Card className="p-8 border-slate-200 rounded-3xl shadow-xl shadow-slate-100/50">
                                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                        <Award className="w-6 h-6 text-emerald-500" />
                                        Onboard Expert Personnel
                                    </h3>
                                    <form onSubmit={handleTeamSubmit(onTeamSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Full Name</label>
                                                <input {...regTeam("full_name", { required: true })} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="John Doe" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Designation</label>
                                                    <input {...regTeam("designation")} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="Lead Architect" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Experience (Years)</label>
                                                    <input {...regTeam("years_experience", { valueAsNumber: true })} type="number" className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="12" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn Profile</label>
                                                <input {...regTeam("linkedin_url")} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="https://linkedin.com/in/..." />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Professional Bio / Key Skills</label>
                                                <textarea {...regTeam("bio_summary")} rows={5} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none resize-none" placeholder="Highlight technical mastery and key contributions..." />
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <Button type="submit" className="px-10 h-14 rounded-2xl font-black bg-slate-900">
                                                    Onboard Expert
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {team.map(member => (
                                        <Card key={member.id} className="p-6 border-slate-200 rounded-3xl group hover:shadow-2xl hover:shadow-slate-200/50 transition-all border-b-4 border-b-slate-100 hover:border-b-primary-500">
                                            <div className="flex flex-col items-center text-center mb-6">
                                                <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mb-4 border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                                                    <UserCircle className="w-10 h-10 text-slate-300 group-hover:text-primary-400" />
                                                </div>
                                                <h4 className="font-black text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{member.full_name}</h4>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{member.designation}</p>
                                            </div>

                                            <div className="space-y-4 mb-6">
                                                <div className="flex justify-between items-center text-xs font-black text-slate-400 border-b border-slate-50 pb-2">
                                                    <span>EXPERIENCE</span>
                                                    <span className="text-slate-900">{member.years_experience} Years</span>
                                                </div>
                                                <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-3 italic">
                                                    "{member.bio_summary || "No bio summary added."}"
                                                </p>
                                            </div>

                                            <div className="flex justify-center gap-3">
                                                {member.linkedin_url && (
                                                    <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all">
                                                        <Linkedin className="w-5 h-5" />
                                                    </a>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-10 h-10 p-0 text-slate-400 hover:text-red-500"
                                                    onClick={() => handleDeleteTeam(member.id)}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                    {team.length === 0 && (
                                        <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-white rounded-3xl border border-slate-100 flex items-center justify-center mx-auto mb-4">
                                                <Users className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <h4 className="font-black text-slate-800 mb-1">Team Matrix Empty</h4>
                                            <p className="text-slate-400 text-sm font-medium">Onboard your experts to handle specialized technical requirements.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "certifications" && (
                            <div className="space-y-8">
                                {isAuthorized ? (
                                    <Card className="p-8 border-slate-200 rounded-3xl shadow-xl shadow-slate-100/50">
                                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <FileCheck className="w-6 h-6 text-primary-500" />
                                            Add Company Certification
                                        </h3>
                                        <form onSubmit={handleCertSubmit(onCertSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Certification Name</label>
                                                    <input {...regCert("name", { required: true })} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="e.g. ISO 27001" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Issuing Authority</label>
                                                    <input {...regCert("issuer", { required: true })} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" placeholder="e.g. BSI Group" />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Expiry Date (Optional)</label>
                                                    <input {...regCert("expiry")} type="date" className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none" />
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <Button type="submit" className="px-10 h-14 rounded-2xl font-black bg-slate-900 shadow-xl shadow-slate-900/10">
                                                        Add Certification
                                                    </Button>
                                                </div>
                                            </div>
                                        </form>
                                    </Card>
                                ) : (
                                    <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700">
                                        <ShieldCheck className="w-5 h-5" />
                                        <p className="text-sm font-bold">Only Administrators and Managers can add or modify certifications.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {certifications.map((cert, index) => (
                                        <Card key={index} className="p-6 border-slate-200 rounded-3xl hover:border-primary-200 transition-all group relative overflow-hidden">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                                                    <Award className="w-6 h-6 text-primary-500" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{cert.name}</h4>
                                                    <p className="text-xs font-bold text-slate-400">{cert.issuer}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    Expires: {cert.expiry || "N/A"}
                                                </span>
                                                {isAuthorized && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-slate-400 hover:text-red-500 h-8 px-2"
                                                        onClick={() => handleDeleteCert(index)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                    {certifications.length === 0 && (
                                        <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-white rounded-3xl border border-slate-100 flex items-center justify-center mx-auto mb-4">
                                                <FileCheck className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <h4 className="font-black text-slate-800 mb-1">No Certifications Found</h4>
                                            <p className="text-slate-400 text-sm font-medium">Add your company's official certifications to build trust in AI generated bids.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

const UserCircle = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);
