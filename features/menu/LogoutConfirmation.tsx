import {Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {menuTokens as t} from '../../theme/menu';
export function LogoutConfirmation({visible,onCancel,onConfirm}:{visible:boolean;onCancel():void;onConfirm():void}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent navigationBarTranslucent>
    <View style={styles.backdrop}>
      <View accessibilityViewIsModal style={styles.card}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.copy}>
            <Text accessibilityRole="header" style={styles.title}>Logout?</Text>
            <Text style={styles.body}>Are you sure you want to sign out? You can log in again anytime.</Text>
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.button,styles.cancel]}><Text style={[styles.buttonText,styles.cancelText]}>Cancel</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={onConfirm} style={[styles.button,styles.confirm]}><Text style={[styles.buttonText,styles.confirmText]}>Confirm</Text></Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
const styles=StyleSheet.create({
  backdrop:{flex:1,justifyContent:'center',alignItems:'center',padding:16,backgroundColor:'rgba(34,48,62,0.5)'},
  card:{width:'100%',maxWidth:380,maxHeight:'90%',borderRadius:16,backgroundColor:t.colors.card},
  content:{padding:24,gap:24},
  copy:{gap:8},
  title:{fontFamily:t.fonts.medium,fontSize:24,lineHeight:32,color:t.colors.text,textAlign:'center',letterSpacing:0},
  body:{fontFamily:t.fonts.regular,fontSize:16,lineHeight:24,color:t.colors.secondary,textAlign:'center',letterSpacing:0},
  actions:{flexDirection:'row',gap:16},button:{flex:1,minHeight:48,paddingHorizontal:12,paddingVertical:12,borderRadius:12,alignItems:'center',justifyContent:'center'},
  cancel:{backgroundColor:'rgba(133,146,163,0.16)'},confirm:{backgroundColor:t.colors.danger},
  buttonText:{fontFamily:t.fonts.medium,fontSize:16,lineHeight:24,textAlign:'center'},cancelText:{color:'#8592A3'},confirmText:{color:'#FFFFFF'},
});
