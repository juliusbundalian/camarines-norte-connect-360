import {useCallback,useState} from 'react';
import {BackHandler,Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {router,useFocusEffect} from 'expo-router';
import Mars from 'lucide-react-native/icons/mars';
import Venus from 'lucide-react-native/icons/venus';
import {AuthAlert} from '../auth/AuthScaffold';
import {useProfile} from './ProfileProvider';
import {ProfileSetupScaffold} from './ProfileSetupScaffold';
import {useProfileAction} from './useProfileAction';
import {validateGender} from './profile-validation';
import type {Gender} from './profile-types';
import {profileTokens as t} from '../../theme/profile';
export function GenderScreen(){
 const profile=useProfile(),action=useProfileAction();
 const [gender,setGender]=useState<Gender|null>(profile.profile?.gender??null);
 const busy=action.pending;const circle=128*Math.min(1.5,Math.max(1,useWindowDimensions().fontScale));
 useFocusEffect(useCallback(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>true);return()=>sub.remove();},[]));
 return <ProfileSetupScaffold step={1} title="Tell us about yourself" subtitle="To enhance your experience, please share your gender" busy={busy} disabled={!gender} actionLabel="Next" onAction={()=>{void action.run(async()=>{const selected=validateGender(gender);await profile.saveGender(selected);router.push('/complete-profile');});}}>
  <AuthAlert message={action.error}/><View accessibilityRole="radiogroup" style={s.choices}>
   {(['male','female','other'] as const).map(value=>{const selected=gender===value;const color=selected?t.colors.selectedText:'#8592A3';const Icon=value==='male'?Mars:Venus;
    return <Pressable key={value} accessibilityRole="radio" accessibilityLabel={value==='male'?'Male':value==='female'?'Female':'Other'} accessibilityState={{selected,checked:selected,disabled:busy}} disabled={busy} onPress={()=>setGender(value)} style={[s.choice,{width:circle,minHeight:circle,borderRadius:circle/2,backgroundColor:selected?t.colors.selected:t.colors.subtle}]}>{value!=='other'?<Icon size={48} color={color} strokeWidth={2}/>:null}<Text style={[s.choiceText,{color}]}>{value==='male'?'Male':value==='female'?'Female':'Other'}</Text></Pressable>;
   })}
  </View>
 </ProfileSetupScaffold>;
}
const s=StyleSheet.create({choices:{alignItems:'center',gap:24,marginTop:64,marginBottom:48},choice:{padding:20,alignItems:'center',justifyContent:'center'},choiceText:{fontFamily:t.fonts.regular,fontSize:22,lineHeight:28,textAlign:'center'}});
