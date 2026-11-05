import { StyleSheet } from "react-native";
import { Button as PaperButton, type ButtonProps } from "react-native-paper";
import { tokens } from "../theme";

/** Shared minimum touch area for temporary and future Figma button layouts. */
export function Button({ style, contentStyle, ...props }: ButtonProps) {
  return (
    <PaperButton
      {...props}
      style={[style, styles.touchTarget]}
      contentStyle={[contentStyle, styles.touchTarget]}
    />
  );
}
const styles = StyleSheet.create({
  touchTarget: { minHeight: tokens.size.touch },
});
