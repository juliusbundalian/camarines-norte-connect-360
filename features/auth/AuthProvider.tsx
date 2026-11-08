import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type PropsWithChildren,
} from "react";
import type { AuthUser as User } from "../../services/firebase/auth-types";
import {
  getAuthService,
  type AuthService,
} from "../../services/firebase/auth-service";
import { getAuthErrorMessage } from "./errors";
interface AuthValue extends Omit<AuthService, "observe"> {
  user: User | null;
  ready: boolean;
  error: string | null;
  logoutError: string | null;
  logoutPending: boolean;
  retry(): void;
  registrationPhase: "idle" | "creating" | "created";
  registrationUid: string | null;
  finishRegistrationPresentation(): void;
}
const Context = createContext<AuthValue | null>(null);
const actions: Omit<AuthService, "observe" | "logout"> = {
  login: (email, password) => getAuthService().login(email, password),
  register: (email, password) => getAuthService().register(email, password),
  requestPasswordReset: (email) => getAuthService().requestPasswordReset(email),
};
export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<{
    user: User | null;
    ready: boolean;
    error: string | null;
  }>({ user: null, ready: false, error: null });
  // Outcome lives above route screens: one store may sign out before another fails.
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutPending, setLogoutPending] = useState(false);
  const logoutRequest = useRef<Promise<void> | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const logout = useCallback(() => {
    if (logoutRequest.current) return logoutRequest.current;
    setLogoutPending(true);
    const request = Promise.resolve()
      .then(() => getAuthService().logout())
      .then(
        () => {
          if (mounted.current) setLogoutError(null);
        },
        (error) => {
          if (mounted.current) setLogoutError(getAuthErrorMessage(error));
          throw error;
        },
      )
      .finally(() => {
        logoutRequest.current = null;
        if (mounted.current) setLogoutPending(false);
      });
    logoutRequest.current = request;
    return request;
  }, []);
  const [registration,setRegistration]=useState<{phase:"idle"|"creating"|"created";uid:string|null}>({phase:"idle",uid:null});
  const registrationRef=useRef(registration);
  const registerRequest=useRef<Promise<void>|null>(null);
  const updateRegistration=useCallback((value:typeof registration)=>{registrationRef.current=value;setRegistration(value);},[]);
  const register=useCallback((email:string,password:string)=>{
    if(registerRequest.current)return registerRequest.current;
    updateRegistration({phase:"creating",uid:null});
    const request=Promise.resolve().then(()=>getAuthService().register(email,password)).then(()=>{
      if(mounted.current&&registrationRef.current.phase!=="idle")updateRegistration({...registrationRef.current,phase:"created"});
    },error=>{if(mounted.current)updateRegistration({phase:"idle",uid:null});throw error;}).finally(()=>{registerRequest.current=null;});
    registerRequest.current=request;return request;
  },[updateRegistration]);
  const finishRegistrationPresentation=useCallback(()=>updateRegistration({phase:"idle",uid:null}),[updateRegistration]);
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
          if (active && version === generation.current) {
            const r=registrationRef.current;
            if(r.phase!=="idle"){
              if(user&&!r.uid)updateRegistration({...r,uid:user.uid});
              else if((user&&r.uid!==user.uid)||(!user&&r.uid))updateRegistration({phase:"idle",uid:null});
            }
            setState({ user, ready: true, error: null });
          }
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
    <Context.Provider
      value={{
        ...state,
        ...actions,
        logout,
        register,
        registrationPhase:registration.phase,
        registrationUid:registration.uid,
        finishRegistrationPresentation,
        logoutError,
        logoutPending,
        retry,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth(): AuthValue {
  const value = useContext(Context);
  if (!value) throw new Error("useAuth requires AuthProvider");
  return value;
}
