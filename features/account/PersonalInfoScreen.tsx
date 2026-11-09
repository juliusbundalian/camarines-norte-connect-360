import {useEffect,useState} from 'react';
import {Alert,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {ActivityIndicator} from 'react-native-paper';
import {router,useLocalSearchParams} from 'expo-router';
import {useProfile} from '../profile/ProfileProvider';
import {useProfileAction} from '../profile/useProfileAction';
import {BirthdateField} from '../profile/BirthdateField';
import {AvatarSelectionModal} from '../profile/AvatarSelectionModal';
import {localToday,parseBirthdate} from '../profile/profile-validation';
import {ProfileConflictError} from '../../services/firebase/account-profile-types';
import type {CompletedProfile} from '../profile/profile-types';
import {AccountScaffold} from './AccountScaffold';
import {GenderField} from './GenderField';
import {ChangesSavedModal} from './ChangesSavedModal';
import {longBirthdate,personalInfoDraft,samePersonalInfo,validatePersonalInfo} from './personal-info';
import {accountTokens as t} from '../../theme/account';

export function PersonalInfoScreen() {
  const account=useProfile(),action=useProfileAction();
  const {selectAvatar}=useLocalSearchParams<{selectAvatar?:string}>();
  const [baseline,setBaseline]=useState(account.profile);
  const [draft,setDraft]=useState(()=>personalInfoDraft(account.profile));
  const [picker,setPicker]=useState(selectAvatar==='1');
  const [saved,setSaved]=useState(false);
  let validated:CompletedProfile|null=null;
  try{validated=validatePersonalInfo(draft,localToday());}catch{}
  const changed=validated?(!baseline||!samePersonalInfo(validated,baseline as CompletedProfile)):
    JSON.stringify(draft)!==JSON.stringify(personalInfoDraft(baseline));
  const dirty=changed||(!baseline&&draft.avatarId!=='avatar-1');
  const canSave=!!validated&&changed&&!action.pending&&!saved;
  const iso=parseBirthdate(draft.birthdateText);
  const returnToAccount=()=>router.dismissTo('/account');
  const back=()=>{
    if(action.pending)return;
    if(!dirty){returnToAccount();return;}
    Alert.alert('Discard changes?','Your unsaved changes will be discarded.',[
      {text:'Stay',style:'cancel'},
      {text:'Discard',style:'destructive',onPress:returnToAccount},
    ]);
  };
  useEffect(()=>{if(action.error)Alert.alert('Unable to save',action.error);},[action.error]);
  const save=()=>{
    if(!canSave||!validated)return;
    const values=validated;
    void action.run(async()=>{
      try{await account.savePersonalInfo(values,baseline?.revision??null);}
      catch(error){if(error instanceof ProfileConflictError)setBaseline(error.latest);throw error;}
    }).then(success=>{if(success)setSaved(true);});
  };
  const footer=<Pressable accessibilityRole="button" accessibilityLabel="Save" accessibilityState={{disabled:!canSave,busy:action.pending}} disabled={!canSave} onPress={save} style={[s.save,!canSave&&s.disabled]}>
    {action.pending?<ActivityIndicator size={20} color={t.colors.text}/>:<Text style={s.saveText}>Save</Text>}
  </Pressable>;
  return <><AccountScaffold title="Personal Info" onBack={back} busy={action.pending} footer={footer}>
    <View style={s.group}><Text style={s.label}>Name</Text><TextInput accessibilityLabel="Name" value={draft.displayName} onChangeText={displayName=>setDraft(current=>({...current,displayName}))} editable={!action.pending} autoComplete="name" autoCapitalize="words" maxLength={200} style={s.input}/></View>
    <GenderField value={draft.gender} disabled={action.pending} onChange={gender=>setDraft(current=>({...current,gender}))}/>
    <BirthdateField value={draft.birthdateText} displayValue={iso?longBirthdate(iso):undefined} showHint={false} disabled={action.pending} onChange={birthdateText=>setDraft(current=>({...current,birthdateText}))}/>
    <View style={s.group}><Text style={s.label}>Mobile Number</Text><View style={s.phone}><Text style={s.prefix}>+63</Text><TextInput accessibilityLabel="Mobile Number (optional)" value={draft.mobileText} onChangeText={mobileText=>setDraft(current=>({...current,mobileText}))} editable={!action.pending} keyboardType="phone-pad" autoComplete="tel" maxLength={32} placeholder="123 456 7890" placeholderTextColor={t.colors.muted} style={[s.input,s.phoneInput]}/></View></View>
  </AccountScaffold>
  <AvatarSelectionModal visible={picker} value={draft.avatarId} onCancel={()=>setPicker(false)} onDone={avatarId=>{setDraft(current=>({...current,avatarId}));setPicker(false);}}/>
  <ChangesSavedModal visible={saved} onConfirm={returnToAccount}/></>;
}
const s=StyleSheet.create({
  group:{gap:4},label:{...t.fieldLabel,fontFamily:t.fonts.regular,color:t.colors.text},
  input:{...t.fieldText,minHeight:56,paddingHorizontal:16,paddingVertical:12,borderRadius:16,borderWidth:1,borderColor:t.border,fontFamily:t.fonts.regular,color:t.colors.text},
  phone:{flexDirection:'row',borderRadius:16,borderWidth:1,borderColor:t.border,overflow:'hidden'},
  prefix:{...t.fieldText,padding:16,borderRightWidth:1,borderColor:t.border,fontFamily:t.fonts.regular,color:t.colors.text},
  phoneInput:{flex:1,minWidth:0,borderWidth:0,borderRadius:0},
  save:{minHeight:48,borderRadius:12,padding:12,backgroundColor:t.actionColor,alignItems:'center',justifyContent:'center'},
  saveText:{fontFamily:'PublicSans-Medium',fontSize:16,lineHeight:24,letterSpacing:-0.85,color:t.colors.text},disabled:{opacity:0.4},
});
