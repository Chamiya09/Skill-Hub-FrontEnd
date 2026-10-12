import { createContext, useContext } from 'react';
import {
  type UserDto,
  type RegisterCompanyPayload,
  type RegisterCandidatePayload,
} from '../services/api';

export interface SuspensionBroadcastDetail {
  id?: string;
  email?: string;
  isSuspended?: boolean;
  type?: string;
}

export function checkIsUserSuspended(u: UserDto | null | undefined): boolean {
  if (!u) return false;
  return Boolean(
    u.isSuspended === true ||
    (u.isSuspended as unknown) === 'true' ||
    ('status' in u && (u as { status?: unknown }).status === 'Suspended')
  );
}

export interface AuthContextType {
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
