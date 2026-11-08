import {render,screen,act} from '@testing-library/react-native';
import {RegistrationSuccessModal} from '../RegistrationSuccessModal';
beforeEach(()=>jest.useFakeTimers());afterEach(()=>jest.useRealTimers());
it('counts down for three seconds and navigates exactly once',async()=>{
 const elapsed=jest.fn();await render(<RegistrationSuccessModal visible onElapsed={elapsed}/>);
 expect(screen.getByText('Redirecting in 3s')).toBeTruthy();
 await act(()=>jest.advanceTimersByTime(1000));expect(screen.getByText('Redirecting in 2s')).toBeTruthy();
 await act(()=>jest.advanceTimersByTime(2000));expect(elapsed).toHaveBeenCalledTimes(1);
 await act(()=>jest.advanceTimersByTime(4000));expect(elapsed).toHaveBeenCalledTimes(1);
});
it('cancels navigation when unmounted',async()=>{
 const elapsed=jest.fn();const ui=await render(<RegistrationSuccessModal visible onElapsed={elapsed}/>);await ui.unmount();
 await act(()=>jest.advanceTimersByTime(5000));expect(elapsed).not.toHaveBeenCalled();
});
it('uses elapsed time when Android resumes after background suspension',async()=>{
 const {AppState}=require('react-native');let change!:(s:string)=>void;
 const spy=jest.spyOn(AppState,'addEventListener').mockImplementation((_event:any,cb:any)=>{change=cb;return {remove:jest.fn()};});
 const elapsed=jest.fn();await render(<RegistrationSuccessModal visible onElapsed={elapsed}/>);
 jest.setSystemTime(Date.now()+5000);await act(()=>change('active'));expect(elapsed).toHaveBeenCalledTimes(1);spy.mockRestore();
});
