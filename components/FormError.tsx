import {Text} from 'react-native-paper';
import {tokens} from '../theme';
export function FormError({message}:{message:string|null}) {
  return message?<Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{color:tokens.colors.error}}>{message}</Text>:null;
}
