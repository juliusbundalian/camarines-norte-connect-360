import {Image} from 'expo-image';
import {View} from 'react-native';
import type {AvatarId} from './profile-types';
import {AVATARS} from './avatars';
export function ProfileAvatar({id,size}:{id:AvatarId;size:number}){return <View style={{width:size,height:size,borderRadius:size/2,overflow:'hidden'}} accessible={false}><Image source={AVATARS.find(a=>a.id===id)?.source} contentFit="contain" style={{width:size,height:size}} accessible={false}/></View>;}
