import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import useMapStore from '../stores/mapStore';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session and load profile
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes and refresh profile
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        useMapStore.getState().clearDiscoveredNodes();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      // Set profile with is_admin defaulting to false if column doesn't exist
      setProfile({
        ...data,
        is_admin: data.is_admin ?? false
      });
    } catch (error) {
      console.error("Error fetching profile:", error.message);
      // If profile doesn't exist yet, it will be created by the trigger
    } finally {
      setLoading(false);
    }
  };

  const signUp = async ({ email, password, username }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) {
        console.error("Signup error:", error.message);
        throw error;
      }
      
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signIn = async ({ email, username, password }) => {
    try {
      let loginData;
      
      if (email) {
        // Login with email
        loginData = await supabase.auth.signInWithPassword({
          email,
          password
        });
      } else if (username) {
        // Login with username - first fetch email from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', username)
          .single();
        
        if (profileError || !profileData) {
          throw new Error('Username not found');
        }
        
        // Then login with the retrieved email
        loginData = await supabase.auth.signInWithPassword({
          email: profileData.email,
          password
        });
      }
      
      const { data, error } = loginData;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      useMapStore.getState().clearDiscoveredNodes();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}