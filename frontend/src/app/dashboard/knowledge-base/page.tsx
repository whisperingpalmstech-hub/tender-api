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
import type { KnowledgeBaseItem } from '@/types';

export default function KnowledgeBasePage() {
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
            // Use API client to ensure we get items that are in the vector index
            const data = await apiClient.getKnowledgeBase();
            setItems(data || []);
        } catch (error) {
            // Fallback to Supabase if backend is not available
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
                // Update via API (updates both DB and vector index)
                await apiClient.updateKnowledgeBaseItem(editItem.id, {
                    title: formData.title,
                    content: formData.content,
                    category: formData.category,
                });
                toast.success('Item updated & vector index synced');
            } else {
                // Create via API (adds to both DB and vector index)
                await apiClient.addKnowledgeBaseItem({
                    title: formData.title,
                    content: formData.content,
                    category: formData.category,
                });
                toast.success('Item added & indexed for matching');
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
            // Delete via API (removes from both DB and vector index)
            await apiClient.deleteKnowledgeBaseItem(deleteId);
            toast.success('Item deleted & removed from index');
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
            title="Knowledge Base"
            subtitle="Manage your company's capability content"
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                        type="text"
                        placeholder="Search knowledge base..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <Button onClick={openAddModal} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Content
                </Button>
            </div>

            {/* Category Pills */}
            {categories.length > 0 && (
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    <span className="text-sm text-surface-500">Categories:</span>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSearchQuery(cat || '')}
                            className="px-3 py-1 rounded-full text-sm bg-surface-100 text-surface-700 
                       hover:bg-surface-200 transition-colors whitespace-nowrap"
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <Card className="p-12 text-center">
                    <Database className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-surface-900 mb-2">
                        {searchQuery ? 'No Results Found' : 'Knowledge Base is Empty'}
                    </h3>
                    <p className="text-surface-500 mb-6">
                        {searchQuery
                            ? 'Try a different search term'
                            : 'Add your company capabilities to start matching against tender requirements'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={openAddModal}>Add First Entry</Button>
                    )}
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredItems.map((item) => (
                        <Card key={item.id} hover className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-medium text-surface-900">
                                        {item.title || 'Untitled'}
                                    </h3>
                                    {item.category && (
                                        <Badge variant="info" className="mt-1">
                                            {item.category}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 
                             hover:text-surface-600 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(item.id)}
                                        className="p-2 rounded-lg hover:bg-red-50 text-surface-400 
                             hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-surface-600 line-clamp-4">
                                {item.content}
                            </p>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editItem ? 'Edit Content' : 'Add Content'}
                size="lg"
            >
                <div className="space-y-4">
                    <Input
                        label="Title"
                        placeholder="e.g., ISO 27001 Certification"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Input
                        label="Category"
                        placeholder="e.g., Certifications, Capabilities"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                    <Textarea
                        label="Content"
                        placeholder="Enter the detailed content..."
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="min-h-[200px]"
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} isLoading={saving}>
                            {editItem ? 'Save Changes' : 'Add Content'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Content"
                description="Are you sure you want to delete this content? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                isLoading={deleting}
            />
        </DashboardLayout>
    );
}
