'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal, ConfirmModal } from '@/components/ui/modal';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit2, Trash2, Database } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { KnowledgeBaseItem } from '@/types';

export default function KnowledgeBasePage() {
    const { t, language } = useI18n();
    const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<KnowledgeBaseItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
    });

    const supabase = createClient();
    const isRtl = language === 'ar';

    // Set auth token for API client
    useEffect(() => {
        const setToken = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                apiClient.setAuthToken(session.access_token);
            }
        };
        setToken();
    }, []);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getKnowledgeBase();
            setItems(data || []);
        } catch (error) {
            const { data, error: dbError } = await supabase
                .from('knowledge_base')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (dbError) {
                toast.error('Failed to load knowledge base');
            } else {
                setItems(data || []);
            }
        }
        setLoading(false);
    };

    const openAddModal = () => {
        setEditItem(null);
        setFormData({ title: '', content: '', category: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (item: KnowledgeBaseItem) => {
        setEditItem(item);
        setFormData({
            title: item.title || '',
            content: item.content,
            category: item.category || '',
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.content.trim()) {
            toast.error('Content is required');
            return;
        }

        setSaving(true);
        try {
            if (editItem) {
                await apiClient.updateKnowledgeBaseItem(editItem.id, {
                    title: formData.title,
                    content: formData.content,
                    category: formData.category,
                });
                toast.success('Synced');
            } else {
                await apiClient.addKnowledgeBaseItem({
                    title: formData.title,
                    content: formData.content,
                    category: formData.category,
                });
                toast.success('Indexed');
            }
            setIsModalOpen(false);
            fetchItems();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save item');
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await apiClient.deleteKnowledgeBaseItem(deleteId);
            toast.success('Deleted');
            fetchItems();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete item');
        }
        setDeleting(false);
        setDeleteId(null);
    };

    const filteredItems = items.filter((item) =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];

    return (
        <DashboardLayout
            title={t('knowledgeBase')}
            subtitle={t('knowledgeBaseSubtitle')}
        >
            {/* Toolbar */}
            <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 mb-8", isRtl && "sm:flex-row-reverse")}>
                <div className="relative w-full sm:w-96">
                    <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400", isRtl ? "right-3" : "left-3")} />
                    <input
                        type="text"
                        placeholder={t('searchKB')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn("input", isRtl ? "pr-10 pl-4 text-right" : "pl-10 pr-4")}
                    />
                </div>
                <Button
                    onClick={openAddModal}
                    leftIcon={!isRtl && <Plus className="w-4 h-4" />}
                    rightIcon={isRtl && <Plus className="w-4 h-4" />}
                    className="w-full sm:w-auto shadow-lg shadow-primary-500/20 rounded-xl"
                >
                    {t('addContent')}
                </Button>
            </div>

            {/* Category Pills */}
            {categories.length > 0 && (
                <div className={cn("flex items-center gap-3 mb-8 overflow-x-auto pb-2 scrollbar-none", isRtl && "flex-row-reverse")}>
                    <span className="text-sm font-bold text-surface-400 uppercase tracking-widest whitespace-nowrap">{t('categories')}:</span>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSearchQuery(cat || '')}
                            className="px-4 py-1.5 rounded-full text-xs font-bold bg-surface-100 text-surface-600 
                             hover:bg-primary-50 hover:text-primary-600 transition-all border border-transparent hover:border-primary-100 whitespace-nowrap"
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <Card className="p-20 text-center border-dashed border-2 border-surface-200 bg-surface-50/30">
                    <div className="w-20 h-20 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-6 border border-surface-200">
                        <Database className="w-10 h-10 text-surface-300" />
                    </div>
                    <h3 className="text-xl font-black text-surface-900 mb-2">
                        {searchQuery ? t('noResultsFound') : t('kbEmpty')}
                    </h3>
                    <p className="text-surface-500 mb-8 max-w-sm mx-auto font-medium">
                        {searchQuery
                            ? t('tryDifferentSearch')
                            : t('kbEmptyDesc')}
                    </p>
                    {!searchQuery && (
                        <Button onClick={openAddModal} className="rounded-xl px-8 shadow-xl shadow-primary-500/20">
                            {t('addFirstEntry')}
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {filteredItems.map((item) => (
                        <Card key={item.id} hover className="p-0 overflow-hidden border-surface-200 group flex flex-col">
                            <div className={cn("p-6 flex-1", isRtl && "text-right")}>
                                <div className={cn("flex items-start justify-between gap-4 mb-4", isRtl && "flex-row-reverse")}>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-surface-900 group-hover:text-primary-600 transition-colors text-lg tracking-tight truncate">
                                            {item.title || 'Untitled'}
                                        </h3>
                                        {item.category && (
                                            <Badge variant="info" className="mt-2 text-[10px] font-black uppercase tracking-wider">
                                                {item.category}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}>
                                        <button
                                            onClick={() => openEditModal(item)}
                                            className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 
                                             hover:text-primary-600 transition-all border border-transparent hover:border-surface-200"
                                            title={t('editContent')}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(item.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 text-surface-400 
                                             hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                                            title={t('deleteContent')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-surface-500 line-clamp-6 leading-relaxed font-medium">
                                    {item.content}
                                </p>
                            </div>
                            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary-500/10 to-transparent group-hover:from-primary-500 group-hover:via-primary-500 group-hover:to-primary-500 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editItem ? t('editContent') : t('addContent')}
                size="lg"
            >
                <div className={cn("space-y-6", isRtl && "text-right font-arabic")}>
                    <div>
                        <Input
                            label={t('title')}
                            placeholder="e.g., ISO 27001 Certification"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={cn("h-11", isRtl && "text-right font-arabic")}
                        />
                    </div>
                    <div>
                        <Input
                            label={t('category')}
                            placeholder="e.g., Certifications, Capabilities"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className={cn("h-11", isRtl && "text-right font-arabic")}
                        />
                    </div>
                    <div>
                        <Textarea
                            label={t('content')}
                            placeholder="Enter the detailed content..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className={cn("min-h-[200px] leading-relaxed", isRtl && "text-right font-arabic")}
                        />
                    </div>
                    <div className={cn("flex justify-end gap-3 pt-6", isRtl && "flex-row-reverse")}>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="rounded-xl px-6">
                            {t('cancel')}
                        </Button>
                        <Button onClick={handleSave} isLoading={saving} className="rounded-xl px-8 shadow-lg shadow-primary-500/20">
                            {editItem ? t('saveChanges') : t('addContent')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title={t('deleteContent')}
                description={t('deleteConfirmKB')}
                confirmText={t('delete')}
                variant="danger"
                isLoading={deleting}
            />
        </DashboardLayout>
    );
}
