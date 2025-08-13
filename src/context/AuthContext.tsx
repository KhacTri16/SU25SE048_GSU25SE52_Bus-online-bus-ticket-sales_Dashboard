
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, SystemUserLoginResponse, ROLE_PERMISSIONS } from '../services/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  companyId?: string | number;
  avatar?: string;
  isActive: boolean;
  isDeleted?: boolean;
  roleId: number;
  permissions?: string[];
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
  isStaff: () => boolean;
  refreshToken: () => Promise<void>;
  // Add new helper methods for company-based access control
  getUserCompanyId: () => number | null;
  canAccessCompany: (companyId: number | string) => boolean;
  isCompanyRestricted: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

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
        console.log('AuthContext: Initializing auth state...');
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        
        console.log('AuthContext: Token exists:', !!token);
        console.log('AuthContext: User exists:', !!userStr);
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            console.log('AuthContext: Parsed user:', user);
            
            // Validate user has required fields
            if (user && user.id && user.email && typeof user.roleId === 'number') {
              setState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
              });
              console.log('AuthContext: User authenticated successfully');
            } else {
              console.log('AuthContext: Invalid user data, clearing...');
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              setState({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } catch (parseError) {
            console.error('AuthContext: Error parsing user from localStorage:', parseError);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          console.log('AuthContext: No token or user found, setting unauthenticated state');
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      // Use the new loginSystemUser method
      const response: SystemUserLoginResponse = await authService.loginSystemUser(credentials);
      const { token, systemUser } = response;
      
      // Get permissions for the user's role
      const userPermissions = ROLE_PERMISSIONS[systemUser.roleId] || [];
      
      // Map systemUser to User type for context
      const user: User = {
        id: systemUser.id.toString(),
        email: systemUser.email,
        fullName: systemUser.fullName,
        phone: systemUser.phone,
        address: systemUser.address,
        companyId: systemUser.companyId,
        avatar: systemUser.avartar,
        isActive: systemUser.isActive,
        isDeleted: systemUser.isDeleted,
        roleId: systemUser.roleId,
        permissions: userPermissions, // Add permissions
      };
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error(error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
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
    
    // Admin (roleId: 1) has all permissions
    if (state.user.roleId === 1) return true;
    
    // Check if user has the specific permission
    return state.user.permissions?.includes(permission) || false;
  };

  const isAdmin = (): boolean => {
    return state.user?.roleId === 1;
  };

  const isManager = (): boolean => {
    return state.user?.roleId === 2;
  };

  const isStaff = (): boolean => {
    return state.user?.roleId === 3;
  };

  const isDriver = (): boolean => {
    return state.user?.roleId === 4;
  };

  const isSeller = (): boolean => {
    return state.user?.roleId === 5;
  };

  // Add new helper methods for company-based access control
  const getUserCompanyId = (): number | null => {
    if (!state.user?.companyId) return null;
    return typeof state.user.companyId === 'string' 
      ? parseInt(state.user.companyId) 
      : state.user.companyId;
  };

  const canAccessCompany = (companyId: number | string): boolean => {
    // Admin can access all companies
    if (isAdmin()) return true;
    
    // Manager, Staff, Driver, Seller can only access their own company
    const userCompanyId = getUserCompanyId();
    if (!userCompanyId) return false;
    
    const targetCompanyId = typeof companyId === 'string' 
      ? parseInt(companyId) 
      : companyId;
    
    return userCompanyId === targetCompanyId;
  };

  const isCompanyRestricted = (): boolean => {
    // Manager, Staff, Driver, Seller are company-restricted
    return isManager() || isStaff() || isDriver() || isSeller();
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
    isStaff,
  // isDriver,
  // isSeller,
    refreshToken,
    getUserCompanyId,
    canAccessCompany,
    isCompanyRestricted,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Mock functions - replace with real API calls
// Removed mockLogin function as it is not used

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
      fullName: data.firstName + ' ' + data.lastName,
      phone: '',
      address: '',
      companyId: '',
      avatar: '',
      isActive: true,
      isDeleted: false,
      roleId: 3, // 3 = customer (example)
    },
    token: 'mock_customer_token_' + Date.now(),
  };
};
