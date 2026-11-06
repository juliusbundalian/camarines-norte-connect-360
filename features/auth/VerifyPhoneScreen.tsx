import { useCallback, useEffect, useState } from "react";
import { BackHandler, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { usePhoneVerification } from "./PhoneVerificationProvider";
import {
  AuthAction,
  AuthAlert,
  AuthLink,
  AuthScaffold,
  authStyles as s,
} from "./AuthScaffold";
import { authTokens as t } from "../../theme/auth";
export default function VerifyPhoneScreen() {
  const v = usePhoneVerification();
  const [code, setCode] = useState(""),
    [now, setNow] = useState(Date.now());
  const busy = v.sending || v.verifying;
  const change = useCallback(() => {
    if (busy) return;
    const target = v.intent === "register" ? "/register" : "/login";
    v.cancel();
    router.replace(target);
  }, [busy, v.cancel, v.intent]);
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!busy) change();
        return true;
      });
      return () => sub.remove();
    }, [busy, change]),
  );
  useEffect(() => {
    if (!v.phone) router.replace("/login");
  }, [v.phone]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.ceil((v.resendAt - now) / 1000));
  if (!v.phone) return null;
  const automatic = !!v.confirmation?.automatic;
  return (
    <AuthScaffold
      title="Verify your number"
      subtitle={
        automatic
          ? "Your phone number was verified automatically. Continue to sign in."
          : `Enter the 6-digit code sent to ${v.phone}.`
      }
      onBack={change}
      busy={busy}
    >
      <AuthAlert message={v.error} />
      {!automatic ? (
        <View style={s.gap}>
          <Text style={s.label}>Verification code</Text>
          <TextInput
            accessibilityLabel="Verification code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            maxLength={6}
            editable={!busy && v.ready}
            placeholder="6-digit code"
            placeholderTextColor={t.colors.muted}
            style={s.field}
            returnKeyType="done"
            onSubmitEditing={() => void v.confirm(code)}
          />
        </View>
      ) : null}
      <AuthAction
        label={automatic ? "Continue" : "Verify number"}
        busy={v.verifying}
        disabled={v.sending || !v.ready}
        onPress={() => void v.confirm(code)}
      />
      <AuthLink
        label={seconds ? `Resend code (${seconds}s)` : "Resend code"}
        disabled={busy || seconds > 0}
        onPress={() => {
          setCode("");
          void v.resend();
        }}
      />
      <AuthLink label="Change number" disabled={busy} onPress={change} />
      <Text style={s.small}>
        Keep this screen open while you check your SMS. If the code expires,
        request a new one.
      </Text>
    </AuthScaffold>
  );
}
