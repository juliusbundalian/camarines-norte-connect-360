import {Redirect} from 'expo-router';
import {useAuth} from '../../features/auth/AuthProvider';
import {PlaceholderScreen} from '../../features/navigation/PlaceholderScreen';

export default function WishlistPage() {
  const {ready,user}=useAuth();
  if(!ready)return null;
  if(!user)return <Redirect href={{pathname:'/login',params:{returnTo:'/wishlist'}}}/>;
  return <PlaceholderScreen title="My Wishlist" back/>;
}
