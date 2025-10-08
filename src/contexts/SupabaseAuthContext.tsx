import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { createUserSession, terminateAllOtherSessions } from '@/utils/sessionManager';

export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  is_active: boolean;
}

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any; error: Error | null }>;
  signUp: (email: string, password: string, userData?: { full_name?: string; username?: string }) => Promise<{ data?: any; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data?: any; error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  getUserRole: () => Promise<'admin' | 'manager' | 'user'>;
  hasRole: (role: 'admin' | 'manager' | 'user') => Promise<boolean>;
  isAdmin: () => Promise<boolean>;
  isManager: () => Promise<boolean>;
  isAuthenticated: boolean;
  supabase: typeof supabase; // Add supabase client
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // إعداد مستمع تغيير حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info(`Auth state changed: ${event}`, { session: !!session }, 'Auth');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // جلب بيانات البروفايل وإنشاء الجلسة بشكل غير متزامن
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
            
            // إنشاء جلسة تتبع للمستخدم عند تسجيل الدخول
            if (event === 'SIGNED_IN') {
              try {
                await createUserSession(session.user.id);
              } catch (error) {
                logger.error('Failed to create session, will continue anyway', error, 'Auth');
              }
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // التحقق من الجلسة الحالية
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        logger.error('Error getting session', error, 'Auth');
      }
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
        
        // إنشاء جلسة تتبع للمستخدم إذا لم تكن موجودة
        try {
          await createUserSession(session.user.id);
        } catch (error) {
          logger.error('Failed to create session on init, will continue anyway', error, 'Auth');
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching user profile', error, 'Auth');
        // Don't throw, just continue without profile
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
        logger.info('User profile fetched successfully', { userId: data.id }, 'Auth');
      } else {
        // Create profile if it doesn't exist
        logger.warn('No profile found, creating one...', { userId }, 'Auth');
        try {
          const { data: userData } = await supabase.auth.getUser();
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              full_name: userData?.user?.user_metadata?.full_name || userData?.user?.email || 'مستخدم',
              is_active: true
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            setProfile(newProfile as UserProfile);
            logger.info('Profile created successfully', { userId }, 'Auth');
          } else {
            logger.error('Failed to create profile', insertError, 'Auth');
          }
        } catch (createError) {
          logger.error('Error creating profile', createError, 'Auth');
        }
      }
    } catch (error) {
      logger.error('Unexpected error fetching profile', error, 'Auth');
      // Don't throw or logout, just continue
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('Sign in error', error, 'Auth');
        return { error };
      }

      logger.info('User signed in successfully', { userId: data.user?.id }, 'Auth');
      return { data, error: null };
    } catch (error) {
      logger.error('Unexpected sign in error', error, 'Auth');
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: { full_name?: string; username?: string }) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        logger.error('Sign up error', error, 'Auth');
        return { error };
      }

      // إذا تم إنشاء المستخدم ولكن يحتاج تأكيد البريد الإلكتروني
      if (data.user && !data.user.email_confirmed_at) {
        logger.info('User signed up successfully, email confirmation required', { userId: data.user?.id }, 'Auth');
      } else {
        logger.info('User signed up and confirmed successfully', { userId: data.user?.id }, 'Auth');
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Unexpected sign up error', error, 'Auth');
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // إنهاء جميع جلسات المستخدم قبل تسجيل الخروج
      if (user) {
        await terminateAllOtherSessions(user.id);
        // إزالة رمز الجلسة من localStorage
        localStorage.removeItem('session_token');
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Sign out error', error, 'Auth');
        return { error };
      }

      logger.info('User signed out successfully', undefined, 'Auth');
      return { error: null };
    } catch (error) {
      logger.error('Unexpected sign out error', error, 'Auth');
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        logger.error('Error updating profile', error, 'Auth');
        return { error };
      }

      setProfile(data as UserProfile);
      logger.info('Profile updated successfully', { userId: user.id }, 'Auth');
      return { data, error: null };
    } catch (error) {
      logger.error('Unexpected error updating profile', error, 'Auth');
      return { error: error as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        logger.error('Password reset error', error, 'Auth');
        return { error };
      }

      logger.info('Password reset email sent', { email }, 'Auth');
      return { error: null };
    } catch (error) {
      logger.error('Unexpected password reset error', error, 'Auth');
      return { error: error as Error };
    }
  };

  const getUserRole = async (): Promise<'admin' | 'manager' | 'user'> => {
    if (!user) return 'user';
    
    try {
      const { data, error } = await supabase.rpc('get_user_roles', {
        _user_id: user.id
      });
      
      if (error || !data || data.length === 0) {
        return 'user';
      }
      
      // Return the highest privilege role (lowest level number)
      const highestRole = data.reduce((prev: any, current: any) => 
        (prev.level < current.level) ? prev : current
      );
      
      return highestRole.role_name as 'admin' | 'manager' | 'user';
    } catch (error) {
      logger.error('Unexpected error getting user role', error, 'Auth');
      return 'user';
    }
  };

  const hasRole = async (requiredRole: 'admin' | 'manager' | 'user'): Promise<boolean> => {
    const userRole = await getUserRole();
    const roleHierarchy = { admin: 3, manager: 2, user: 1 };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  const isAdmin = async (): Promise<boolean> => {
    const role = await getUserRole();
    return role === 'admin';
  };

  const isManager = async (): Promise<boolean> => {
    const role = await getUserRole();
    return role === 'manager' || role === 'admin';
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    getUserRole,
    hasRole,
    isAdmin,
    isManager,
    isAuthenticated: !!user,
    supabase, // Export supabase client for use in other contexts
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};