// Zustand store for auth state management — holds user + profile from Supabase
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  justLoggedIn: false,
  setUser: (user) => set((state) => {
    if (JSON.stringify(state.user) === JSON.stringify(user)) return state;
    return { user };
  }),
  setProfile: (profile) => set((state) => {
    if (JSON.stringify(state.profile) === JSON.stringify(profile)) return state;
    return { profile };
  }),
  setSession: (session) => set((state) => {
    // Only check the access_token for session equality to prevent constant refreshes
    if (state.session?.access_token === session?.access_token) return state;
    return { session };
  }),
  setLoading: (loading) => set({ loading }),
  setJustLoggedIn: (v) => set({ justLoggedIn: v }),
  clear: () => set({ user: null, profile: null, session: null, loading: false, justLoggedIn: false }),
}));
