'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                router.push('/dashboard');
            } else {
                router.push('/auth/login');
            }
        });
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 
                    border-t-transparent rounded-full" />
        </div>
    );
}
