import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { getPhoneAuthService } from "../../services/firebase/auth-service";
import type {
  PhoneConfirmation,
  PhoneAuthService,
} from "../../services/firebase/auth-types";
import { phoneSchema, codeSchema } from "./phone-schemas";
import { getPhoneErrorMessage } from "./errors";
export type PhoneIntent = "login" | "register";
interface State {
  phone: string | null;
  intent: PhoneIntent;
  confirmation: PhoneConfirmation | null;
  sending: boolean;
  verifying: boolean;
  error: string | null;
  resendAt: number;
}
const initial: State = {
  phone: null,
  intent: "login",
  confirmation: null,
  sending: false,
  verifying: false,
  error: null,
  resendAt: 0,
};
interface Value extends State {
  ready: boolean;
  start(phone: string, intent: PhoneIntent): Promise<boolean>;
  confirm(code: string): Promise<boolean>;
  resend(): Promise<boolean>;
  cancel(): void;
}
const Context = createContext<Value | null>(null);
export function PhoneVerificationProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<State>(initial);
  const current = useRef(state);
  current.current = state;
  const service = useRef<PhoneAuthService | null>(null);
  const getService = () =>
    service.current ?? (service.current = getPhoneAuthService());
  const generation = useRef(0),
    busy = useRef(false),
    mounted = useRef(true);
  const cancel = useCallback(() => {
    generation.current++;
    busy.current = false;
    service.current?.cancel();
    if (mounted.current) setState(initial);
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current++;
      service.current?.cancel();
    };
  }, []);
  const send = useCallback(
    async (phone: string, intent: PhoneIntent, resend = false) => {
      if (busy.current || !mounted.current) return false;
      const parsed = phoneSchema.safeParse(phone);
      if (!parsed.success) {
        setState((s) => ({
          ...s,
          error: "Enter a valid Philippine mobile number.",
        }));
        return false;
      }
      const version = ++generation.current;
      busy.current = true;
      setState((s) => ({
        ...s,
        phone: parsed.data,
        intent,
        confirmation: null,
        sending: true,
        error: null,
      }));
      try {
        const confirmation = await getService().requestCode(
          parsed.data,
          resend,
        );
        if (!mounted.current || version !== generation.current) return false;
        setState((s) => ({ ...s, confirmation, resendAt: Date.now() + 60000 }));
        return true;
      } catch (error) {
        if (mounted.current && version === generation.current)
          setState((s) => ({ ...s, error: getPhoneErrorMessage(error) }));
        return false;
      } finally {
        if (mounted.current && version === generation.current) {
          busy.current = false;
          setState((s) => ({ ...s, sending: false }));
        }
      }
    },
    [],
  );
  const confirm = useCallback(async (code: string) => {
    const session = current.current.confirmation;
    if (busy.current || !session || !mounted.current) return false;
    if (!session.automatic && !codeSchema.safeParse(code).success) {
      setState((s) => ({
        ...s,
        error: "Enter the 6-digit verification code.",
      }));
      return false;
    }
    const version = generation.current;
    busy.current = true;
    setState((s) => ({ ...s, verifying: true, error: null }));
    try {
      await session.confirm(code);
      if (!mounted.current || version !== generation.current) return false;
      setState(initial);
      return true;
    } catch (error) {
      if (mounted.current && version === generation.current)
        setState((s) => ({ ...s, error: getPhoneErrorMessage(error) }));
      return false;
    } finally {
      if (mounted.current && version === generation.current) {
        busy.current = false;
        setState((s) => ({ ...s, verifying: false }));
      }
    }
  }, []);
  const resend = useCallback(() => {
    const s = current.current;
    if (!s.phone || Date.now() < s.resendAt) return Promise.resolve(false);
    return send(s.phone, s.intent, true);
  }, [send]);
  return (
    <Context.Provider
      value={{
        ...state,
        ready: !!state.confirmation,
        start: send,
        confirm,
        resend,
        cancel,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePhoneVerification() {
  const value = useContext(Context);
  if (!value)
    throw new Error("usePhoneVerification requires PhoneVerificationProvider");
  return value;
}
