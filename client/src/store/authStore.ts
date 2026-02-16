import { create } from 'zustand';
import { User } from '../types';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('token', data.token);
      connectSocket(data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Login failed', isLoading: false });
    }
  },

  signup: async (email, name, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.signup({ email, name, password });
      localStorage.setItem('token', data.token);
      connectSocket(data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Signup failed', isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    disconnectSocket();
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = get().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      const { data } = await authAPI.me();
      connectSocket(token);
      set({ user: data.user, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
