import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useSQLiteContext } from "expo-sqlite";
import { getSetting, setSetting } from "@/core/database/settings";
import * as authApi from "@/core/api/authApi";
import { readSession } from "@/core/session/sessionStore";
import type { UserProfile } from "@/core/api/types";

type Mode = "loading" | "guest" | "local" | "account";
interface SessionState {
  mode: Mode;
  user: UserProfile | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  continueLocal: () => Promise<void>;
  skipImport: () => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<SessionState | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [mode, setMode] = useState<Mode>("loading");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const stored = await readSession();
        if (stored) {
          await setSetting(db, "active_account_id", stored.user.id);
          if (active) {
            setUser(stored.user);
            setMode("account");
          }
        } else {
          await setSetting(db, "active_account_id", "");
          const local = await getSetting(db, "local_mode");
          if (active) setMode(local === "1" ? "local" : "guest");
        }
      } catch {
        if (active) {
          setError("Não foi possível abrir a sessão. Seus dados locais permanecem salvos.");
          setMode("guest");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [db]);

  const accept = useCallback(async (profile: UserProfile) => {
    await setSetting(db, "active_account_id", profile.id);
    await setSetting(db, "local_mode", "0");
    setUser(profile);
    setMode("account");
    setError(null);
  }, [db]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    await accept(session.user);
  }, [accept]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const session = await authApi.register(name, email, password);
    await accept(session.user);
  }, [accept]);

  const continueLocal = useCallback(async () => {
    await setSetting(db, "local_mode", "1");
    await setSetting(db, "active_account_id", "");
    setMode("local");
  }, [db]);

  const skipImport = useCallback(async () => {
    if (!user) return;
    await setSetting(db, `skip_import_${user.id}`, "1");
  }, [db, user]);

  const logout = useCallback(async () => {
    await authApi.logout();
    await setSetting(db, "active_account_id", "");
    await setSetting(db, "local_mode", "0");
    setUser(null);
    setMode("guest");
  }, [db]);

  return (
    <Context.Provider value={{ mode, user, error, login, register, continueLocal, skipImport, logout }}>
      {children}
    </Context.Provider>
  );
}

export function useSession(): SessionState {
  const value = useContext(Context);
  if (!value) throw new Error("useSession requires SessionProvider");
  return value;
}
