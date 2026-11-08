import {Pressable,StyleSheet,Text,View} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import {menuTokens as t} from '../../theme/menu';
export function MenuRow({label,description,icon:Icon,tone='default',disabled=false,onPress}:{label:string;description?:string;icon:LucideIcon;tone?:'default'|'danger';disabled?:boolean;onPress():void}) {
  const danger=tone==='danger';
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={description} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[styles.row,disabled&&styles.disabled]}>
    <View style={styles.iconSlot}><View style={[styles.iconTile,!danger&&styles.greenTile]}><Icon size={t.size.icon} color={danger?t.colors.danger:t.colors.primary}/></View></View>
    <View style={styles.copy}><Text style={[styles.title,danger&&styles.danger]}>{label}</Text>{description?<Text style={styles.description}>{description}</Text>:null}</View>
    {!danger?<View style={styles.iconSlot}><ChevronRight size={t.size.icon} color={t.colors.text}/></View>:null}
  </Pressable>;
}
const styles=StyleSheet.create({
  row:{flexDirection:'row',alignItems:'center',minHeight:t.size.row,padding:t.space.rowPadding,gap:t.space.rowGap,borderRadius:12},
  iconSlot:{width:t.size.iconSlot,minHeight:t.size.iconSlot,alignItems:'center',justifyContent:'center'},
  iconTile:{width:t.size.iconTile,height:t.size.iconTile,alignItems:'center',justifyContent:'center',borderRadius:12},
  greenTile:{backgroundColor:t.colors.tile},copy:{flex:1},title:{...t.type.title,fontFamily:t.fonts.medium,color:t.colors.text},description:{...t.type.body,fontFamily:t.fonts.regular,color:t.colors.secondary},danger:{color:t.colors.danger},disabled:{opacity:0.4},
});
