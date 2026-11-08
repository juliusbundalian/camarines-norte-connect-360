import {useEffect,useRef,useState} from 'react';
import {AppState,Modal,ScrollView,StyleSheet,Text,View} from 'react-native';
import {authTokens as t} from '../../theme/auth';
export function RegistrationSuccessModal({visible,onElapsed}:{visible:boolean;onElapsed():void}){
 const [seconds,setSeconds]=useState(3);const callback=useRef(onElapsed);callback.current=onElapsed;
 useEffect(()=>{
  if(!visible)return;
  const deadline=Date.now()+3000;let fired=false;
  setSeconds(3);
  const tick=()=>{const remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));setSeconds(remaining);if(!remaining&&!fired){fired=true;callback.current();}};
  const timer=setInterval(tick,200);const sub=AppState.addEventListener('change',s=>{if(s==='active')tick();});
  return()=>{clearInterval(timer);sub.remove();};
 },[visible]);
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={()=>{}} statusBarTranslucent navigationBarTranslucent>
  <View style={styles.backdrop}><View accessibilityViewIsModal style={styles.card}><ScrollView contentContainerStyle={styles.content}>
   <View style={styles.copy}><Text accessibilityRole="header" style={styles.title}>Account Registered</Text><Text style={styles.body}>Your account creation is complete. You’ll continue to profile setup shortly.</Text></View>
   <Text accessibilityLiveRegion="polite" style={styles.countdown}>Redirecting in {seconds}s</Text>
  </ScrollView></View></View>
 </Modal>;
}
const styles=StyleSheet.create({backdrop:{flex:1,justifyContent:'center',alignItems:'center',padding:16,backgroundColor:'rgba(34,48,62,0.5)'},card:{width:'100%',maxWidth:380,maxHeight:'90%',borderRadius:16,backgroundColor:'white'},content:{paddingHorizontal:24,paddingVertical:32,gap:16},copy:{gap:8},title:{fontFamily:"Poppins-Medium",fontSize:24,lineHeight:32,letterSpacing:-1,color:t.colors.text,textAlign:'center'},body:{fontFamily:"Poppins-Regular",fontSize:16,lineHeight:24,color:t.colors.secondary,textAlign:'center'},countdown:{fontFamily:"Poppins-Regular",fontSize:16,lineHeight:24,color:t.colors.muted,textAlign:'center'}});
