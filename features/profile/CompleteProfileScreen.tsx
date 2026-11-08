import {useCallback} from 'react';
import {BackHandler,StyleSheet,Text,TextInput,View} from 'react-native';
import {router,useFocusEffect} from 'expo-router';
import {Image} from 'expo-image';
import {AuthAlert} from '../auth/AuthScaffold';
import {useProfile} from './ProfileProvider';
import {ProfileSetupScaffold} from './ProfileSetupScaffold';
import {BirthdateField} from './BirthdateField';
import {useProfileAction} from './useProfileAction';
import {localToday} from './profile-validation';
import {AVATARS} from './avatars';
import {profileTokens as t} from '../../theme/profile';
export function CompleteProfileScreen(){
 const profile=useProfile(),action=useProfileAction();
 const back=useCallback(()=>{if(!action.pending){void profile.flushDraft().catch(()=>{});router.replace('/gender');}},[action.pending,profile.flushDraft]);
 useFocusEffect(useCallback(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{back();return true;});return()=>sub.remove();},[back]));
 return <ProfileSetupScaffold step={2} title="Complete Your Profile" subtitle="Fill up the form below for us to know you better" onBack={back} busy={action.pending} actionLabel="Finish" onAction={()=>{void action.run(async()=>{await profile.finish(localToday());router.replace('/home');});}}>
  <AuthAlert message={action.error}/><View style={s.form}>
   <Image source={AVATARS.find(a=>a.id===profile.draft.avatarId)?.source} style={s.avatar} contentFit="contain" accessible={false}/>
   <View style={s.group}><Text style={s.label}>Name</Text><TextInput accessibilityLabel="Name" value={profile.draft.displayName} onChangeText={displayName=>profile.setDraft({displayName})} editable={!action.pending} maxLength={200} autoCapitalize="words" autoComplete="name" placeholder={profile.profile?.gender==='female'?'Jane Doe':'John Doe'} placeholderTextColor={t.colors.muted} style={s.input}/></View>
   <BirthdateField value={profile.draft.birthdateText} onChange={birthdateText=>profile.setDraft({birthdateText})} disabled={action.pending}/>
   <View style={s.group}><Text style={s.label}>Mobile Number <Text style={s.optional}>(optional)</Text></Text><View style={s.phone}><Text style={s.prefix}>+63</Text><TextInput accessibilityLabel="Mobile Number (optional)" value={profile.draft.mobileText} onChangeText={mobileText=>profile.setDraft({mobileText})} editable={!action.pending} keyboardType="phone-pad" autoComplete="tel" maxLength={32} placeholder="123 456 7890" placeholderTextColor={t.colors.muted} style={[s.input,s.phoneInput]}/></View></View>
   {profile.saveState==='unsaved'?<Text accessibilityLiveRegion="polite" style={s.saveStatus}>Changes haven’t been saved. Finish will try again.</Text>:null}
  </View>
 </ProfileSetupScaffold>;
}
const s=StyleSheet.create({form:{gap:16,marginTop:16},avatar:{width:128,height:128,borderRadius:64,alignSelf:'center',overflow:'hidden'},group:{gap:4},label:{...t.label,fontFamily:t.fonts.regular,color:t.colors.text},input:{...t.body,fontFamily:t.fonts.regular,color:t.colors.text,minHeight:56,borderRadius:16,borderWidth:1,borderColor:t.colors.border,paddingHorizontal:16,paddingVertical:12},optional:{color:t.colors.muted},phone:{flexDirection:'row',borderRadius:16,borderWidth:1,borderColor:t.colors.border,overflow:'hidden',alignItems:'stretch'},prefix:{...t.body,fontFamily:t.fonts.regular,color:t.colors.text,paddingHorizontal:16,paddingVertical:16,borderRightWidth:1,borderColor:t.colors.border},phoneInput:{flex:1,borderWidth:0,borderRadius:0,minWidth:0},saveStatus:{fontFamily:t.fonts.regular,fontSize:12,lineHeight:16,color:t.colors.secondary}});
