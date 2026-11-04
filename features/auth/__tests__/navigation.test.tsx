import {Text} from 'react-native';
import {renderRouter,screen,act,waitFor,fireEvent} from 'expo-router/testing-library';
import {router} from 'expo-router';
import type {User} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Splash from 'expo-splash-screen';
import {getAuthService} from '../../../services/firebase/auth-service';
import RootLayout from '../../../app/_layout';
import Index from '../../../app/index';
import AuthLayout from '../../../app/(auth)/_layout';
import AppLayout from '../../../app/(app)/_layout';
import {useOnboarding} from '../../onboarding/OnboardingProvider';
import {Button} from 'react-native-paper';
jest.mock('../../../services/firebase/auth-service',()=>({getAuthService:jest.fn()}));
jest.mock('expo-splash-screen',()=>({preventAutoHideAsync:jest.fn().mockResolvedValue(undefined),hideAsync:jest.fn().mockResolvedValue(undefined)}));
let next:(user:User|null)=>void;let fail:(error:unknown)=>void;
const user={email:'a@example.com',uid:'local-user'} as User;
function OnboardingProbe(){const {complete}=useOnboarding();return <Button onPress={()=>void complete()}>Complete onboarding</Button>;}
const routes={_layout:RootLayout,index:Index,onboarding:OnboardingProbe,'(app)/_layout':AppLayout,
  '(auth)/_layout':AuthLayout,'(auth)/login':()=> <Text>Login destination</Text>,'(auth)/register':()=> <Text>Registration destination</Text>,
  '(auth)/forgot-password':()=> <Text>Reset destination</Text>,'(app)/welcome':()=> <Text>Private destination</Text>};
beforeEach(()=>{
  jest.mocked(AsyncStorage.getItem).mockResolvedValue('complete');
  const action=jest.fn().mockResolvedValue(undefined);
  jest.mocked(getAuthService).mockReturnValue({login:action,register:action,logout:action,requestPasswordReset:action,
    observe:(cb,error)=>{next=cb;fail=error;return jest.fn();}});
});
afterEach(()=>jest.useRealTimers());
test('does not expose a route or hide splash before auth restoration',async()=>{
  await renderRouter(routes);expect(screen.queryByText(/destination/)).toBeNull();expect(Splash.hideAsync).not.toHaveBeenCalled();
  await act(()=>next(null));await waitFor(()=>expect(screen).toHavePathname('/login'));expect(Splash.hideAsync).toHaveBeenCalled();
});
test('waits for onboarding even when auth resolves first',async()=>{
  let resolve!:(value:string|null)=>void;jest.mocked(AsyncStorage.getItem).mockReturnValueOnce(new Promise(r=>{resolve=r;}));
  await renderRouter(routes);await act(()=>next(user));expect(screen.queryByText('Private destination')).toBeNull();expect(Splash.hideAsync).not.toHaveBeenCalled();
  await act(()=>resolve(null));await waitFor(()=>expect(screen).toHavePathname('/welcome'));
});
test('first launch redirects a protected deep link to onboarding',async()=>{
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);await renderRouter(routes,{initialUrl:'/welcome'});await act(()=>next(null));
  await waitFor(()=>expect(screen).toHavePathname('/onboarding'));expect(screen.queryByText('Private destination')).toBeNull();
});
test('restored user takes precedence over absent onboarding and public deep links',async()=>{
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);await renderRouter(routes,{initialUrl:'/login'});await act(()=>next(user));
  await waitFor(()=>expect(screen).toHavePathname('/welcome'));expect(screen.queryByText('Login destination')).toBeNull();
});
test('auth changes remove public and protected history',async()=>{
  await renderRouter(routes);await act(()=>next(null));await waitFor(()=>expect(screen).toHavePathname('/login'));
  await act(()=>router.push('/register'));await act(()=>next(user));await waitFor(()=>expect(screen).toHavePathname('/welcome'));
  expect(screen.queryByText('Registration destination')).toBeNull();await act(()=>next(null));await waitFor(()=>expect(screen).toHavePathname('/login'));
  expect(screen.queryByText('Private destination')).toBeNull();expect(router.canGoBack()).toBe(false);
});
test('an observer failure shows recovery and hides splash',async()=>{
  await renderRouter(routes);await act(()=>fail({code:'auth/network-request-failed'}));
  expect(await screen.findByRole('alert')).toHaveTextContent(/connection/i);expect(screen.getByRole('button',{name:'Retry'})).toBeTruthy();expect(Splash.hideAsync).toHaveBeenCalled();
});
test('unreadable onboarding storage offers retry without exposing login',async()=>{
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('storage unavailable'));
  await renderRouter(routes);await act(()=>next(null));expect(await screen.findByRole('alert')).toHaveTextContent(/read onboarding/i);expect(screen.queryByText('Login destination')).toBeNull();
});

test('persisted onboarding completion unlocks login',async()=>{
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);await renderRouter(routes);await act(()=>next(null));
  await fireEvent.press(await screen.findByRole('button',{name:'Complete onboarding'}));await waitFor(()=>expect(screen).toHavePathname('/login'));
});
test('configuration errors settle and retry restores navigation',async()=>{
  jest.mocked(getAuthService).mockImplementationOnce(()=>{throw new Error('Set EXPO_PUBLIC_FIREBASE_API_KEY');});
  await renderRouter(routes);expect(await screen.findByRole('alert')).toHaveTextContent(/EXPO_PUBLIC_FIREBASE_API_KEY/);
  await fireEvent.press(screen.getByRole('button',{name:'Retry'}));await act(()=>next(null));await waitFor(()=>expect(screen).toHavePathname('/login'));
});
