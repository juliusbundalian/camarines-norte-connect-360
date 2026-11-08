import {Tabs} from 'expo-router/js-tabs';
import {MAIN_TABS} from '../../../features/navigation/routes';
import {MainTabBar} from '../../../features/navigation/MainTabBar';
export const unstable_settings={anchor:'home'};
export default function MainTabs(){return <Tabs backBehavior="initialRoute" screenOptions={{headerShown:false}} tabBar={props=><MainTabBar {...props}/>}>
  {MAIN_TABS.map(({key,label})=><Tabs.Screen key={key} name={key} options={{title:label}}/>)}
</Tabs>;}
