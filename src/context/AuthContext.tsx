import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client.ts';
import { UserProfile, UserRole } from '../types/index.ts';

export const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@libasedastaan.com',
    password: 'AdminPassword123!',
    role: 'admin' as UserRole,
    title: 'Administrator (Full Access)',
    permissions: 'Add, Update, and Delete products, Manage Orders & Settings',
  },
  manager: {
    email: 'manager@libasedastaan.com',
    password: 'ManagerPassword123!',
    role: 'manager' as UserRole,
    title: 'Manager (Restricted)',
    permissions: 'Add and Update products, Manage Orders. CANNOT Delete products',
  },
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  canAccessAdmin: boolean;
  canDeleteProducts: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch profile row from public.profiles
  const fetchUserProfile = async (userId: string, email?: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[Auth] Error fetching profile from Supabase:', error.message);
      }

      const userEmail = (data?.email || email || '').toLowerCase();

      // Check predefined role assignments
      let assignedRole: UserRole = 'customer';
      if (
        userEmail === TEST_ACCOUNTS.admin.email ||
        userEmail === 'libasedastaan@gmail.com' ||
        data?.role === 'admin'
      ) {
        assignedRole = 'admin';
      } else if (
        userEmail === TEST_ACCOUNTS.manager.email ||
        data?.role === 'manager'
      ) {
        assignedRole = 'manager';
      }

      if (data) {
        const loadedProfile: UserProfile = {
          id: data.id,
          email: userEmail,
          full_name: data.full_name || (assignedRole === 'admin' ? 'Administrator' : 'Manager'),
          role: assignedRole,
          phone: data.phone,
          address: data.address,
          created_at: data.created_at,
        };
        setProfile(loadedProfile);
        return loadedProfile;
      }

      // Provision profile if missing
      const newProfile: UserProfile = {
        id: userId,
        email: userEmail,
        full_name: assignedRole === 'admin' ? 'Administrator' : assignedRole === 'manager' ? 'Catalog Manager' : 'Valued Client',
        role: assignedRole,
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from('profiles').upsert({
          id: userId,
          email: userEmail,
          full_name: newProfile.full_name,
          role: newProfile.role,
        });
      } catch (insertErr) {
        console.warn('[Auth] Could not auto-upsert profile row:', insertErr);
      }

      setProfile(newProfile);
      return newProfile;
    } catch (err) {
      console.error('[Auth] Profile resolution error:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          if (data.session?.user) {
            await fetchUserProfile(data.session.user.id, data.session.user.email);
          } else {
            // Check for persistent local test session
            const stored = localStorage.getItem('libasedastaan_auth_user');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                setProfile(parsed);
              } catch (e) {
                // Ignore
              }
            }
          }
        }
      } catch (err) {
        console.error('[Auth] Session initialization error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchUserProfile(newSession.user.id, newSession.user.email);
      } else {
        const stored = localStorage.getItem('libasedastaan_auth_user');
        if (!stored) {
          setProfile(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (user) {
      return await fetchUserProfile(user.id, user.email);
    }
    return profile;
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if matching our designated test credentials
    const isTestAdmin =
      (cleanEmail === TEST_ACCOUNTS.admin.email || cleanEmail === 'libasedastaan@gmail.com') &&
      password === TEST_ACCOUNTS.admin.password;

    const isTestManager =
      cleanEmail === TEST_ACCOUNTS.manager.email &&
      password === TEST_ACCOUNTS.manager.password;

    try {
      // Attempt standard Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.user) {
        setUser(data.user);
        setSession(data.session);
        const resolvedProfile = await fetchUserProfile(data.user.id, data.user.email);
        localStorage.setItem('libasedastaan_auth_user', JSON.stringify(resolvedProfile));
        setIsLoading(false);
        return {
          success: true,
          role: resolvedProfile?.role,
        };
      }

      // If Supabase rejected because user doesn't exist yet, but matches test credentials:
      if (isTestAdmin || isTestManager) {
        // Automatically attempt to sign up the test user in Supabase
        const targetRole: UserRole = isTestAdmin ? 'admin' : 'manager';
        const targetName = isTestAdmin ? 'Store Administrator' : 'Catalog Manager';

        const signUpRes = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: targetName, role: targetRole },
          },
        });

        const activeUserId = signUpRes.data?.user?.id || `user-${Date.now()}`;
        const testProfile: UserProfile = {
          id: activeUserId,
          email: cleanEmail,
          full_name: targetName,
          role: targetRole,
          created_at: new Date().toISOString(),
        };

        try {
          await supabase.from('profiles').upsert({
            id: activeUserId,
            email: cleanEmail,
            full_name: targetName,
            role: targetRole,
          });
        } catch (e) {
          // Ignore
        }

        setProfile(testProfile);
        localStorage.setItem('libasedastaan_auth_user', JSON.stringify(testProfile));
        setIsLoading(false);
        return {
          success: true,
          role: targetRole,
        };
      }

      setIsLoading(false);
      return {
        success: false,
        error: error?.message || 'Invalid email or password. Please verify test credentials.',
      };
    } catch (err: any) {
      // Fallback for test credentials if network error
      if (isTestAdmin || isTestManager) {
        const targetRole: UserRole = isTestAdmin ? 'admin' : 'manager';
        const testProfile: UserProfile = {
          id: `usr-${Date.now()}`,
          email: cleanEmail,
          full_name: isTestAdmin ? 'Store Administrator' : 'Catalog Manager',
          role: targetRole,
          created_at: new Date().toISOString(),
        };
        setProfile(testProfile);
        localStorage.setItem('libasedastaan_auth_user', JSON.stringify(testProfile));
        setIsLoading(false);
        return { success: true, role: targetRole };
      }

      setIsLoading(false);
      return { success: false, error: err.message || 'Authentication error' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'customer') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchUserProfile(data.user.id, data.user.email);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Sign up error' };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    localStorage.removeItem('libasedastaan_auth_user');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsLoading(false);
    }
  };

  const isAdmin = useMemo(() => profile?.role === 'admin', [profile]);
  const isManager = useMemo(() => profile?.role === 'manager', [profile]);
  const canAccessAdmin = useMemo(() => isAdmin || isManager, [isAdmin, isManager]);
  const canDeleteProducts = useMemo(() => isAdmin, [isAdmin]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAdmin,
        isManager,
        canAccessAdmin,
        canDeleteProducts,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
