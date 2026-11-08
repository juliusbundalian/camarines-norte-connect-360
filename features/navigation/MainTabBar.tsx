import type {BottomTabBarProps} from 'expo-router/js-tabs';
import {Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {MAIN_TABS} from './routes';
export function MainTabBar({state,emitter,navigateToTab,insets}:BottomTabBarProps) {
  const {width,fontScale}=useWindowDimensions();
  const compact=width<375 || fontScale>1;
  return <View style={[styles.bar,{paddingBottom:insets.bottom, paddingLeft:insets.left,paddingRight:insets.right}]}>
    {MAIN_TABS.map(({key,label,icon:Icon}) => {
      const route = state.routes.find(route => route.name === key);
      if(!route) return null;
      const selected = state.routes[state.index]?.key === route.key;
      const color = selected ? '#39B54A':'rgba(34,48,62,0.7)';
      return <Pressable key={key} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{selected}}
        onPress={() => {
          const event=emitter.emit({type:'tabPress',target:route.key,canPreventDefault:true});
          if(!event.defaultPrevented) navigateToTab(route.key);
        }}
        onLongPress={() => emitter.emit({type:'tabLongPress',target:route.key})}
        style={styles.item}>
        <Icon size={24} color={color}/><Text textBreakStrategy="balanced" style={[styles.label,{color,width:compact?'100%':'116%'}]}>{label}</Text>
      </Pressable>;
    })}
  </View>;
}
const styles=StyleSheet.create({
  bar:{flexDirection:'row',backgroundColor:'#FFFFFF',borderTopLeftRadius:12,borderTopRightRadius:12},
  item:{flex:1,minHeight:64,paddingTop:8,paddingBottom:8,alignItems:'center',justifyContent:'center',gap:4},
  label:{fontFamily:'Poppins-Medium',fontSize:14,lineHeight:20,letterSpacing:0.1,textAlign:'center'},
});
