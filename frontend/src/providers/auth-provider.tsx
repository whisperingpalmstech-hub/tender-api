'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const supabase = createClient();

        // Initial session check
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                apiClient.setAuthToken(session.access_token);
                console.log('✅ Auth token set for API calls');
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event: string, session: { access_token: string } | null) => {
                if (session?.access_token) {
                    apiClient.setAuthToken(session.access_token);
                    console.log('🔄 Auth token refreshed');
                } else if (event === 'SIGNED_OUT') {
                    apiClient.setAuthToken(null);
                    console.log('🚫 Auth token cleared');
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return <>{children}</>;
}
