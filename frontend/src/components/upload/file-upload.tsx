'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
    onUpload: (file: File) => Promise<void>;
    accept?: Record<string, string[]>;
    maxSize?: number;
    disabled?: boolean;
}

const DEFAULT_ACCEPT = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
};

export function FileUpload({
    onUpload,
    accept = DEFAULT_ACCEPT,
    maxSize = 50 * 1024 * 1024, // 50MB
    disabled = false,
}: FileUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError(null);

        if (rejectedFiles.length > 0) {
            const rejection = rejectedFiles[0];
            if (rejection.errors[0]?.code === 'file-too-large') {
                setError(`File too large. Maximum size is ${formatFileSize(maxSize)}`);
            } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                setError('Invalid file type. Please upload PDF or DOCX files.');
            } else {
                setError('Invalid file. Please try again.');
            }
            return;
        }

        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
        }
    }, [maxSize]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple: false,
        disabled: disabled || uploading,
    });

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);

        try {
            await onUpload(selectedFile);
            setSelectedFile(null);
        } catch (err: any) {
            setError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setSelectedFile(null);
        setError(null);
    };

    return (
        <div className="w-full">
            {!selectedFile ? (
                <div
                    {...getRootProps()}
                    className={cn(
                        'dropzone flex flex-col items-center justify-center min-h-[200px]',
                        isDragActive && 'dropzone-active',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="p-4 rounded-full bg-primary-100 mb-4">
                        <Upload className="w-8 h-8 text-primary-600" />
                    </div>
                    <p className="text-lg font-medium text-surface-900 mb-1">
                        {isDragActive ? 'Drop your file here' : 'Drag and drop your document'}
                    </p>
                    <p className="text-sm text-surface-500 mb-4">
                        or click to browse
                    </p>
                    <p className="text-xs text-surface-400">
                        Supported: PDF, DOCX (Max {formatFileSize(maxSize)})
                    </p>
                </div>
            ) : (
                <div className="card p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary-100">
                            <FileText className="w-8 h-8 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-surface-900 truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-sm text-surface-500">
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>
                        <button
                            onClick={handleRemove}
                            disabled={uploading}
                            className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 
                       hover:text-surface-600 transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={handleRemove}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpload}
                            isLoading={uploading}
                            leftIcon={<Upload className="w-4 h-4" />}
                        >
                            Upload Document
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}
        </div>
    );
}
