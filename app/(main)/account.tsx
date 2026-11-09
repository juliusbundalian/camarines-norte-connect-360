import {useAuth} from '../../features/auth/AuthProvider';
import {AccountAccess} from '../../features/account/AccountAccess';
import {AccountScreen} from '../../features/account/AccountScreen';
export default function AccountPage(){
  const {user}=useAuth();
  return <AccountAccess><AccountScreen key={user?.uid}/></AccountAccess>;
}
