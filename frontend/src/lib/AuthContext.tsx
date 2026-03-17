import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  type User 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { updateLastActive } from "@/services/api";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  session: User | null; // Alias for compatibility
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Update last_active on login
        await updateLastActive();
        
        // Initial theme sync from Firestore
        const profileRef = doc(db, "profiles", firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          if (data.dark_mode !== undefined) {
            const isDark = data.dark_mode;
            document.documentElement.classList.toggle("dark", isDark);
            localStorage.setItem("theme", isDark ? "dark" : "light");
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (fullName && user) {
        await updateProfile(user, { displayName: fullName });
      }

      // Create initial Firestore profile and organization for the new user
      if (user) {
        const orgId = `org_${user.uid.slice(0, 8)}`;
        
        // 1. Create Organization
        await setDoc(doc(db, "organizations", orgId), {
          id: orgId,
          name: `${fullName || 'My'}'s Team`,
          slug: orgId,
          created_at: new Date().toISOString()
        });

        // 2. Create User Profile
        await setDoc(doc(db, "profiles", user.uid), {
          id: user.uid,
          email: user.email,
          full_name: fullName || "",
          org_id: orgId,
          role: "admin",
          department: "General",
          created_at: new Date().toISOString()
        });

        // 3. Create Default Org Settings
        await setDoc(doc(db, "org_settings", orgId), {
          id: orgId,
          org_id: orgId,
          monthly_budget: 1000,
          alert_threshold: 80,
          auto_block: false,
          allowed_categories: ["AI Assistant", "Development"],
          blocked_domains: [],
          notification_email: true,
          notification_slack: false
        });
      }

      return { error: null };
    } catch (error) {
      console.error("Signup error:", error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        await updateLastActive();
      }
    } catch (e) {
      console.error("Failed to update last_active on sign out", e);
    }
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, session: user, loading, signIn, signUp, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
