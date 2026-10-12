import React, { useState, useEffect, useCallback } from 'react';
import {
  authStorage,
  authApi,
  companyAuthApi,
  candidateAuthApi,
  type UserDto,
  type RegisterCompanyPayload,
  type RegisterCandidatePayload,
} from '../services/api';
import { AuthContext, type SuspensionBroadcastDetail, checkIsUserSuspended } from './AuthContext';

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

    const handleSuspensionBroadcast = (e: Event) => {
      const customEvent = e as CustomEvent<SuspensionBroadcastDetail>;
      const messageEvent = e as MessageEvent<SuspensionBroadcastDetail>;
      const detail: SuspensionBroadcastDetail | null =
        customEvent.detail || (messageEvent.data?.type === 'ACCOUNT_SUSPENDED_TOGGLE' ? messageEvent.data : null);
      if (!detail) return;
      const cached = authStorage.getUser();
      if (!cached) return;
      const matchesId = cached.id === detail.id || (cached as { companyId?: string }).companyId === detail.id;
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
    window.addEventListener('skillhub_account_suspended', handleSuspensionBroadcast);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('skillhub_admin_sync');
        bc.onmessage = handleSuspensionBroadcast;
      } catch {
        // BroadcastChannel unavailable
      }
    }

    return () => {
      window.removeEventListener('skillhub_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('skillhub_account_suspended', handleSuspensionBroadcast);
      if (bc) {
        bc.close();
      }
    };
  }, []);

  /**
   * Universal Profile Refresh:
   * Refreshes user profile on page reloads and tab focus.
   */
  const refreshProfile = useCallback(async (): Promise<UserDto | null> => {
    const currentToken = authStorage.getToken();
    const cachedUser = authStorage.getUser();

    if (!currentToken || !cachedUser) {
      authStorage.clearAuth();
      await Promise.resolve();
      setCurrentUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    const userRole = (cachedUser.role || '').toLowerCase();
    if (userRole === 'admin' || userRole === 'super_admin') {
      await Promise.resolve();
      setIsLoading(false);
      return cachedUser;
    }

    try {
      await Promise.resolve();
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
        const isSuspended = checkIsUserSuspended(userProfile);

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
    } catch (error: unknown) {
      console.warn('Could not refresh profile from server:', error);
      const errObj = error as { message?: string; status?: number } | undefined;
      const errMsg = error instanceof Error ? error.message : errObj?.message;
      if (errMsg?.toLowerCase().includes('suspend') || errObj?.status === 403) {
        const updated = { ...cachedUser, isSuspended: true };
        authStorage.setUser(updated);
        setCurrentUser(updated);
        return updated;
      }

      authStorage.clearAuth();
      setCurrentUser(null);
      setToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        refreshProfile();
      }
    });
    return () => {
      ignore = true;
    };
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
          const serverSuspended = checkIsUserSuspended(profile);

          if (serverSuspended !== Boolean(current.isSuspended)) {
            const updated: UserDto = { ...current, isSuspended: serverSuspended };
            authStorage.setUser(updated);
            setCurrentUser((prev) => (prev ? { ...prev, isSuspended: serverSuspended } : updated));
          }
        }
      } catch (err: unknown) {
        const errObj = err as { message?: string; status?: number } | undefined;
        const errMsg = err instanceof Error ? err.message : errObj?.message;
        if ((errMsg?.toLowerCase().includes('suspend') || errObj?.status === 403) && isMounted) {
          const updated: UserDto = { ...current, isSuspended: true };
          authStorage.setUser(updated);
          setCurrentUser((prev) => (prev ? { ...prev, isSuspended: true } : updated));
        }
      }
    };

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
  }, [token, currentUser]);

  const login = async (email: string, password: string): Promise<UserDto> => {
    setIsLoading(true);
    try {
      const response = await companyAuthApi.login({ email, password });
      const isSuspended = checkIsUserSuspended(response.user);
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
      const isSuspended = checkIsUserSuspended(response.user);
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
      const isSuspended = checkIsUserSuspended(response.user);
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
      const isSuspended = checkIsUserSuspended(response.user);
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
    const isSuspended = checkIsUserSuspended(user);
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
    const isSuspended = checkIsUserSuspended(user);
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
