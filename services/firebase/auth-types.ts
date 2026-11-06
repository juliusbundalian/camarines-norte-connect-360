export interface AuthUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
}
export interface PhoneConfirmation {
  readonly automatic?: boolean;
  confirm(code: string): Promise<void>;
}
export interface PhoneAuthService {
  requestCode(phone: string, forceResend?: boolean): Promise<PhoneConfirmation>;
  cancel(): void;
}
export interface AuthService {
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  logout(): Promise<void>;
  observe(
    next: (user: AuthUser | null) => void,
    error: (error: unknown) => void,
  ): () => void;
}
