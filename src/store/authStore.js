// Zustand store for auth state management — holds user + profile from Supabase
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  justLoggedIn: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setJustLoggedIn: (v) => set({ justLoggedIn: v }),
  clear: () => set({ user: null, profile: null, session: null, loading: false, justLoggedIn: false }),
}));
