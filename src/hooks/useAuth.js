// useAuth — subscribes to Supabase auth changes, fetches profile, exposes signOut
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setSession, setLoading, clear } =
    useAuthStore();

  useEffect(() => {
    let mounted = true;

    // Fetch the profile row for a given user id
    async function fetchProfile(userId) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Failed to fetch profile:', error.message);
          return null;
        }
        return data;
      } catch (err) {
        console.error('Profile fetch exception:', err);
        return null;
      }
    }

    // Check initial session on mount
    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          setUser(session.user);
          setSession(session);
          const profileData = await fetchProfile(session.user.id);
          if (mounted) setProfile(profileData);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          clear();
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setSession(session);
          const profileData = await fetchProfile(session.user.id);
          if (mounted) setProfile(profileData);
        } else {
          clear();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setSession, setLoading, clear]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    clear();
  };

  return { user, profile, loading, signOut };
}
