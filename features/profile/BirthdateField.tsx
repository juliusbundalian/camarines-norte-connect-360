import {Pressable,StyleSheet,Text,View} from 'react-native';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import {parseBirthdate} from './profile-validation';
import {profileTokens as t} from '../../theme/profile';
export function BirthdateField({value,onChange,disabled=false,displayValue,showHint=true}:{value:string;onChange(text:string):void;disabled?:boolean;displayValue?:string;showHint?:boolean}){
 const open=()=>{
  const iso=parseBirthdate(value);const initial=new Date(2000,0,1);
  if(iso)initial.setFullYear(Number(iso.slice(0,4)),Number(iso.slice(5,7))-1,Number(iso.slice(8,10)));
  const minimum=new Date(2000,0,1);minimum.setFullYear(1,0,1);
  DateTimePickerAndroid.open({value:initial,mode:'date',minimumDate:minimum,maximumDate:new Date(),onDismiss:()=>{},onValueChange:(_event,date)=>{onChange(`${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}/${String(date.getFullYear()).padStart(4,'0')}`);}});
 };
 return <View style={s.group}><Text style={s.label}>Birthdate</Text><Pressable accessibilityRole="button" accessibilityLabel="Birthdate" accessibilityValue={{text:value||'Not selected'}} disabled={disabled} onPress={open} style={s.field}><Text style={[s.value,!value&&s.placeholder]}>{displayValue??(value||'MM/DD/YYYY')}</Text><CalendarDays size={24} color={t.colors.secondary}/></Pressable>{showHint?<Text style={s.hint}>MM/DD/YYYY</Text>:null}</View>;
}
const s=StyleSheet.create({group:{gap:4},label:{...t.label,fontFamily:t.fonts.regular,color:t.colors.text},field:{minHeight:56,borderRadius:16,borderWidth:1,borderColor:t.colors.border,paddingHorizontal:16,paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},value:{...t.body,fontFamily:t.fonts.regular,color:t.colors.text,flex:1},placeholder:{color:t.colors.muted},hint:{fontFamily:t.fonts.regular,fontSize:12,lineHeight:16,color:t.colors.secondary,marginHorizontal:16}});
