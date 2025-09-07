import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'manager' | 'user';

interface UserRoleData {
  role: UserRole | null;
  loading: boolean;
  hasRole: (requiredRole: UserRole) => boolean;
}

const roleHierarchy: Record<UserRole, number> = {
  user: 1,
  manager: 2,
  admin: 3,
};

export const useUserRole = (): UserRoleData => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async (session: Session | null) => {
      if (!session?.user?.id) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user role:', error);
        }

        setRole(data?.role || 'user'); // Default to 'user' if no role found
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('user'); // Default to 'user' on error
      } finally {
        setLoading(false);
      }
    };

    // Get initial session and role
    const getInitialData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchUserRole(session);
    };

    getInitialData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await fetchUserRole(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!role) return false;
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  return { role, loading, hasRole };
};