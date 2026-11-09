import {useEffect,useState} from 'react';
import {Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import {router} from 'expo-router';
import UserRound from 'lucide-react-native/icons/user-round';
import Venus from 'lucide-react-native/icons/venus';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Phone from 'lucide-react-native/icons/phone';
import Mail from 'lucide-react-native/icons/mail';
import Pencil from 'lucide-react-native/icons/pencil';
import type {LucideIcon} from 'lucide-react-native';
import {useAuth} from '../auth/AuthProvider';
import {useProfile} from '../profile/ProfileProvider';
import {ProfileAvatar} from '../profile/ProfileAvatar';
import {AvatarSelectionModal} from '../profile/AvatarSelectionModal';
import {useProfileAction} from '../profile/useProfileAction';
import {AccountScaffold} from './AccountScaffold';
import {longBirthdate} from './personal-info';
import {accountTokens as t} from '../../theme/account';

function InfoRow({label,value,icon:Icon}:{label:string;value:string;icon:LucideIcon}) {
  return <View style={s.row}><View style={s.tile}><Icon size={24} color={t.colors.primary}/></View>
    <View style={s.copy}><Text style={s.value}>{value}</Text><Text style={s.label}>{label}</Text></View>
  </View>;
}
export function AccountScreen() {
  const auth=useAuth(),account=useProfile(),action=useProfileAction();
  const [picker,setPicker]=useState(false);
  const profile=account.profile;
  useEffect(()=>{if(action.error)Alert.alert('Unable to save',action.error);},[action.error]);
  const editAvatar=()=>{
    if(profile)setPicker(true);
    else router.push({pathname:'/personal-info',params:{selectAvatar:'1'}});
  };
  const back=()=>router.canGoBack()?router.back():router.dismissTo('/menu');
  return <AccountScaffold title="Account" onBack={back} busy={action.pending}>
    <View style={s.avatar}>
      <ProfileAvatar id={profile?.avatarId??'avatar-1'} size={t.avatarSize}/>
      <Pressable accessibilityRole="button" accessibilityLabel="Edit avatar" onPress={editAvatar} disabled={action.pending} style={s.editAvatar}><Pencil size={20} color="#FFFFFF"/></Pressable>
    </View>
    {account.accountError?<View style={s.card}><Text style={s.label}>{account.accountError}</Text><Pressable accessibilityRole="button" onPress={()=>{void account.refreshAccount().catch(()=>{});}}><Text style={s.value}>Retry</Text></Pressable></View>:null}
    <View style={s.card}>
      <View style={s.cardHeader}><Text style={s.section}>PERSONAL INFO</Text><Pressable accessibilityRole="button" accessibilityLabel="Edit personal info" disabled={action.pending||!!account.accountError} onPress={()=>router.push('/personal-info')} style={s.edit}><Pencil size={20} color={t.colors.text}/></Pressable></View>
      <InfoRow label="Name" value={profile?.displayName??'Not provided'} icon={UserRound}/>
      <InfoRow label="Gender" value={profile?.gender?profile.gender[0]!.toUpperCase()+profile.gender.slice(1):'Not provided'} icon={Venus}/>
      <InfoRow label="Birthdate" value={profile?.birthdate?longBirthdate(profile.birthdate):'Not provided'} icon={CalendarDays}/>
      <InfoRow label="Phone Number" value={profile?.mobileNumber??'Not provided'} icon={Phone}/>
    </View>
    <View style={s.card}>
      <Text style={[s.section,s.accountHeading]}>ACCOUNT INFO</Text>
      <InfoRow label="Email" value={auth.user?.email??'Not provided'} icon={Mail}/>
    </View>
    <AvatarSelectionModal visible={picker} value={profile?.avatarId??'avatar-1'} busy={action.pending} onCancel={()=>setPicker(false)} onDone={id=>{void action.run(()=>account.saveAccountAvatar(id)).then(saved=>{if(saved)setPicker(false);});}}/>
  </AccountScaffold>;
}
const s=StyleSheet.create({
  avatar:{width:128,height:128,alignSelf:'center'},
  editAvatar:{position:'absolute',right:-4,bottom:-4,width:40,height:40,borderRadius:12,borderWidth:4,borderColor:t.colors.background,backgroundColor:t.colors.primary,alignItems:'center',justifyContent:'center'},
  card:{padding:4,borderRadius:16,backgroundColor:t.colors.card},
  cardHeader:{minHeight:28,paddingLeft:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  section:{...t.type.section,fontFamily:t.fonts.medium,color:t.colors.secondary},accountHeading:{paddingHorizontal:12,paddingTop:8},
  edit:{minHeight:32,minWidth:40,alignItems:'center',justifyContent:'center'},
  row:{minHeight:56,padding:8,flexDirection:'row',gap:14,alignItems:'center'},
  tile:{width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:t.colors.tile},
  copy:{flex:1},value:{...t.type.title,fontFamily:t.fonts.medium,color:t.colors.text},label:{...t.type.body,fontFamily:t.fonts.regular,color:t.colors.secondary},
});
