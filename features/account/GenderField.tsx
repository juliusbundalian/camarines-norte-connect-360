import {useState} from 'react';
import {Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import type {Gender} from '../profile/profile-types';
import {accountTokens as t} from '../../theme/account';
const choices:ReadonlyArray<{value:Gender;label:string}>=[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}];
export function GenderField({value,onChange,disabled=false}:{value:Gender|null;onChange(value:Gender):void;disabled?:boolean}) {
  const [open,setOpen]=useState(false);
  return <View style={s.group}><Text style={s.label}>Gender</Text>
    <Pressable accessibilityRole="combobox" accessibilityLabel="Gender" accessibilityValue={{text:value??'Not selected'}} accessibilityState={{expanded:open,disabled}} disabled={disabled} onPress={()=>setOpen(true)} style={s.field}>
      <Text style={s.text}>{choices.find(choice=>choice.value===value)?.label??'Select gender'}</Text><ChevronDown size={24} color={t.colors.secondary}/>
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
      <View style={s.overlay}><Pressable accessible={false} onPress={()=>setOpen(false)} style={StyleSheet.absoluteFill}/>
        <View style={s.card} accessibilityViewIsModal><ScrollView>
          <Text accessibilityRole="header" style={[s.text,s.heading]}>Gender</Text>
          {choices.map(choice=><Pressable key={choice.value} accessibilityRole="radio" accessibilityLabel={choice.label} accessibilityState={{checked:choice.value===value}} onPress={()=>{onChange(choice.value);setOpen(false);}} style={s.choice}><Text style={s.text}>{choice.label}</Text></Pressable>)}
        </ScrollView></View>
      </View>
    </Modal>
  </View>;
}
const s=StyleSheet.create({
  group:{gap:4},label:{...t.fieldLabel,fontFamily:t.fonts.regular,color:t.colors.text},
  field:{minHeight:56,borderRadius:16,borderWidth:1,borderColor:t.border,paddingHorizontal:16,paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  text:{...t.fieldText,fontFamily:t.fonts.regular,color:t.colors.text},
  overlay:{flex:1,justifyContent:'center',padding:24,backgroundColor:'rgba(34,48,62,0.5)'},
  card:{backgroundColor:t.colors.card,borderRadius:16,padding:16,maxHeight:'80%',maxWidth:380,width:'100%',alignSelf:'center'},
  heading:{fontFamily:t.fonts.medium,padding:12},choice:{minHeight:48,padding:12},
});
