import {ScrollView,StyleSheet,Text,View,Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import {APP_NAME} from '../../constants/app';
export function PlaceholderScreen({title,description,back=false}:{title:string;description?:string;back?:boolean}) {
  return <SafeAreaView style={styles.screen} edges={back?['top','left','right','bottom']:['top','left','right']}>
    <ScrollView contentContainerStyle={styles.content}>
      {back?<Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.canGoBack()?router.back():router.dismissTo('/menu')} style={styles.back}><ArrowLeft color="#22303E" size={24}/></Pressable>:null}
      <View style={styles.copy}>
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        <Text style={styles.body}>{description ?? `${title} is coming soon to ${APP_NAME}.`}</Text>
        <Text style={styles.body}>Serving Daet, Camarines Norte.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:'#F5F5F9'},content:{flexGrow:1,padding:16,gap:24},copy:{flex:1,justifyContent:'center',gap:16},back:{minHeight:48,minWidth:48,alignSelf:'flex-start',alignItems:'center',justifyContent:'center'},brand:{fontFamily:'Poppins-Medium',color:'#39B54A',fontSize:16,lineHeight:24},title:{fontFamily:'Poppins-Medium',fontSize:24,lineHeight:32,color:'rgba(34,48,62,0.9)'},body:{fontFamily:'Poppins-Regular',fontSize:16,lineHeight:24,color:'rgba(34,48,62,0.7)'}});
