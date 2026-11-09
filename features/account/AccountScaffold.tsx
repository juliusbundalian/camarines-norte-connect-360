import {useCallback,type PropsWithChildren,type ReactNode} from 'react';
import {BackHandler,KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import {accountTokens as t} from '../../theme/account';

interface Props {title:string;onBack():void;busy?:boolean;footer?:ReactNode}
export function AccountScaffold({title,onBack,busy=false,footer,children}:PropsWithChildren<Props>) {
  useFocusEffect(useCallback(()=>{
    const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{if(!busy)onBack();return true;});
    return ()=>subscription.remove();
  },[busy,onBack]));
  return <SafeAreaView edges={['top','left','right']} style={[s.screen,{backgroundColor:t.colors.card}]}>
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={s.bar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={busy} onPress={onBack} style={s.back}><ArrowLeft size={24} color={t.colors.text}/></Pressable>
        <Text accessibilityRole="header" style={s.title}>{title}</Text>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      <SafeAreaView edges={['bottom']} style={footer?s.footer:s.bottom}>{footer}</SafeAreaView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:t.colors.background},scroll:{flex:1},
  bar:{minHeight:64,paddingHorizontal:16,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:4,backgroundColor:t.colors.card},
  back:{height:48,width:48,alignItems:'center',justifyContent:'center'},
  title:{fontFamily:t.fonts.regular,fontSize:22,lineHeight:28,color:t.colors.text,flex:1},
  content:{padding:16,gap:16,paddingBottom:24},bottom:{backgroundColor:t.colors.background},
  footer:{backgroundColor:t.colors.card,padding:16,borderTopLeftRadius:12,borderTopRightRadius:12},
});
