import {useEffect,useRef,useState} from "react";
import {LogoutConfirmation} from "./LogoutConfirmation";
import {ScrollView,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Image} from 'expo-image';
import Constants from 'expo-constants';
import {router} from 'expo-router';
import LogOut from 'lucide-react-native/icons/log-out';
import {useProfile} from '../profile/ProfileProvider';
import {useAuth} from '../auth/AuthProvider';
import {useAsyncAction} from '../auth/useAsyncAction';
import {MenuHeader} from './MenuHeader';
import {MenuRow} from './MenuRow';
import {MENU_SECTIONS} from './menu-content';
import {menuTokens as t} from '../../theme/menu';
export default function MenuScreen(){
  const auth=useAuth();
  const profile=useProfile();
  const identity=profile.uid===auth.user?.uid&&profile.phase==='complete'?profile.profile:null;
  const [confirming,setConfirming]=useState(false);
  const confirmingRef=useRef(false);
  useEffect(()=>{if(!auth.user){confirmingRef.current=false;setConfirming(false);}},[auth.user]);
  const cancelLogout=()=>{confirmingRef.current=false;setConfirming(false);};
  const action=useAsyncAction();
  const pending=auth.logoutPending||action.pending;
  const openAuth=(pathname:'/login'|'/register')=>router.push({pathname,params:{returnTo:'/menu'}});
  const version=Constants.expoConfig?.version;
  const build=Constants.expoConfig?.android?.versionCode;
  return <SafeAreaView edges={['top','left','right']} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <MenuHeader displayName={identity?.displayName??undefined} avatarId={identity?.avatarId} signedIn={!!auth.user} pending={pending} onLogin={()=>openAuth('/login')} onRegister={()=>openAuth('/register')} onAccount={()=>router.push('/account')}/>
      {MENU_SECTIONS.map(section=><View key={section.key} style={styles.card}>
        {'title' in section?<Text style={styles.section}>{section.title}</Text>:null}
        {section.rows.map(row=><MenuRow key={row.path} label={row.label} description={'description' in row?row.description:undefined} icon={row.icon} disabled={pending} onPress={()=>router.push(row.path)}/>)}
      </View>)}
      {auth.user?<View style={styles.card}><MenuRow label="Logout" icon={LogOut} tone="danger" disabled={pending} onPress={()=>{if(!pending){confirmingRef.current=true;setConfirming(true);}}}/></View>:null}
      <View style={styles.footer}>
        <Image source={require('../../assets/splash-logo.png')} style={styles.logo} contentFit="contain" accessible={false}/>
        {version?<Text style={styles.version}>version {version}{build==null?'':` (${build})`}</Text>:null}
      </View>
    </ScrollView>
    <LogoutConfirmation visible={confirming && !!auth.user} onCancel={cancelLogout} onConfirm={()=>{
      if(!confirmingRef.current || pending || !auth.user)return;
      cancelLogout();
      void action.run(auth.logout);
    }}/>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:t.colors.background},content:{padding:t.space.card,gap:t.space.card,paddingBottom:24},
  card:{backgroundColor:t.colors.card,padding:t.space.cardPadding,borderRadius:t.size.cardRadius},
  section:{...t.type.section,fontFamily:t.fonts.medium,color:t.colors.secondary,marginHorizontal:t.space.sectionLabelInset,marginTop:8},
  footer:{alignItems:'center',gap:8,marginTop:8,paddingBottom:16},logo:{width:t.size.logo,height:t.size.logo},
  version:{...t.type.version,fontFamily:t.fonts.regular,color:t.colors.muted},
});
