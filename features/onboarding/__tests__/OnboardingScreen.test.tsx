import {render,screen,fireEvent} from '@testing-library/react-native';
import {PaperProvider} from 'react-native-paper';
import {useWindowDimensions} from 'react-native';
import OnboardingScreen from '../OnboardingScreen';
import {useOnboarding} from '../OnboardingProvider';
jest.mock('../OnboardingProvider',()=>({useOnboarding:jest.fn()}));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions',()=>({__esModule:true,default:jest.fn(()=>({width:390,height:844,scale:1,fontScale:1}))}));
const complete=jest.fn().mockResolvedValue(undefined);
beforeEach(()=>{jest.mocked(useOnboarding).mockReturnValue({completed:false,ready:true,initializationError:null,error:null,saving:false,complete,retry:jest.fn()});});
const show=()=>render(<PaperProvider><OnboardingScreen/></PaperProvider>);
test('Next, Back, and final Get Started follow the three-page flow',async()=>{
  await show();expect(screen.getByText('Discover Camarines Norte')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button',{name:'Next'}));expect(screen.getByLabelText('Page 2 of 3')).toBeSelected();
  await fireEvent.press(screen.getByRole('button',{name:'Back'}));expect(screen.getByLabelText('Page 1 of 3')).toBeSelected();
  await fireEvent.press(screen.getByRole('button',{name:'Next'}));await fireEvent.press(screen.getByRole('button',{name:'Next'}));
  expect(screen.getByText('Connect with the Community')).toBeTruthy();await fireEvent.press(screen.getByRole('button',{name:'Get Started'}));expect(complete).toHaveBeenCalledTimes(1);
});
test('Skip completes onboarding',async()=>{await show();await fireEvent.press(screen.getByRole('button',{name:'Skip'}));expect(complete).toHaveBeenCalledTimes(1);});
test('swipe updates the active page and rotation preserves its index',async()=>{
  const view=await show();await fireEvent(screen.getByTestId('onboarding-pages'),'momentumScrollEnd',{nativeEvent:{contentOffset:{x:390}}});
  expect(screen.getByLabelText('Page 2 of 3')).toBeSelected();
  jest.mocked(useWindowDimensions).mockReturnValue({width:320,height:700,scale:1,fontScale:1});
  await view.rerender(<PaperProvider><OnboardingScreen/></PaperProvider>);expect(screen.getByLabelText('Page 2 of 3')).toBeSelected();
  expect(screen.getByTestId('onboarding-pages').props.extraData).toBe(320);
});
test('shows a retryable save error and disables completion while saving',async()=>{
  jest.mocked(useOnboarding).mockReturnValue({completed:false,ready:true,initializationError:null,error:'Could not save. Try again.',saving:true,complete,retry:jest.fn()});
  await show();expect(screen.getByRole('alert')).toHaveTextContent(/Could not save/);expect(screen.getByRole('button',{name:'Skip'})).toBeDisabled();
});
