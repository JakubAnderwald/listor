import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { firebaseAuth } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { firebaseDB } from "@/lib/firebase"; // Assuming firebaseDB is imported correctly

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);

      // Clean up any incorrect shared references when user logs in
      if (user) {
        firebaseDB.cleanupSharedReferences().catch(console.error);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await firebaseAuth.signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseAuth.signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}