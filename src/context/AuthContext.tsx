import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import crypto from "crypto-js";
import { db } from "../db";

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  schoolName: string | null;
  schoolId: string | null;
  userId: string | null;
  login: (
    username: string,
    password: string,
    recoveryAnswer: string,
  ) => Promise<boolean>;
  logout: () => void;
  setSchoolName: (name: string) => void;
  setSchoolId: (id: string) => void;
  setUserId: (id: string) => void;
  getSecretKey: () => string;
  setSecurityQuestion: (question: string, answer: string) => void;
  getSecurityQuestion: () => { question: string; answer: string } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_STORAGE_KEY = "rankit_session";
const SECRET_KEY_STORAGE_KEY = "rankit_secret_key";
const SECURITY_Q_STORAGE_KEY = "rankit_security_q";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ===== ALL HOOKS MUST BE CALLED FIRST =====

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      const secret = localStorage.getItem(SECRET_KEY_STORAGE_KEY);
      if (session && secret) {
        console.log("✅ Found valid session in localStorage on app init");
        return true;
      }
    } catch (err) {
      console.error("Error checking initial login state:", err);
    }
    return false;
  });

  const [username, setUsername] = useState<string | null>(() => {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.username;
      }
    } catch (err) {
      console.error("Error getting initial username:", err);
    }
    return null;
  });

  const [schoolName, setSchoolNameState] = useState<string | null>(
    localStorage.getItem("rankit_school_name"),
  );

  const [schoolId, setSchoolIdState] = useState<string | null>(
    localStorage.getItem("rankit_school_id"),
  );

  const [userId, setUserIdState] = useState<string | null>(
    localStorage.getItem("rankit_user_id"),
  );

  const [secretKey, setSecretKey] = useState<string>(
    localStorage.getItem(SECRET_KEY_STORAGE_KEY) || "",
  );

  // ===== ALL HOOKS DECLARED ABOVE - NOW NORMAL CODE =====

  // Log current auth state on mount
  useEffect(() => {
    console.log(
      "🔄 AuthProvider mounted - isLoggedIn:",
      isLoggedIn,
      "username:",
      username,
    );
  }, [isLoggedIn, username]);

  const hashPassword = (password: string): string => {
    return crypto.SHA256(password).toString();
  };

  const login = useCallback(
    async (
      username: string,
      password: string,
      recoveryAnswer: string,
    ): Promise<boolean> => {
      try {
        console.log("🔐 Login attempt for user:", username);

        // Hash the credentials
        const hashedPassword = hashPassword(password);
        const hashedAnswer = hashPassword(recoveryAnswer.toLowerCase());

        // Query database for user with matching username
        const user = await db.getUserByUsername(username);

        if (!user) {
          console.log("❌ User not found:", username);
          return false;
        }

        console.log("✅ User found, validating credentials...");

        // Validate password
        if (user.hashedPassword !== hashedPassword) {
          console.log("❌ Password mismatch");
          return false;
        }

        // Validate security answer
        if (user.recoveryAnswer !== hashedAnswer) {
          console.log("❌ Security answer mismatch");
          return false;
        }

        console.log("✅ Credentials validated successfully!");

        // All validations passed - set session
        const sessionData = {
          username,
          loginTime: Date.now(),
        };

        const newSecretKey = crypto.lib.WordArray.random(16).toString();
        const generatedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const generatedSchoolId =
          localStorage.getItem("rankit_school_id") || `school_${Date.now()}`;

        // Save to localStorage
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
        localStorage.setItem(SECRET_KEY_STORAGE_KEY, newSecretKey);
        localStorage.setItem("rankit_security_answer", hashedAnswer);
        localStorage.setItem("rankit_user_id", generatedUserId);
        localStorage.setItem("rankit_school_id", generatedSchoolId);

        setUsername(username);
        setSecretKey(newSecretKey);
        setUserIdState(generatedUserId);
        setSchoolIdState(generatedSchoolId);
        setIsLoggedIn(true);

        console.log("✅ Login successful - session saved to localStorage");
        return true;
      } catch (err) {
        console.error("Login error:", err);
        return false;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SECRET_KEY_STORAGE_KEY);
    localStorage.removeItem("rankit_security_answer");
    localStorage.removeItem("rankit_school_name");
    localStorage.removeItem("rankit_current_class_name");
    localStorage.removeItem("rankit_user_id");
    localStorage.removeItem("rankit_school_id");
    setUsername(null);
    setSecretKey("");
    setIsLoggedIn(false);
    setSchoolNameState(null);
    setSchoolIdState(null);
    setUserIdState(null);
    console.log("✅ Logout - all session data cleared");
  }, []);

  const setSchoolName = useCallback((name: string) => {
    localStorage.setItem("rankit_school_name", name);
    setSchoolNameState(name);
  }, []);

  const setSchoolId = useCallback((id: string) => {
    localStorage.setItem("rankit_school_id", id);
    setSchoolIdState(id);
  }, []);

  const setUserId = useCallback((id: string) => {
    localStorage.setItem("rankit_user_id", id);
    setUserIdState(id);
  }, []);

  const getSecretKey = useCallback(() => {
    return (
      secretKey || localStorage.getItem(SECRET_KEY_STORAGE_KEY) || "default_key"
    );
  }, [secretKey]);

  const setSecurityQuestion = useCallback(
    (question: string, answer: string) => {
      const securityData = {
        question,
        answerHash: hashPassword(answer.toLowerCase()),
      };
      localStorage.setItem(
        SECURITY_Q_STORAGE_KEY,
        JSON.stringify(securityData),
      );
    },
    [],
  );

  const getSecurityQuestion = useCallback(() => {
    const data = localStorage.getItem(SECURITY_Q_STORAGE_KEY);
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      return {
        question: parsed.question,
        answer: parsed.answerHash,
      };
    } catch (err) {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        username,
        schoolName,
        schoolId,
        userId,
        login,
        logout,
        setSchoolName,
        setSchoolId,
        setUserId,
        getSecretKey,
        setSecurityQuestion,
        getSecurityQuestion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
