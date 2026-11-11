import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ClerkProvider, useUser, useAuth as useClerkAuthSDK, useSignIn, useSignUp } from '@clerk/clerk-react';
import type { User } from '../types';
import { api } from '../api';

export interface AuthContextValue {
  currentUser: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  clerkUserId: string | null;
  signIn: (data: { email: string; password: string }) => Promise<User>;
  signUp: (data: { firstName: string; lastName?: string; email: string; password: string; phone?: string }) => Promise<User>;
  signInWithGoogle: (data?: { email?: string; name?: string; avatar?: string }) => Promise<User>;
  signOut: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Internal bridge when ClerkProvider is active
function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn: isClerkSignedIn } = useUser();
  const { getToken, signOut: clerkSignOut } = useClerkAuthSDK();
  const { signIn: clerkSignIn, isLoaded: isSignInLoaded, setActive: setSignInActive } = useSignIn();
  const { signUp: clerkSignUp, isLoaded: isSignUpLoaded, setActive: setSignUpActive } = useSignUp();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync Clerk authenticated user to internal database
  useEffect(() => {
    if (isUserLoaded && isClerkSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      const phone = clerkUser.primaryPhoneNumber?.phoneNumber;
      const displayName = clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Trackd User';
      const avatar = clerkUser.imageUrl;

      getToken().then((token) => {
        api.setAuth(token || clerkUser.id, clerkUser.id, {
          displayName,
          email,
          avatar
        });

        api.syncUser({
          _id: clerkUser.id,
          email,
          displayName,
          avatar,
          phone
        }).then((u) => {
          setCurrentUser(u);
          setIsLoaded(true);
        }).catch((err) => {
          console.error('User sync notice:', err);
          setIsLoaded(true);
        });
      });
    } else if (isUserLoaded && !isClerkSignedIn) {
      // Check if we have an active native Trackd session token before wiping auth
      const existingToken = api.getToken();
      if (existingToken) {
        api.getCurrentUser()
          .then((u) => {
            if (u) {
              setCurrentUser(u);
            } else {
              api.clearAuth();
              setCurrentUser(null);
            }
          })
          .catch(() => {
            api.clearAuth();
            setCurrentUser(null);
          })
          .finally(() => {
            setIsLoaded(true);
          });
      } else {
        api.clearAuth();
        setCurrentUser(null);
        setIsLoaded(true);
      }
    }
  }, [isUserLoaded, isClerkSignedIn, clerkUser]);

  const loadUser = useCallback(async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const signIn = async (data: { email: string; password: string }): Promise<User> => {
    // Attempt headless Clerk sign in if ready
    if (clerkSignIn && isSignInLoaded) {
      try {
        const res = await clerkSignIn.create({
          identifier: data.email,
          password: data.password
        });
        if (res.status === 'complete' && res.createdSessionId && setSignInActive) {
          await setSignInActive({ session: res.createdSessionId });
        }
      } catch (err: any) {
        console.warn('Clerk headless sign-in attempt notice:', err?.message || err);
      }
    }

    // Synchronize through backend API
    const res = await api.signIn(data);
    setCurrentUser(res.user);
    return res.user;
  };

  const signUp = async (data: { firstName: string; lastName?: string; email: string; password: string; phone?: string }): Promise<User> => {
    // Attempt headless Clerk sign up if ready
    if (clerkSignUp && isSignUpLoaded) {
      try {
        const res = await clerkSignUp.create({
          emailAddress: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName || undefined,
          phoneNumber: data.phone ? data.phone.replace(/[^0-9+]/g, '') : undefined
        });
        if (res.status === 'complete' && res.createdSessionId && setSignUpActive) {
          await setSignUpActive({ session: res.createdSessionId });
        }
      } catch (err: any) {
        console.warn('Clerk headless sign-up attempt notice:', err?.message || err);
      }
    }

    // Synchronize through backend API
    const res = await api.signUp(data);
    setCurrentUser(res.user);
    return res.user;
  };

  const signInWithGoogle = async (data?: { email?: string; name?: string; avatar?: string }): Promise<User> => {
    if (clerkSignIn && isSignInLoaded) {
      try {
        await clerkSignIn.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: window.location.origin,
          redirectUrlComplete: window.location.origin
        });
      } catch (err) {
        console.warn('Google OAuth redirect notice:', err);
      }
    }

    // Fallback sync
    const res = await api.signInWithGoogle(data);
    setCurrentUser(res.user);
    return res.user;
  };

  const signOut = async () => {
    try {
      await clerkSignOut();
    } catch {
      // Ignore SDK error
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network error
    }
    api.clearAuth();
    setCurrentUser(null);
  };

  const contextValue: AuthContextValue = {
    currentUser,
    isLoaded,
    isSignedIn: Boolean(currentUser || isClerkSignedIn),
    clerkUserId: clerkUser?.id || currentUser?._id || null,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    setCurrentUser,
    loadUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Fallback provider when Clerk Publishable Key is not yet set
function StandaloneAuthBridge({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signIn = async (data: { email: string; password: string }): Promise<User> => {
    const res = await api.signIn(data);
    setCurrentUser(res.user);
    return res.user;
  };

  const signUp = async (data: { firstName: string; lastName?: string; email: string; password: string; phone?: string }): Promise<User> => {
    const res = await api.signUp(data);
    setCurrentUser(res.user);
    return res.user;
  };

  const signInWithGoogle = async (data?: { email?: string; name?: string; avatar?: string }): Promise<User> => {
    const res = await api.signInWithGoogle(data);
    setCurrentUser(res.user);
    return res.user;
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network error
    }
    api.clearAuth();
    setCurrentUser(null);
  };

  const contextValue: AuthContextValue = {
    currentUser,
    isLoaded,
    isSignedIn: Boolean(currentUser),
    clerkUserId: currentUser?._id || null,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    setCurrentUser,
    loadUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clerkPubKey = ((import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY as string) || '';

  if (clerkPubKey && clerkPubKey.startsWith('pk_')) {
    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        <ClerkAuthBridge>
          {children}
        </ClerkAuthBridge>
      </ClerkProvider>
    );
  }

  return (
    <StandaloneAuthBridge>
      {children}
    </StandaloneAuthBridge>
  );
};
