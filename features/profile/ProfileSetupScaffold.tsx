import {KeyboardAvoidingView,Keyboard,TextInput,Platform,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import type {ScrollViewInstance} from 'react-native';
import {useCallback,useContext,useEffect,useRef,type PropsWithChildren} from 'react';
import {ProfileChromeContext,ProfileChromeSync,type ProfileChromeConfig} from './ProfileChrome';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ActivityIndicator} from 'react-native-paper';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import {focusedFieldOffset} from './focus-scroll';
import {profileTokens as t} from '../../theme/profile';
export function ProfileSetupScaffold(props:PropsWithChildren<ProfileChromeConfig>){
 const {step,title,subtitle,onBack,busy,disabled,children,actionLabel,onAction}=props;
 const host=useContext(ProfileChromeContext);
 const scroll=useRef<ScrollViewInstance>(null),scrollY=useRef(0),frame=useRef<number|null>(null);
 const revealFocus=useCallback(()=>{
  if(frame.current!==null)cancelAnimationFrame(frame.current);
  frame.current=requestAnimationFrame(()=>{
   frame.current=null;if(!Keyboard.isVisible())return;
   const input=TextInput.State.currentlyFocusedInput();if(!input)return;
   input.measureInWindow((_x,y,_width,height)=>scroll.current?.measureInWindow((_sx,top,_sw,viewportHeight)=>{
    if(TextInput.State.currentlyFocusedInput()!==input||!Keyboard.isVisible())return;
    const offset=focusedFieldOffset({inputY:y,inputHeight:height,viewportY:top,viewportHeight,scrollY:scrollY.current});
    if(offset!==null)scroll.current?.scrollTo({y:offset,animated:true});
   }));
  });
 },[]);
 useEffect(()=>{const sub=Keyboard.addListener('keyboardDidShow',revealFocus);return()=>{sub.remove();if(frame.current!==null)cancelAnimationFrame(frame.current);};},[revealFocus]);
 const content=(<>
  {host?<ProfileChromeSync config={props}/>:null}
  <ScrollView ref={scroll} onLayout={revealFocus} onScroll={event=>{scrollY.current=event.nativeEvent.contentOffset.y;}} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
   <View style={s.headings}><Text accessibilityRole="header" style={s.title}>{title}</Text><Text style={s.subtitle}>{subtitle}</Text></View>
   {children}
  </ScrollView>
 </>);
 return host?content:<ProfileSetupFrame {...props}>{content}</ProfileSetupFrame>;
}
export function ProfileSetupFrame({step,onBack,busy,disabled,actionLabel,onAction,children}:PropsWithChildren<ProfileChromeConfig>){
 return <SafeAreaView edges={['top','left','right']} style={s.screen}><KeyboardAvoidingView style={s.screen} behavior={Platform.OS==='ios'?'padding':'height'}>
  <View style={s.bar}>{onBack?<Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={busy} onPress={onBack} style={s.back}><ArrowLeft size={24} color={t.colors.text}/></Pressable>:<View style={s.balance}/>}
   <View style={s.progressGroup} accessible accessibilityRole="progressbar" accessibilityLabel={`Step ${step} of 2`} accessibilityValue={{min:0,max:2,now:step}}><Text style={s.progressLabel}>{step} of 2</Text><View style={s.track}><View style={[s.progress,{width:step===1?'50%':'100%'}]}/></View></View><View style={s.balance}/>
  </View>
  {children}
  <SafeAreaView edges={['bottom']} style={s.footer}><Pressable accessibilityRole="button" accessibilityLabel={actionLabel} accessibilityState={{disabled:busy||disabled,busy}} disabled={busy||disabled} onPress={onAction} style={[s.action,(busy||disabled)&&s.disabled]}>{busy?<ActivityIndicator size={20} color={t.colors.text}/>:<Text style={s.actionText}>{actionLabel}</Text>}</Pressable></SafeAreaView>
 </KeyboardAvoidingView></SafeAreaView>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:t.colors.background},bar:{minHeight:64,paddingHorizontal:16,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:24},back:{width:48,height:48,borderRadius:12,backgroundColor:t.colors.subtle,alignItems:'center',justifyContent:'center'},balance:{width:48},progressGroup:{flex:1,gap:8},progressLabel:{fontFamily:t.fonts.medium,fontSize:14,lineHeight:20,color:t.colors.text,textAlign:'center'},track:{height:8,borderRadius:4,backgroundColor:t.colors.subtle,overflow:'hidden'},progress:{height:8,borderRadius:4,backgroundColor:t.colors.primary},content:{paddingHorizontal:16,paddingTop:20,paddingBottom:16},headings:{gap:4},title:{...t.heading,fontFamily:t.fonts.regular,textAlign:'center',color:t.colors.text},subtitle:{...t.body,fontFamily:t.fonts.regular,textAlign:'center',color:t.colors.secondary},footer:{backgroundColor:t.colors.surface,padding:16,borderTopLeftRadius:12,borderTopRightRadius:12,borderTopWidth:1,borderColor:'rgba(34,48,62,0.04)'},action:{minHeight:48,borderRadius:12,backgroundColor:t.colors.action,padding:12,justifyContent:'center',alignItems:'center'},actionText:{fontFamily:t.fonts.medium,fontSize:16,lineHeight:24,color:t.colors.text,textAlign:'center'},disabled:{opacity:0.4}});
