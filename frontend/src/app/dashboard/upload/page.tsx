'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FileUpload } from '@/components/upload/file-upload';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import type { Document, DocumentInsert } from '@/types';

export default function UploadPage() {
    const router = useRouter();
    const [tenderName, setTenderName] = useState('');
    const [userRole, setUserRole] = useState<string>('BID_WRITER');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    React.useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const role = (profile as any)?.role || 'BID_WRITER';
                setUserRole(role);

                if (role === 'AUDITOR') {
                    toast.error('Compliance Access: Auditors cannot upload documents.');
                    router.push('/dashboard');
                }
            }
            setLoading(false);
        };
        checkRole();
    }, [router, supabase]);

    if (loading) return null;

    const handleUpload = async (file: File) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error('Please sign in to upload documents');
            return;
        }

        // Generate unique file path
        const timestamp = Date.now();
        const filePath = `${user.id}/${timestamp}-${file.name}`;

        // 1. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('tender-documents')
            .upload(filePath, file);

        if (uploadError) {
            throw new Error('Failed to upload file');
        }

        // 2. Create document record
        const insertData: DocumentInsert = {
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.name.split('.').pop()?.toUpperCase() || 'PDF',
            file_size_bytes: file.size,
            tender_name: tenderName || file.name.replace(/\.[^/.]+$/, ''),
            status: 'UPLOADED',
            processing_progress: 0,
        };

        const { data: doc, error: dbError } = await supabase
            .from('documents')
            .insert(insertData as any)
            .select()
            .single();

        if (dbError || !doc) {
            throw new Error('Failed to create document record');
        }

        const typedDoc = doc as Document;

        // 3. Trigger backend processing
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await fetch(`/api/backend/api/documents/${typedDoc.id}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                    'bypass-tunnel-reminder': 'true',
                },
            });
            // Don't wait for response, it runs in background
        } catch (error) {
            console.error('Failed to trigger processing:', error);
            // Don't fail the upload if trigger fails, the user can retry processing later
        }

        toast.success('Document uploaded successfully!');
        router.push(`/dashboard/documents/${typedDoc.id}`);
    };

    return (
        <DashboardLayout
            title="Upload Document"
            subtitle="Upload a tender document for analysis"
        >
            <div className="max-w-2xl mx-auto">
                <Card className="p-6">
                    <div className="mb-6">
                        <Input
                            label="Tender Name (Optional)"
                            placeholder="e.g., IT Services RFP 2026"
                            value={tenderName}
                            onChange={(e) => setTenderName(e.target.value)}
                            helperText="Give your tender a recognizable name"
                        />
                    </div>

                    <FileUpload onUpload={handleUpload} />

                    <div className="mt-6 p-4 bg-surface-50 rounded-lg">
                        <h4 className="font-medium text-surface-900 mb-2">What happens next?</h4>
                        <ol className="text-sm text-surface-600 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 
                              flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                                <span>Document is processed and text is extracted</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 
                              flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                                <span>Requirements are identified and categorized</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 
                              flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                                <span>Match percentages are calculated against company data</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 
                              flex items-center justify-center text-xs font-medium flex-shrink-0">4</span>
                                <span>Draft responses are prepared for your review</span>
                            </li>
                        </ol>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
