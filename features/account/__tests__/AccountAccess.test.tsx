import {render,screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {AccountAccess} from '../AccountAccess';
import {useAuth} from '../../auth/AuthProvider';
import {useProfile} from '../../profile/ProfileProvider';
import {Redirect} from 'expo-router';
jest.mock('../../auth/AuthProvider',()=>({useAuth:jest.fn()}));
jest.mock('../../profile/ProfileProvider',()=>({useProfile:jest.fn()}));
jest.mock('expo-router',()=>({Redirect:jest.fn(()=>null)}));
test('guests enter login with Account as the safe return target',async()=>{
 jest.mocked(useAuth).mockReturnValue({user:null,ready:true} as any);
 jest.mocked(useProfile).mockReturnValue({phase:'guest'} as any);
 await render(<AccountAccess><Text>Private details</Text></AccountAccess>);
 expect(Redirect).toHaveBeenCalledWith(expect.objectContaining({href:{pathname:'/login',params:{returnTo:'/account'}}}),undefined);
 expect(screen.queryByText('Private details')).toBeNull();
});
test('a loaded legacy account can view its empty personal information',async()=>{
 jest.mocked(useAuth).mockReturnValue({user:{uid:'legacy'},ready:true} as any);
 jest.mocked(useProfile).mockReturnValue({phase:'legacy',accountLoading:false} as any);
 await render(<AccountAccess><Text>Private details</Text></AccountAccess>);
 expect(screen.getByText('Private details')).toBeTruthy();
});
