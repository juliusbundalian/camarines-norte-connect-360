import {KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import type {PropsWithChildren} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ActivityIndicator} from 'react-native-paper';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import {profileTokens as t} from '../../theme/profile';
export function ProfileSetupScaffold({step,title,subtitle,onBack,busy,children,actionLabel,onAction}:PropsWithChildren<{step:1|2;title:string;subtitle:string;onBack():void;busy:boolean;actionLabel:string;onAction():void}>){
 return <SafeAreaView edges={['top','left','right']} style={s.screen}><KeyboardAvoidingView style={s.screen} behavior={Platform.OS==='ios'?'padding':undefined}>
  <View style={s.bar}><Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={busy} onPress={onBack} style={s.back}><ArrowLeft size={24} color={t.colors.text}/></Pressable>
   <View style={s.progressGroup} accessible accessibilityRole="progressbar" accessibilityLabel={`Step ${step} of 2`} accessibilityValue={{min:0,max:2,now:step}}><Text style={s.progressLabel}>{step} of 2</Text><View style={s.track}><View style={[s.progress,{width:step===1?'50%':'100%'}]}/></View></View><View style={s.balance}/>
  </View>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
   <View style={s.headings}><Text accessibilityRole="header" style={s.title}>{title}</Text><Text style={s.subtitle}>{subtitle}</Text></View>
   {children}
  </ScrollView>
  <SafeAreaView edges={['bottom']} style={s.footer}><Pressable accessibilityRole="button" accessibilityLabel={actionLabel} accessibilityState={{disabled:busy,busy}} disabled={busy} onPress={onAction} style={[s.action,busy&&s.disabled]}>{busy?<ActivityIndicator size={20} color={t.colors.text}/>:<Text style={s.actionText}>{actionLabel}</Text>}</Pressable></SafeAreaView>
 </KeyboardAvoidingView></SafeAreaView>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:t.colors.background},bar:{minHeight:64,paddingHorizontal:16,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:24},back:{width:48,height:48,borderRadius:12,backgroundColor:t.colors.subtle,alignItems:'center',justifyContent:'center'},balance:{width:48},progressGroup:{flex:1,gap:8},progressLabel:{fontFamily:t.fonts.medium,fontSize:14,lineHeight:20,color:t.colors.text,textAlign:'center'},track:{height:8,borderRadius:4,backgroundColor:t.colors.subtle,overflow:'hidden'},progress:{height:8,borderRadius:4,backgroundColor:t.colors.primary},content:{paddingHorizontal:16,paddingTop:20,paddingBottom:16},headings:{gap:4},title:{...t.heading,fontFamily:t.fonts.regular,textAlign:'center',color:t.colors.text},subtitle:{...t.body,fontFamily:t.fonts.regular,textAlign:'center',color:t.colors.secondary},footer:{backgroundColor:t.colors.surface,padding:16,borderTopLeftRadius:12,borderTopRightRadius:12,borderTopWidth:1,borderColor:'rgba(34,48,62,0.04)'},action:{minHeight:48,borderRadius:12,backgroundColor:t.colors.action,padding:12,justifyContent:'center',alignItems:'center'},actionText:{fontFamily:t.fonts.medium,fontSize:16,lineHeight:24,color:t.colors.text,textAlign:'center'},disabled:{opacity:0.4}});
