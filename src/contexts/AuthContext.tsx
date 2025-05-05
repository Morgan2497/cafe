import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from '../services/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Define the User type
interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAdmin?: boolean;
  name?: string;
}

// Define the context type
interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{
    error: Error | null;
    user: AuthUser | null;
  }>;
  logout: () => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, name: string) => Promise<{
    error: Error | null;
    user: AuthUser | null;
  }>;
  setUserAsAdmin: (userId: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  removeUserAsAdmin: (userId: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Props type for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Convert Firebase user to our AuthUser type
const formatUser = (user: FirebaseUser, additionalData?: any): AuthUser => ({
  id: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  isAdmin: additionalData?.isAdmin === true || user.email === 'admin@cpsc449.com' || user.email === 'admin@example.com',
  name: additionalData?.name
});

// Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Real login function using Firebase Auth
  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      const userData = userDoc.data();
      const formattedUser = formatUser(result.user, userData);
      return { user: formattedUser, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Unknown error during login') 
      };
    }
  };

  // Real logout function using Firebase Auth
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      return { error: null };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        error: error instanceof Error ? error : new Error('Unknown error during logout') 
      };
    }
  };

  // Real signup function using Firebase Auth
  const signup = async (email: string, password: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        name,
        email,
        isAdmin: false,
        createdAt: new Date().toISOString()
      });

      const formattedUser = formatUser(result.user, { name, isAdmin: false });
      return { user: formattedUser, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Unknown error during signup') 
      };
    }
  };

  // Function to set user as admin
  const setUserAsAdmin = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Update the user document with isAdmin flag
      await updateDoc(userRef, {
        isAdmin: true
      });
      
      // If this is the current user, update the current user state
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({
          ...currentUser,
          isAdmin: true
        });
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error setting user as admin:', error);
      return { 
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error promoting user') 
      };
    }
  };

  // Function to remove admin rights from a user
  const removeUserAsAdmin = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Update the user document to remove the isAdmin flag
      await updateDoc(userRef, {
        isAdmin: false
      });
      
      // If this is the current user, update the current user state
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({
          ...currentUser,
          isAdmin: false
        });
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error removing admin rights from user:', error);
      return { 
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error demoting user') 
      };
    }
  };

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setCurrentUser(formatUser(user, userData));
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    logout,
    signup,
    setUserAsAdmin,
    removeUserAsAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}