import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authStorage,
  authApi,
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

  // Listen to global auth, profile updates, and broadcast suspension events for immediate multi-tab synchronization
  useEffect(() => {
    const handleAuthChange = () => {
      const u = authStorage.getUser();
      const t = authStorage.getToken();
      setCurrentUser((prev) => (JSON.stringify(prev) === JSON.stringify(u) ? prev : u));
      setToken((prev) => (prev === t ? prev : t));
    };

    const handleSuspensionBroadcast = (e: any) => {
      const detail = e.detail || (e.data?.type === 'ACCOUNT_SUSPENDED_TOGGLE' ? e.data : null);
      if (!detail) return;
      const cached = authStorage.getUser();
      if (!cached) return;
      const matchesId = cached.id === detail.id || (cached as any).companyId === detail.id;
      const matchesEmail = detail.email && (
        (cached.email && cached.email.toLowerCase() === detail.email.toLowerCase()) ||
        (cached.contactEmail && cached.contactEmail.toLowerCase() === detail.email.toLowerCase())
      );
      if (matchesId || matchesEmail) {
        const isSuspended = Boolean(detail.isSuspended);
        const updated: UserDto = { ...cached, isSuspended };
        authStorage.setUser(updated);
        setCurrentUser((prev) => (prev ? { ...prev, isSuspended } : updated));
      }
    };

    window.addEventListener('skillhub_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('skillhub_account_suspended_change', handleSuspensionBroadcast);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('skillhub_account_channel');
        bc.onmessage = (msg) => {
          if (msg.data && msg.data.type === 'ACCOUNT_SUSPENDED_TOGGLE') {
            handleSuspensionBroadcast({ detail: msg.data });
          }
        };
      } catch {
        // ignore
      }
    }

    return () => {
      window.removeEventListener('skillhub_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('skillhub_account_suspended_change', handleSuspensionBroadcast);
      if (bc) bc.close();
    };
  }, []);

  /**
   * State Verification: Re-fetches the current user profile from /api/auth/me
   * to immediately verify if the account has been suspended or modified.
   */
  const refreshProfile = useCallback(async (): Promise<UserDto | null> => {
    const currentToken = authStorage.getToken();
    const cachedUser = authStorage.getUser();

    if (!currentToken || !cachedUser) {
      setCurrentUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    // Restore cached credentials
    setCurrentUser((prev) => (JSON.stringify(prev) === JSON.stringify(cachedUser) ? prev : cachedUser));
    setToken(currentToken);

    // ADMIN PERSISTENCE:
    // Admin sessions are managed through their dedicated admin storage keys
    const userRole = (cachedUser.role || '').toLowerCase();
    if (userRole === 'admin' || userRole === 'super_admin') {
      setIsLoading(false);
      return cachedUser;
    }

    try {
      // Re-fetch via universal /api/auth/me or role-specific me endpoints
      let userProfile: UserDto | null = null;
      try {
        userProfile = await authApi.getMe();
      } catch {
        const isCandidate = cachedUser.role?.toUpperCase() === 'CANDIDATE';
        userProfile = isCandidate
          ? await candidateAuthApi.getMe()
          : await companyAuthApi.getMe();
      }

      if (userProfile) {
        const isSuspended = Boolean(
          userProfile.isSuspended === true ||
          (userProfile.isSuspended as unknown) === 'true' ||
          (userProfile as any)?.status === 'Suspended'
        );

        const merged: UserDto = {
          ...cachedUser,
          ...userProfile,
          isSuspended,
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
    } catch (error: any) {
      console.warn('Could not refresh profile from server:', error);
      // If server responds with 403 or suspended message, set isSuspended = true rather than clearing auth
      if (error?.message?.toLowerCase().includes('suspend') || error?.status === 403) {
        const updated = { ...cachedUser, isSuspended: true };
        authStorage.setUser(updated);
        setCurrentUser(updated);
        return updated;
      }

      // If token verification completely fails (e.g. invalid or expired), clear auth state
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

  // Real-time Heartbeat & Tab Focus listeners to immediately detect Admin suspension actions
  useEffect(() => {
    if (!token || !currentUser) return;
    const role = (currentUser.role || '').toLowerCase();
    if (role === 'admin' || role === 'super_admin') return;

    let isMounted = true;

    const checkSuspensionStatus = async () => {
      const current = authStorage.getUser();
      if (!current || !isMounted) return;

      try {
        let profile: UserDto | null = null;
        try {
          profile = await authApi.getMe();
        } catch {
          const isCandidate = current.role?.toUpperCase() === 'CANDIDATE';
          profile = isCandidate
            ? await candidateAuthApi.getMe()
            : await companyAuthApi.getMe();
        }

        if (profile && isMounted) {
          const serverSuspended = Boolean(
            profile.isSuspended === true ||
            (profile.isSuspended as unknown) === 'true' ||
            (profile as any)?.status === 'Suspended'
          );

          if (serverSuspended !== Boolean(current.isSuspended)) {
            const updated: UserDto = { ...current, isSuspended: serverSuspended };
            authStorage.setUser(updated);
            setCurrentUser((prev) => (prev ? { ...prev, isSuspended: serverSuspended } : updated));
          }
        }
      } catch (err: any) {
        if ((err?.message?.toLowerCase().includes('suspend') || err?.status === 403) && isMounted) {
          const updated: UserDto = { ...current, isSuspended: true };
          authStorage.setUser(updated);
          setCurrentUser((prev) => (prev ? { ...prev, isSuspended: true } : updated));
        }
      }
    };

    // Heartbeat every 3.5 seconds
    const intervalId = setInterval(checkSuspensionStatus, 3500);

    const onFocus = () => {
      checkSuspensionStatus();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSuspensionStatus();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [token, currentUser?.id, currentUser?.isSuspended]);

  /**
   * 3. Login Response Handling:
   * Explicitly extracts isSuspended from the .NET backend response and updates state.
   */
  const login = async (email: string, password: string): Promise<UserDto> => {
    setIsLoading(true);
    try {
      const response = await companyAuthApi.login({ email, password });
      const isSuspended = Boolean(
        response.user?.isSuspended === true ||
        (response.user?.isSuspended as unknown) === 'true' ||
        (response.user as any)?.status === 'Suspended'
      );
      const userWithSuspension: UserDto = {
        ...response.user,
        isSuspended,
      };

      authStorage.setAuth({ ...response, user: userWithSuspension });
      setCurrentUser(userWithSuspension);
      setToken(response.token);
      return userWithSuspension;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterCompanyPayload): Promise<UserDto> => {
    setIsLoading(true);
    try {
      const response = await companyAuthApi.register(payload);
      const isSuspended = Boolean(
        response.user?.isSuspended === true ||
        (response.user?.isSuspended as unknown) === 'true' ||
        (response.user as any)?.status === 'Suspended'
      );
      const userWithSuspension: UserDto = {
        ...response.user,
        isSuspended,
      };

      authStorage.setAuth({ ...response, user: userWithSuspension });
      setCurrentUser(userWithSuspension);
      setToken(response.token);
      return userWithSuspension;
    } finally {
      setIsLoading(false);
    }
  };

  const candidateLogin = async (email: string, password: string): Promise<UserDto> => {
    setIsLoading(true);
    try {
      const response = await candidateAuthApi.login({ email, password });
      const isSuspended = Boolean(
        response.user?.isSuspended === true ||
        (response.user?.isSuspended as unknown) === 'true' ||
        (response.user as any)?.status === 'Suspended'
      );
      const userWithSuspension: UserDto = {
        ...response.user,
        isSuspended,
      };

      authStorage.setAuth({ ...response, user: userWithSuspension });
      setCurrentUser(userWithSuspension);
      setToken(response.token);
      return userWithSuspension;
    } finally {
      setIsLoading(false);
    }
  };

  const candidateRegister = async (payload: RegisterCandidatePayload): Promise<UserDto> => {
    setIsLoading(true);
    try {
      const response = await candidateAuthApi.register(payload);
      const isSuspended = Boolean(
        response.user?.isSuspended === true ||
        (response.user?.isSuspended as unknown) === 'true' ||
        (response.user as any)?.status === 'Suspended'
      );
      const userWithSuspension: UserDto = {
        ...response.user,
        isSuspended,
      };

      authStorage.setAuth({ ...response, user: userWithSuspension });
      setCurrentUser(userWithSuspension);
      setToken(response.token);
      return userWithSuspension;
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthData = (user: UserDto, jwtToken: string) => {
    const isSuspended = Boolean(
      user?.isSuspended === true ||
      (user?.isSuspended as unknown) === 'true' ||
      (user as any)?.status === 'Suspended'
    );
    const userWithSuspension: UserDto = {
      ...user,
      isSuspended,
    };

    authStorage.setUser(userWithSuspension);
    if (jwtToken) {
      localStorage.setItem('skillhub_jwt_token', jwtToken);
    }
    if (user?.role?.toLowerCase() === 'admin') {
      localStorage.setItem('skillhub_admin_token', jwtToken);
      localStorage.setItem('skillhub_admin_user', JSON.stringify(userWithSuspension));
    }
    setCurrentUser(userWithSuspension);
    setToken(jwtToken);
    setIsLoading(false);
  };

  const setUser = useCallback((user: UserDto) => {
    const isSuspended = Boolean(
      user?.isSuspended === true ||
      (user?.isSuspended as unknown) === 'true' ||
      (user as any)?.status === 'Suspended'
    );
    const userWithSuspension: UserDto = {
      ...user,
      isSuspended,
    };
    authStorage.setUser(userWithSuspension);
    setCurrentUser(userWithSuspension);
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
    localStorage.removeItem('skillhub_admin_token');
    localStorage.removeItem('skillhub_admin_user');
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
