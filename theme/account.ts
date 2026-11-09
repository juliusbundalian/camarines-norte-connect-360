import {menuTokens} from './menu';
import {profileTokens} from './profile';
/** Manage Account 412×892 frames inspected in Figma desktop. */
export const accountTokens={
  ...menuTokens,
  avatarSize:128,
  fieldHeight:56,
  fieldRadius:16,
  actionColor:'#FFAB00',
  border:profileTokens.colors.border,
  fieldText:profileTokens.body,
  fieldLabel:profileTokens.label,
} as const;
