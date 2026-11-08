import {Pressable,StyleSheet,Text,View} from 'react-native';
import UserRound from 'lucide-react-native/icons/user-round';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import {menuTokens as t} from '../../theme/menu';
export function MenuHeader({signedIn,pending,onLogin,onRegister,onAccount}:{signedIn:boolean;pending:boolean;onLogin():void;onRegister():void;onAccount():void}){
  return <View style={styles.header}>
    <View style={styles.avatar} accessible={false}><UserRound size={56} strokeWidth={1.6} color={t.colors.secondary}/></View>
    <View style={styles.copy}>
      <Text accessibilityRole="header" style={styles.title}>{signedIn?'Hello, User':'Hello, Guest'}</Text>
      {signedIn?<Pressable accessibilityRole="button" accessibilityLabel="Update personal info" disabled={pending} style={[styles.action,styles.profileAction]} onPress={onAccount}><Text style={styles.secondary}>Update personal info</Text><ChevronRight size={18} color={t.colors.secondary}/></Pressable>:
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Login" disabled={pending} style={styles.action} onPress={onLogin}><Text style={styles.link}>Login</Text></Pressable>
          <Text style={styles.or}>or</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Sign up" disabled={pending} style={styles.action} onPress={onRegister}><Text style={styles.link}>Sign up</Text><ChevronRight size={18} color={t.colors.primary}/></Pressable>
        </View>}
    </View>
  </View>;
}
const styles=StyleSheet.create({
  header:{flexDirection:'row',alignItems:'center',gap:16,minHeight:64},avatar:{width:t.size.avatar,height:t.size.avatar,borderRadius:32,backgroundColor:t.colors.avatar,alignItems:'center',justifyContent:'flex-end',overflow:'hidden'},copy:{flex:1},title:{...t.type.profile,fontFamily:t.fonts.medium,color:t.colors.text},actions:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:4,marginVertical:-8},action:{minHeight:48,flexDirection:'row',alignItems:'center',gap:4,flexShrink:1},profileAction:{marginVertical:-8},link:{...t.type.action,fontFamily:t.fonts.medium,color:t.colors.primary},secondary:{...t.type.action,fontFamily:t.fonts.medium,color:t.colors.secondary,flexShrink:1},or:{...t.type.action,fontFamily:t.fonts.regular,color:t.colors.text},
});
