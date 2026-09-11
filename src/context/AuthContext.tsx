import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authStorage, companyAuthApi, type UserDto } from '../services/api';

interface AuthContextType {
  currentUser: UserDto | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<UserDto>;
  logout: () => void;
  refreshProfile: () => Promise<UserDto | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserDto | null>(() => authStorage.getUser());
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async (): Promise<UserDto | null> => {
    const currentToken = authStorage.getToken();
    if (!currentToken) {
      setCurrentUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    try {
      const userProfile = await companyAuthApi.getMe();
      setCurrentUser(userProfile);
      setToken(currentToken);
      return userProfile;
    } catch (error) {
      console.warn('Could not refresh company profile from API:', error);
      // If cached user exists, keep it
      const cached = authStorage.getUser();
      if (cached) {
        setCurrentUser(cached);
      } else {
        authStorage.clearAuth();
        setCurrentUser(null);
        setToken(null);
      }
      return cached;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string): Promise<UserDto> => {
    setIsLoading(true);
    try {
      const response = await companyAuthApi.login({ email, password });
      setCurrentUser(response.user);
      setToken(response.token);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authStorage.clearAuth();
    setCurrentUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        isAuthenticated: !!token && !!currentUser,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
