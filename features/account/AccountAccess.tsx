import type {PropsWithChildren} from 'react';
import {ActivityIndicator} from 'react-native-paper';
import {Redirect} from 'expo-router';
import {useAuth} from '../auth/AuthProvider';
import {useProfile} from '../profile/ProfileProvider';
export function AccountAccess({children}:PropsWithChildren) {
  const auth=useAuth();
  const profile=useProfile();
  if(!auth.ready)return <ActivityIndicator accessibilityLabel="Loading account"/>;
  if(!auth.user)return <Redirect href={{pathname:'/login',params:{returnTo:'/account'}}}/>;
  if(profile.phase==='required')return <Redirect href={profile.step==='gender'?'/gender':'/complete-profile'}/>;
  if(profile.phase==='loading'||(profile.accountLoading&&!profile.profile))return <ActivityIndicator accessibilityLabel="Loading account"/>;
  return children;
}
