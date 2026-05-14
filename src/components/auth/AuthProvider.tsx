import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile, UserRole } from '@/types';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('ccmd_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data as Profile);
      } else {
        // Profile doesn't exist, create it (fallback for existing users)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('ccmd_profiles')
              .insert([
                { 
                  id: userId, 
                  name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                  email: user.email,
                  role: (user.user_metadata?.role as UserRole) || 'JURY' 
                }
              ])
              .select()
              .single();
            
            if (createError) {
              // If it failed because it was created in the meantime, try fetching it again
              if (createError.code === '23505') { // Unique violation
                const { data: retriedProfile } = await supabase
                  .from('ccmd_profiles')
                  .select('*')
                  .eq('id', userId)
                  .single();
                if (retriedProfile) setProfile(retriedProfile as Profile);
              } else {
                console.error('Error creating profile fallback:', createError);
              }
            } else if (newProfile) {
              setProfile(newProfile as Profile);
            }
          } catch (e) {
            console.error('Critical error in profile fallback:', e);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
