import {render,screen,fireEvent,act} from '@testing-library/react-native';
import {PaperProvider} from 'react-native-paper';
import {router} from 'expo-router';
import {useAuth} from '../../auth/AuthProvider';
import MenuScreen from '../MenuScreen';
jest.mock('../../auth/AuthProvider',()=>({useAuth:jest.fn()}));
jest.mock('expo-router',()=>({router:{push:jest.fn()}}));
jest.mock('expo-constants',()=>({__esModule:true,default:{expoConfig:{version:'2.3.4',android:{versionCode:7}}}}));
const logout=jest.fn();
function auth(signedIn=false) {
  jest.mocked(useAuth).mockReturnValue({user:signedIn?{uid:'test',email:'person@example.com',phoneNumber:null}:null,ready:true,error:null,logoutError:null,logoutPending:false,login:jest.fn(),register:jest.fn(),requestPasswordReset:jest.fn(),logout,retry:jest.fn()});
}
const show=()=>render(<PaperProvider><MenuScreen/></PaperProvider>);
beforeEach(()=>{auth();logout.mockReset().mockResolvedValue(undefined);});
test('guest Menu exposes separate auth links and no Logout',async()=>{
  await show();
  expect(screen.getByText('Hello, Guest')).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Logout'})).toBeNull();
  await fireEvent.press(screen.getByRole('button',{name:'Login'}));
  expect(router.push).toHaveBeenCalledWith({pathname:'/login',params:{returnTo:'/menu'}});
  await fireEvent.press(screen.getByRole('button',{name:'Sign up'}));
  expect(router.push).toHaveBeenCalledWith({pathname:'/register',params:{returnTo:'/menu'}});
});
test.each([['My Wishlist','/wishlist'],['Account','/account'],['Notifications','/notifications'],['Privacy policy','/privacy-policy'],['Terms & conditions','/terms']])('Menu row %s opens its destination',async(label,path)=>{
  await show();await fireEvent.press(screen.getByRole('button',{name:label}));
  expect(router.push).toHaveBeenCalledWith(path);
});
test('shows actual version metadata without fake personal values',async()=>{
  await show();expect(screen.getByText('version 2.3.4 (7)')).toBeTruthy();
  expect(screen.queryByText('Jane Doe')).toBeNull();
  expect(screen.queryByText(/12345/)).toBeNull();
  expect(screen.getByText('Your saved places and properties')).toBeTruthy();
});
test('observed identity controls the header and Logout; signing out reveals guest menu',async()=>{
  const view=await show();auth(true);await view.rerender(<PaperProvider><MenuScreen/></PaperProvider>);
  expect(screen.getByText('Hello, User')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button',{name:'Update personal info'}));
  expect(router.push).toHaveBeenCalledWith('/account');
  expect(screen.getByRole('button',{name:'Logout'})).toBeTruthy();
  auth();await view.rerender(<PaperProvider><MenuScreen/></PaperProvider>);
  expect(screen.getByText('Hello, Guest')).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Logout'})).toBeNull();
});
test('pending Logout locks controls and prevents duplicate requests',async()=>{
  auth(true);let finish!:()=>void;logout.mockReturnValue(new Promise<void>(resolve=>{finish=resolve;}));
  await show();const button=screen.getByRole('button',{name:'Logout'});
  await fireEvent.press(button);await fireEvent.press(button);
  expect(logout).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button',{name:'Account'})).toBeDisabled();
  await act(()=>finish());
});
