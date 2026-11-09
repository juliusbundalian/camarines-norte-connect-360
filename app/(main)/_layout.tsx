import {stackOptions} from '../../features/navigation/stack-options';
import {Stack} from 'expo-router';
import {MainFonts} from '../../features/navigation/MainFonts';
export const unstable_settings={anchor:'(tabs)'};
export default function MainLayout(){return <MainFonts><Stack screenOptions={stackOptions}/></MainFonts>;}
