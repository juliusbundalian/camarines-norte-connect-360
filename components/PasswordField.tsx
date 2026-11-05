import { useState } from "react";
import { tokens } from "../theme";
import { TextInput, type TextInputProps } from "react-native-paper";
import Eye from "lucide-react-native/icons/eye";
import EyeOff from "lucide-react-native/icons/eye-off";
export function PasswordField({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextInput
      mode="outlined"
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      label={label}
      accessibilityLabel={label}
      secureTextEntry={!visible}
      right={
        <TextInput.Icon
          style={{ minWidth: tokens.size.touch, minHeight: tokens.size.touch }}
          icon={({ size, color }) =>
            visible ? (
              <EyeOff size={size} color={color} />
            ) : (
              <Eye size={size} color={color} />
            )
          }
          accessibilityLabel={`${visible ? "Hide" : "Show"} ${label}`}
          onPress={() => setVisible((value) => !value)}
        />
      }
    />
  );
}
