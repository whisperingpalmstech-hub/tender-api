import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

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
    const { t, language } = useI18n();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isRtl = language === 'ar';

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError(null);

        if (rejectedFiles.length > 0) {
            const rejection = rejectedFiles[0];
            if (rejection.errors[0]?.code === 'file-too-large') {
                setError(`${isRtl ? 'حجم الملف كبير جداً' : 'File too large'}. ${isRtl ? 'الحد الأقصى هو' : 'Maximum size is'} ${formatFileSize(maxSize)}`);
            } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                setError(isRtl ? 'نوع الملف غير صالح. يرجى تحميل ملفات PDF أو DOCX.' : 'Invalid file type. Please upload PDF or DOCX files.');
            } else {
                setError(isRtl ? 'ملف غير صالح. يرجى المحاولة مرة أخرى.' : 'Invalid file. Please try again.');
            }
            return;
        }

        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
        }
    }, [maxSize, isRtl]);

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
            setError(err.message || (isRtl ? 'فشل التحميل. يرجى المحاولة مرة أخرى.' : 'Upload failed. Please try again.'));
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
                        disabled && 'opacity-50 cursor-not-allowed',
                        isRtl && "text-right"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="p-4 rounded-full bg-primary-100 mb-4">
                        <Upload className="w-8 h-8 text-primary-600" />
                    </div>
                    <p className="text-lg font-medium text-surface-900 mb-1">
                        {isDragActive ? t('dropFile') : t('dragDropFile')}
                    </p>
                    <p className="text-sm text-surface-500 mb-4">
                        {t('clickToBrowse')}
                    </p>
                    <p className="text-xs text-surface-400 font-mono">
                        {t('supportedFormats')} ({isRtl ? 'الحد الأقصى' : 'Max'} {formatFileSize(maxSize)})
                    </p>
                </div>
            ) : (
                <div className="card p-6">
                    <div className={cn("flex items-start gap-4", isRtl && "flex-row-reverse")}>
                        <div className="p-3 rounded-xl bg-primary-100">
                            <FileText className="w-8 h-8 text-primary-600" />
                        </div>
                        <div className={cn("flex-1 min-w-0", isRtl && "text-right")}>
                            <p className="font-bold text-surface-900 truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-sm font-medium text-surface-500 font-mono">
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>
                        <button
                            onClick={handleRemove}
                            disabled={uploading}
                            className="p-2 rounded-lg hover:bg-surface-50 text-surface-400 
                       hover:text-surface-600 transition-colors disabled:opacity-50 border border-transparent hover:border-surface-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className={cn("mt-8 flex justify-end gap-3", isRtl && "flex-row-reverse")}>
                        <Button
                            variant="secondary"
                            onClick={handleRemove}
                            disabled={uploading}
                            className="rounded-xl font-bold"
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpload}
                            isLoading={uploading}
                            leftIcon={!isRtl && <Upload className="w-4 h-4" />}
                            rightIcon={isRtl && <Upload className="w-4 h-4" />}
                            className="rounded-xl font-bold shadow-lg shadow-primary-500/20"
                        >
                            {t('uploadTitle')}
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className={cn(
                    "mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-1",
                    isRtl && "flex-row-reverse text-right"
                )}>
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
            )}
        </div>
    );
}
