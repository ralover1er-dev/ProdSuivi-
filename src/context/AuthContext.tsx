import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Profile, AuthContextType } from '../types';
import * as authService from '../services/auth';

type AuthState = {
  isLoading: boolean;
  isSignout: boolean;
  user: Profile | null;
};

type AuthAction =
  | { type: 'RESTORE_TOKEN'; payload: Profile | null }
  | { type: 'SIGN_IN'; payload: Profile }
  | { type: 'SIGN_UP'; payload: Profile }
  | { type: 'SIGN_OUT' };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    (state: AuthState, action: AuthAction): AuthState => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            isLoading: false,
            isSignout: false,
            user: action.payload,
          };
        case 'SIGN_IN':
        case 'SIGN_UP':
          return {
            isLoading: false,
            isSignout: false,
            user: action.payload,
          };
        case 'SIGN_OUT':
          return {
            isLoading: false,
            isSignout: true,
            user: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      user: null,
    }
  );

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const user = await authService.getCurrentUser();
        dispatch({ type: 'RESTORE_TOKEN', payload: user });
      } catch (error) {
        console.error('Error restoring token:', error);
        dispatch({ type: 'RESTORE_TOKEN', payload: null });
      }
    };

    bootstrapAsync();
  }, []);

  const authContext: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
    isSignout: state.isSignout,
    signUp: async (nom: string, telephone: string, email: string, password: string) => {
      try {
        const user = await authService.signUp(nom, telephone, email, password);
        dispatch({ type: 'SIGN_UP', payload: user });
      } catch (error) {
        throw error;
      }
    },
    signIn: async (email: string, password: string) => {
      try {
        const user = await authService.signIn(email, password);
        dispatch({ type: 'SIGN_IN', payload: user });
      } catch (error) {
        throw error;
      }
    },
    signOut: async () => {
      try {
        await authService.signOut();
        dispatch({ type: 'SIGN_OUT' });
      } catch (error) {
        console.error('Error signing out:', error);
      }
    },
  };

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
