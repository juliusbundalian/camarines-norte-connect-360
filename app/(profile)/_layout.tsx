import {useState} from 'react';
import {Stack} from 'expo-router';
import {MainFonts} from '../../features/navigation/MainFonts';
import {ProfileSetupFrame} from '../../features/profile/ProfileSetupScaffold';
import {ProfileChromeContext,type ProfileChromeConfig} from '../../features/profile/ProfileChrome';
import {profileTokens} from '../../theme/profile';
import {stackOptions} from '../../features/navigation/stack-options';
export default function ProfileLayout(){
 const [chrome,setChrome]=useState<ProfileChromeConfig>({step:1,title:'',subtitle:'',busy:true,disabled:true,actionLabel:'Next',onAction:()=>{}});
 return <MainFonts><ProfileChromeContext.Provider value={setChrome}><ProfileSetupFrame {...chrome}><Stack screenOptions={{...stackOptions,contentStyle:{backgroundColor:profileTokens.colors.background}}}/></ProfileSetupFrame></ProfileChromeContext.Provider></MainFonts>;
}
