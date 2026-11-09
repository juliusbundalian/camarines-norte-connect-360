import {useCallback,useState} from 'react';
import {BackHandler,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {router,useFocusEffect} from 'expo-router';
import Pencil from 'lucide-react-native/icons/pencil';
import {ProfileAvatar} from './ProfileAvatar';
import {AvatarSelectionModal} from './AvatarSelectionModal';
import {AuthAlert} from '../auth/AuthScaffold';
import {useProfile} from './ProfileProvider';
import {ProfileSetupScaffold} from './ProfileSetupScaffold';
import {BirthdateField} from './BirthdateField';
import {useProfileAction} from './useProfileAction';
import {validateProfile,localToday} from './profile-validation';
import {profileTokens as t} from '../../theme/profile';
export function CompleteProfileScreen(){
 const profile=useProfile(),action=useProfileAction();
 const [selecting,setSelecting]=useState(false);
 let valid=false;try{validateProfile(profile.profile?.gender??null,profile.draft,localToday());valid=true;}catch{}

 const back=useCallback(()=>{if(!action.pending){void profile.flushDraft().catch(()=>{});router.dismissTo('/gender');}},[action.pending,profile.flushDraft]);
 useFocusEffect(useCallback(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{back();return true;});return()=>sub.remove();},[back]));
 return <><ProfileSetupScaffold step={2} title="Complete Your Profile" subtitle="Fill up the form below for us to know you better" onBack={back} busy={action.pending} disabled={!valid} actionLabel="Finish" onAction={()=>{void action.run(async()=>{await profile.finish(localToday());router.replace('/home');});}}>
  <AuthAlert message={action.error}/><View style={s.form}>
   <View style={s.avatar}><ProfileAvatar id={profile.draft.avatarId} size={128}/><Pressable accessibilityRole="button" accessibilityLabel="Change avatar" disabled={action.pending} onPress={()=>setSelecting(true)} style={s.editTarget}><View style={s.edit}><Pencil size={20} color="white"/></View></Pressable></View>
   <View style={s.group}><Text style={s.label}>Name</Text><TextInput accessibilityLabel="Name" value={profile.draft.displayName} onChangeText={displayName=>profile.setDraft({displayName})} editable={!action.pending} maxLength={200} autoCapitalize="words" autoComplete="name" placeholder={profile.profile?.gender==='female'?'Jane Doe':'John Doe'} placeholderTextColor={t.colors.muted} style={s.input}/></View>
   <BirthdateField value={profile.draft.birthdateText} onChange={birthdateText=>profile.setDraft({birthdateText})} disabled={action.pending}/>
   <View style={s.group}><Text style={s.label}>Mobile Number <Text style={s.optional}>(optional)</Text></Text><View style={s.phone}><Text style={s.prefix}>+63</Text><TextInput accessibilityLabel="Mobile Number (optional)" value={profile.draft.mobileText} onChangeText={mobileText=>profile.setDraft({mobileText})} editable={!action.pending} keyboardType="phone-pad" autoComplete="tel" maxLength={32} placeholder="123 456 7890" placeholderTextColor={t.colors.muted} style={[s.input,s.phoneInput]}/></View></View>
   {profile.saveState==='unsaved'?<Text accessibilityLiveRegion="polite" style={s.saveStatus}>Changes haven’t been saved. Finish will try again.</Text>:null}
  </View>
 </ProfileSetupScaffold><AvatarSelectionModal visible={selecting} value={profile.draft.avatarId} onCancel={()=>setSelecting(false)} onDone={id=>{setSelecting(false);void action.run(()=>profile.applyAvatar(id));}}/></>;
}
const s=StyleSheet.create({form:{gap:16,marginTop:16},avatar:{width:128,height:128,alignSelf:'center'},editTarget:{position:'absolute',right:-8,bottom:-8,width:48,height:48,alignItems:'center',justifyContent:'center'},edit:{width:40,height:40,borderRadius:12,borderWidth:4,borderColor:t.colors.background,backgroundColor:t.colors.primary,alignItems:'center',justifyContent:'center'},group:{gap:4},label:{...t.label,fontFamily:t.fonts.regular,color:t.colors.text},input:{...t.body,fontFamily:t.fonts.regular,color:t.colors.text,minHeight:56,borderRadius:16,borderWidth:1,borderColor:t.colors.border,paddingHorizontal:16,paddingVertical:12},optional:{color:t.colors.muted},phone:{flexDirection:'row',borderRadius:16,borderWidth:1,borderColor:t.colors.border,overflow:'hidden',alignItems:'stretch'},prefix:{...t.body,fontFamily:t.fonts.regular,color:t.colors.text,paddingHorizontal:16,paddingVertical:16,borderRightWidth:1,borderColor:t.colors.border},phoneInput:{flex:1,borderWidth:0,borderRadius:0,minWidth:0},saveStatus:{fontFamily:t.fonts.regular,fontSize:12,lineHeight:16,color:t.colors.secondary}});
