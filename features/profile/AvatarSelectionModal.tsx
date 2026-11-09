import {useEffect,useState} from 'react';
import {ActivityIndicator,Modal,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {AVATARS} from './avatars';
import {ProfileAvatar} from './ProfileAvatar';
import type {AvatarId} from './profile-types';
import {profileTokens as t} from '../../theme/profile';
export function AvatarSelectionModal({visible,value,onDone,onCancel,busy=false}:{visible:boolean;value:AvatarId;onDone(id:AvatarId):void;onCancel():void;busy?:boolean}){
 const [selected,setSelected]=useState(value);const {width}=useWindowDimensions();
 useEffect(()=>{if(visible)setSelected(value);},[visible,value]);
 const doneLabel=busy?'Saving…':'Done';
 const inner=Math.min(380,width-32)-48;const gap=Math.min(24,Math.max(8,(inner-270)/2));const size=Math.min(90,(inner-gap*2)/3);
 return <Modal testID="avatar-selection-modal" visible={visible} transparent animationType="fade" onRequestClose={()=>{if(!busy)onCancel();}} statusBarTranslucent navigationBarTranslucent>
  <View style={s.backdrop}><Pressable accessible={false} style={StyleSheet.absoluteFill} disabled={busy} onPress={onCancel}/><View style={s.card} accessibilityViewIsModal><ScrollView contentContainerStyle={s.content}>
   <Text accessibilityRole="header" style={s.title}>Select Avatar</Text>
   <View accessibilityRole="radiogroup" style={[s.grid,{width:size*3+gap*2,gap}]}>{AVATARS.map(avatar=><Pressable key={avatar.id} accessibilityRole="radio" accessibilityLabel={avatar.label} accessibilityState={{checked:selected===avatar.id,selected:selected===avatar.id}} disabled={busy} onPress={()=>setSelected(avatar.id)} style={{width:size,height:size,borderRadius:size/2}}><ProfileAvatar id={avatar.id} size={size}/>{selected===avatar.id?<View pointerEvents="none" style={[StyleSheet.absoluteFill,s.selected,{borderRadius:size/2}]}/>:null}</Pressable>)}</View>
   <Pressable accessibilityRole="button" accessibilityLabel={doneLabel} accessibilityLiveRegion="polite" accessibilityState={{disabled:busy,busy}} disabled={busy} onPress={()=>onDone(selected)} style={s.done}>
    {busy?<ActivityIndicator size={18} color={t.colors.text} accessible={false}/>:null}
    <Text style={s.doneText}>{doneLabel}</Text>
   </Pressable>
  </ScrollView></View></View>
 </Modal>;
}
const s=StyleSheet.create({backdrop:{flex:1,justifyContent:'center',alignItems:'center',padding:16,backgroundColor:'rgba(34,48,62,0.5)'},card:{width:'100%',maxWidth:380,maxHeight:'90%',borderRadius:16,backgroundColor:t.colors.surface},content:{paddingHorizontal:24,paddingVertical:32,gap:24},title:{...t.heading,fontFamily:t.fonts.regular,textAlign:'center',color:t.colors.text},grid:{flexDirection:'row',flexWrap:'wrap',alignSelf:'center'},selected:{borderWidth:3,borderColor:t.colors.primary},done:{minHeight:48,padding:12,borderRadius:12,backgroundColor:t.colors.action,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center'},doneText:{fontFamily:t.fonts.medium,fontSize:16,lineHeight:24,color:t.colors.text,textAlign:'center'}});
