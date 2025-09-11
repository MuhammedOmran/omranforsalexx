import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth } from './SupabaseAuthContext';
import type { User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => Promise<boolean>;
  hasRole: (role: string) => Promise<boolean>;
  isAuthenticated: boolean;
  canAccess: (module: string, action: string) => Promise<boolean>;
  register?: (userData: any) => Promise<{ success: boolean; error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const supabaseAuth = useSupabaseAuth();

  // تحويل بيانات Supabase إلى تنسيق النظام المحلي
  const user: User | null = supabaseAuth.user && supabaseAuth.profile ? {
    id: supabaseAuth.user.id,
    name: supabaseAuth.profile.full_name || supabaseAuth.user.email || 'مستخدم',
    email: supabaseAuth.user.email || '',
    role: {
      id: 'user', // Default role, will be fetched dynamically
      name: 'user',
      nameAr: 'مستخدم',
      description: 'مستخدم عادي',
      level: 3,
      permissions: ['read'],
      isSystem: true
    },
    isActive: supabaseAuth.profile.is_active,
    createdAt: new Date().toISOString(),
    permissions: []
  } : null;

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await supabaseAuth.signIn(email, password);
    return !result.error;
  };

  const logout = () => {
    supabaseAuth.signOut();
  };

  const hasPermission = async (permission: string): Promise<boolean> => {
    if (!user || !user.isActive) return false;
    try {
      const { data, error } = await supabaseAuth.supabase.rpc('check_permission', {
        _user_id: supabaseAuth.user?.id,
        _permission: permission
      });
      return !error && !!data;
    } catch (error) {
      console.error('خطأ في التحقق من الصلاحية:', error);
      return false;
    }
  };

  const hasRole = async (roleName: string): Promise<boolean> => {
    if (!user || !user.isActive) return false;
    try {
      const { data, error } = await supabaseAuth.supabase
        .from('user_roles')
        .select(`
          roles!inner(name)
        `)
        .eq('user_id', supabaseAuth.user?.id)
        .eq('is_active', true)
        .eq('roles.name', roleName)
        .eq('roles.is_active', true);
      
      return !error && data && data.length > 0;
    } catch (error) {
      console.error('خطأ في التحقق من الدور:', error);
      return false;
    }
  };

  const canAccess = async (module: string, action: string): Promise<boolean> => {
    if (!user || !user.isActive) return false;
    const permission = `${module}.${action}`;
    const wildcardPermission = `${module}.*`;
    return await hasPermission(permission) || await hasPermission(wildcardPermission);
  };

  const register = async (userData: any): Promise<{ success: boolean; error?: any }> => {
    const result = await supabaseAuth.signUp(userData.email, userData.password, {
      full_name: userData.username, // استخدام username كـ full_name
      username: userData.username
    });
    
    return {
      success: !result.error,
      error: result.error
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasPermission,
        hasRole,
        canAccess,
        register,
        isAuthenticated: supabaseAuth.isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};