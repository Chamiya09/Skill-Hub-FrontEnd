import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authStorage, companyAuthApi, type UserDto, type RegisterCompanyPayload } from '../services/api';

interface AuthContextType {
  currentUser: UserDto | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<UserDto>;
  register: (payload: RegisterCompanyPayload) => Promise<UserDto>;
  setAuthData: (user: UserDto, token: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<UserDto | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserDto | null>(() => authStorage.getUser());
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(() => !!authStorage.getToken());

  const refreshProfile = useCallback(async (): Promise<UserDto | null> => {
    const currentToken = authStorage.getToken();
    const cachedUser = authStorage.getUser();

    if (!currentToken) {
      setCurrentUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    // Immediately preserve cached credentials so routes are immediately authenticated
    if (cachedUser) {
      setCurrentUser(cachedUser);
      setToken(currentToken);
    }

    setIsLoading(true);
    try {
      const userProfile = await companyAuthApi.getMe();
      if (userProfile) {
        setCurrentUser(userProfile);
        setToken(currentToken);
        authStorage.setUser(userProfile);
        return userProfile;
      }
      return cachedUser;
    } catch (error) {
      console.warn('Could not refresh profile from server:', error);
      // If token verification fails (e.g. invalid or expired), clear auth state completely
      authStorage.clearAuth();
      setCurrentUser(null);
      setToken(null);
      return null;
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
      authStorage.setAuth(response);
      setCurrentUser(response.user);
      setToken(response.token);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterCompanyPayload): Promise<UserDto> => {
    setIsLoading(true);
    try {
      const response = await companyAuthApi.register(payload);
      authStorage.setAuth(response);
      setCurrentUser(response.user);
      setToken(response.token);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthData = (user: UserDto, jwtToken: string) => {
    authStorage.setUser(user);
    if (jwtToken) {
      localStorage.setItem('skillhub_jwt_token', jwtToken);
    }
    setCurrentUser(user);
    setToken(jwtToken);
    setIsLoading(false);
  };

  const logout = useCallback(() => {
    authStorage.clearAuth();
    setCurrentUser(null);
    setToken(null);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        isAuthenticated: !!token && !!currentUser,
        login,
        register,
        setAuthData,
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
