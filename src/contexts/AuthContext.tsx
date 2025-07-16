import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface Club {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  club: Club | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  club: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: clubData, error } = await supabase
          .from('users')
          .select('clubs(*)')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching club data:', error);
        } else {
          setClub(clubData.clubs);
        }
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const getClubData = async () => {
          const { data: clubData, error } = await supabase
            .from('users')
            .select('clubs(*)')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching club data:', error);
          } else {
            setClub(clubData.clubs);
          }
        }
        getClubData();
      } else {
        setClub(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    club,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
