import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { IS_DEMO } from '../config/appConfig';
import { demoUser } from '../services/mocks/mockData';
import { apiClient } from '../services/apiClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    console.log('AuthProvider mounted, checking authentication...');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      if (IS_DEMO) {
        apiClient.setTokens({ accessToken: 'demo_access', refreshToken: 'demo_refresh', expiresIn: 3600 });
        authService.storeUser(demoUser);
        dispatch({ type: 'AUTH_SUCCESS', payload: demoUser });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      
      // First check if we have valid tokens in localStorage
      if (!authService.isAuthenticated()) {
        console.log('No valid tokens found');
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Get stored user data and show immediately for better UX
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        console.log('Found stored user, showing immediately:', storedUser);
        dispatch({ type: 'AUTH_SUCCESS', payload: storedUser });
      }

      // Then fetch fresh user data from the server to validate and update
      try {
        console.log('Fetching fresh user data from server...');
        const freshUser = await authService.getCurrentUser();
        authService.storeUser(freshUser);
        dispatch({ type: 'AUTH_SUCCESS', payload: freshUser });
        console.log('User data refreshed from server:', freshUser);
      } catch (error) {
        console.warn('Failed to fetch fresh user data:', error);
        // If server request fails but we have stored user, keep them logged in
        if (!storedUser) {
          authService.clearStoredUser();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear any invalid stored data
      authService.clearStoredUser();
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const { user } = await authService.login({ email, password });
      authService.storeUser(user);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const { user } = await authService.register(userData);
      authService.storeUser(user);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearStoredUser();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    
    // Update stored user data
    const updatedUser = state.user ? { ...state.user, ...userData } : null;
    if (updatedUser) {
      authService.storeUser(updatedUser);
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
