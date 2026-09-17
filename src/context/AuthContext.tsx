import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authStorage,
  companyAuthApi,
  candidateAuthApi,
  type UserDto,
  type RegisterCompanyPayload,
  type RegisterCandidatePayload,
} from '../services/api';

interface AuthContextType {
  currentUser: UserDto | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<UserDto>;
  register: (payload: RegisterCompanyPayload) => Promise<UserDto>;
  candidateLogin: (email: string, password: string) => Promise<UserDto>;
  candidateRegister: (payload: RegisterCandidatePayload) => Promise<UserDto>;
  setAuthData: (user: UserDto, token: string) => void;
  setUser: (user: UserDto) => void;
  updateUser: (updatedData: Partial<UserDto>) => void;
  logout: () => void;
  refreshProfile: () => Promise<UserDto | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserDto | null>(() => authStorage.getUser());
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(() => !!authStorage.getToken());

  // Listen to global auth & profile update events for immediate multi-component synchronization
  useEffect(() => {
    const handleAuthChange = () => {
      const u = authStorage.getUser();
      const t = authStorage.getToken();
      setCurrentUser((prev) => (JSON.stringify(prev) === JSON.stringify(u) ? prev : u));
      setToken((prev) => (prev === t ? prev : t));
    };

    window.addEventListener('skillhub_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('skillhub_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

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
      setCurrentUser((prev) => (JSON.stringify(prev) === JSON.stringify(cachedUser) ? prev : cachedUser));
      setToken(currentToken);
    }

    try {
      const isCandidate = cachedUser?.role?.toUpperCase() === 'CANDIDATE';
      const userProfile = isCandidate
        ? await candidateAuthApi.getMe()
        : await companyAuthApi.getMe();

      if (userProfile) {
        const merged: UserDto = {
          ...cachedUser,
          ...userProfile,
          logoUrl: cachedUser?.logoUrl || userProfile.logoUrl,
          website: userProfile.website || cachedUser?.website,
          location: cachedUser?.location || userProfile.location,
          industry: userProfile.industry || cachedUser?.industry,
          about: cachedUser?.about || userProfile.about,
          headline: userProfile.headline || cachedUser?.headline,
          avatarUrl: userProfile.avatarUrl || cachedUser?.avatarUrl,
        };
        authStorage.setUser(merged);
        setCurrentUser((prev) => (JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged));
        setToken(currentToken);
        return merged;
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

  const candidateLogin = async (email: string, password: string): Promise<UserDto> => {
    setIsLoading(true);
    try {
      const response = await candidateAuthApi.login({ email, password });
      authStorage.setAuth(response);
      setCurrentUser(response.user);
      setToken(response.token);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const candidateRegister = async (payload: RegisterCandidatePayload): Promise<UserDto> => {
    setIsLoading(true);
    try {
      const response = await candidateAuthApi.register(payload);
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

  const setUser = useCallback((user: UserDto) => {
    authStorage.setUser(user);
    setCurrentUser(user);
  }, []);

  const updateUser = useCallback((updatedData: Partial<UserDto>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      authStorage.setUser(updated);
      return updated;
    });
  }, []);

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
        candidateLogin,
        candidateRegister,
        setAuthData,
        setUser,
        updateUser,
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

