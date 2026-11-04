import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type PropsWithChildren,
} from "react";
import type { User } from "firebase/auth";
import {
  getAuthService,
  type AuthService,
} from "../../services/firebase/auth-service";
import { getAuthErrorMessage } from "./errors";
interface AuthValue extends Omit<AuthService, "observe"> {
  user: User | null;
  ready: boolean;
  error: string | null;
  retry(): void;
}
const Context = createContext<AuthValue | null>(null);
const actions: Omit<AuthService, "observe"> = {
  login: (email, password) => getAuthService().login(email, password),
  register: (email, password) => getAuthService().register(email, password),
  requestPasswordReset: (email) => getAuthService().requestPasswordReset(email),
  logout: () => getAuthService().logout(),
};
export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<{
    user: User | null;
    ready: boolean;
    error: string | null;
  }>({ user: null, ready: false, error: null });
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const retry = useCallback(() => {
    generation.current += 1;
    setState({ user: null, ready: false, error: null });
    setAttempt((v) => v + 1);
  }, []);
  useEffect(() => {
    let active = true;
    const version = generation.current;
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = getAuthService().observe(
        (user) => {
          if (active && version === generation.current)
            setState({ user, ready: true, error: null });
        },
        (error) => {
          if (active && version === generation.current)
            setState({
              user: null,
              ready: true,
              error: getAuthErrorMessage(error),
            });
        },
      );
    } catch (error) {
      // Local setup errors are actionable; remote errors use the safe mapper.
      const message =
        error instanceof Error && /EXPO_PUBLIC_|emulator/i.test(error.message)
          ? error.message
          : getAuthErrorMessage(error);
      setState({ user: null, ready: true, error: message });
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [attempt]);
  return (
    <Context.Provider value={{ ...state, ...actions, retry }}>
      {children}
    </Context.Provider>
  );
}
export function useAuth(): AuthValue {
  const value = useContext(Context);
  if (!value) throw new Error("useAuth requires AuthProvider");
  return value;
}
