import House from 'lucide-react-native/icons/house';
import MapPin from 'lucide-react-native/icons/map-pin';
import Building2 from 'lucide-react-native/icons/building';
import Users from 'lucide-react-native/icons/users';
import Menu from 'lucide-react-native/icons/menu';
export const MAIN_TABS = [
  {key:'home', label:'Home', icon:House},
  {key:'explore', label:'Explore', icon:MapPin},
  {key:'properties', label:'Properties', icon:Building2},
  {key:'community', label:'Community', icon:Users},
  {key:'menu', label:'Menu', icon:Menu},
] as const;
export type MainTabKey = (typeof MAIN_TABS)[number]['key'];
