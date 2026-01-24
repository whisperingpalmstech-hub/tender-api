import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/providers/auth-provider';
import './globals.css';

export const metadata: Metadata = {
    title: 'Tender Analysis System',
    description: 'Enterprise tender document analysis and response preparation system',
    keywords: ['tender', 'analysis', 'rfp', 'proposal', 'enterprise'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#1e293b',
                                color: '#f8fafc',
                                borderRadius: '0.75rem',
                                padding: '0.75rem 1rem',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#f8fafc',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#f8fafc',
                                },
                            },
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
