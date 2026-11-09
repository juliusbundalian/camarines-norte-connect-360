import {Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {accountTokens as t} from '../../theme/account';
export function ChangesSavedModal({visible,onConfirm}:{visible:boolean;onConfirm():void}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm} statusBarTranslucent navigationBarTranslucent>
    <View style={s.overlay}><View style={s.card} accessibilityViewIsModal><ScrollView contentContainerStyle={s.content}>
      <View style={s.copy}><Text accessibilityRole="header" style={s.heading}>Changes Saved</Text><Text style={s.body}>Your changes have been saved successfully.</Text></View>
      <Pressable accessibilityRole="button" onPress={onConfirm} style={s.button}><Text style={s.buttonText}>Confirm</Text></Pressable>
    </ScrollView></View></View>
  </Modal>;
}
const s=StyleSheet.create({
  overlay:{flex:1,justifyContent:'center',alignItems:'center',padding:16,backgroundColor:'rgba(34,48,62,0.5)'},
  card:{backgroundColor:t.colors.card,width:'100%',maxWidth:380,maxHeight:'90%',borderRadius:16},
  content:{padding:24,gap:24},copy:{gap:8},
  heading:{fontFamily:t.fonts.medium,fontSize:24,lineHeight:32,textAlign:'center',color:t.colors.text},
  body:{fontFamily:t.fonts.regular,fontSize:16,lineHeight:24,textAlign:'center',color:t.colors.secondary},
  button:{minHeight:48,padding:12,borderRadius:12,backgroundColor:t.actionColor,alignItems:'center',justifyContent:'center'},
  buttonText:{fontFamily:t.fonts.medium,fontSize:16,lineHeight:24,color:t.colors.text},
});
