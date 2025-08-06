import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'staff' | 'customer';
  permissions: string[];
  companyId?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'customer'; // Default role for public registration
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // API call would go here - for now using mock data
      const response = await mockLogin(credentials);
      
      const { user, token } = response;

      // Store in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // API call would go here
      const response = await mockRegister(data);
      
      const { user, token } = response;

      // Store in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (state.user) {
      const newUser = { ...state.user, ...updatedUser };
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      setState(prev => ({ ...prev, user: newUser }));
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;
    if (state.user.role === 'admin') return true; // Admin has all permissions
    return state.user.permissions.includes(permission);
  };

  const isAdmin = (): boolean => {
    return state.user?.role === 'admin' || false;
  };

  const isManager = (): boolean => {
    return state.user?.role === 'manager' || state.user?.role === 'admin' || false;
  };

  const refreshToken = async (): Promise<void> => {
    try {
      // Implement token refresh logic here
      console.log('Token refresh not implemented yet');
    } catch (error) {
      logout(); // Force logout on refresh failure
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    hasPermission,
    isAdmin,
    isManager,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Mock functions - replace with real API calls
const mockLogin = async (credentials: LoginCredentials) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock admin account
  if (credentials.email === 'admin@xetiic.com' && credentials.password === 'admin123') {
    return {
      user: {
        id: '1',
        email: 'admin@xetiic.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin' as const,
        permissions: ['all'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: 'mock_admin_token_' + Date.now(),
    };
  }

  // Mock manager account
  if (credentials.email === 'manager@xetiic.com' && credentials.password === 'manager123') {
    return {
      user: {
        id: '2',
        email: 'manager@xetiic.com',
        firstName: 'Manager',
        lastName: 'User',
        role: 'manager' as const,
        permissions: ['stations.read', 'stations.write', 'routes.read', 'routes.write'],
        companyId: '1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: 'mock_manager_token_' + Date.now(),
    };
  }

  throw new Error('Thông tin đăng nhập không đúng');
};

const mockRegister = async (data: RegisterData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check if email already exists (mock check)
  if (data.email === 'admin@xetiic.com' || data.email === 'manager@xetiic.com') {
    throw new Error('Email đã được sử dụng');
  }

  return {
    user: {
      id: Date.now().toString(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'customer' as const,
      permissions: ['profile.read', 'profile.write'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    token: 'mock_customer_token_' + Date.now(),
  };
};
