import {useState, type PropsWithChildren} from 'react';
import {useFonts} from 'expo-font';
import {ActivityIndicator} from 'react-native-paper';
import {View} from 'react-native';
import {StartupError} from '../../components/StartupError';
export function MainFonts({children}:PropsWithChildren) {
  const [attempt, setAttempt] = useState(0);
  return <FontAttempt key={attempt} retry={() => setAttempt(n => n + 1)}>{children}</FontAttempt>;
}
function FontAttempt({children,retry}:PropsWithChildren<{retry():void}>) {
  const [loaded,error] = useFonts({
    'Poppins-Regular':require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium':require('../../assets/fonts/Poppins-Medium.ttf'),
  });
  if(error) return <StartupError message="Could not load application fonts. Please retry." retry={retry}/>;
  if(!loaded) return <View style={{flex:1, alignItems:'center',justifyContent:'center', backgroundColor:'#F5F5F9'}}><ActivityIndicator accessibilityLabel="Loading application fonts"/></View>;
  return children;
}
