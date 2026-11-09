import {useAuth} from '../../features/auth/AuthProvider';
import {AccountAccess} from '../../features/account/AccountAccess';
import {PersonalInfoScreen} from '../../features/account/PersonalInfoScreen';
export default function PersonalInfoPage(){
  const {user}=useAuth();
  return <AccountAccess><PersonalInfoScreen key={user?.uid}/></AccountAccess>;
}
