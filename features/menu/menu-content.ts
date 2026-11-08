import Heart from 'lucide-react-native/icons/heart';
import UserRound from 'lucide-react-native/icons/user-round';
import Bell from 'lucide-react-native/icons/bell';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import FileText from 'lucide-react-native/icons/file-text';
export const MENU_SECTIONS = [
  {key:'wishlist',rows:[{label:'My Wishlist',description:'Your saved places and properties',icon:Heart,path:'/wishlist'}]},
  {key:'settings',title:'GENERAL SETTINGS',rows:[
    {label:'Account',description:'Manage user details',icon:UserRound,path:'/account'},
    {label:'Notifications',description:'System Default',icon:Bell,path:'/notifications'},
  ]},
  {key:'about',title:'ABOUT APP',rows:[
    {label:'Privacy policy',icon:ShieldCheck,path:'/privacy-policy'},
    {label:'Terms & conditions',icon:FileText,path:'/terms'},
  ]},
] as const;
