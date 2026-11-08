import { useCallback, useEffect, useRef, useState } from "react";
import type { PasswordPolicy } from "firebase/auth";
import { checkPasswordPolicy } from "../../services/firebase/password-policy";
import { getAuthErrorMessage } from "./errors";

export function usePasswordPolicy(enabled: boolean) {
  const [state, setState] = useState<{ policy: PasswordPolicy | null; loading: boolean; error: string | null }>({ policy: null, loading: enabled, error: null });
  const active = useRef(false);
  const generation = useRef(0);
  const pending = useRef(false);
  const retry = useCallback(() => {
    if (!enabled || !active.current || pending.current) return;
    pending.current = true;
    const version = ++generation.current;
    setState({ policy: null, loading: true, error: null });
    void checkPasswordPolicy("").then(
      result => {
        if (active.current && version === generation.current) {
          pending.current = false;
          setState({ policy: result.passwordPolicy, loading: false, error: null });
        }
      },
      error => {
        if (active.current && version === generation.current) {
          pending.current = false;
          setState({ policy: null, loading: false, error: getAuthErrorMessage(error) });
        }
      },
    );
  }, [enabled]);
  const accept = useCallback((policy: PasswordPolicy) => {
    if (!active.current) return;
    generation.current++;
    pending.current = false;
    setState({ policy, loading: false, error: null });
  }, []);
  useEffect(() => {
    active.current = true;
    if (enabled) retry();
    else setState({ policy: null, loading: false, error: null });
    return () => {
      active.current = false;
      generation.current++;
      pending.current = false;
    };
  }, [enabled, retry]);
  return { ...state, retry, accept };
}
