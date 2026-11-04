import {act,renderHook,waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {OnboardingProvider,useOnboarding} from '../OnboardingProvider';
const storage=jest.mocked(AsyncStorage);
beforeEach(()=>storage.clear());
test.each([[null,false],['complete',true],['broken',false]] as const)('restores %s as completed=%s',async(value,want)=>{
  storage.getItem.mockResolvedValueOnce(value);const {result}=await renderHook(useOnboarding,{wrapper:OnboardingProvider});
  await waitFor(()=>expect(result.current.ready).toBe(true));expect(result.current.completed).toBe(want);
});
test('read failure is retryable',async()=>{
  storage.getItem.mockRejectedValueOnce(new Error('storage unavailable'));
  const {result}=await renderHook(useOnboarding,{wrapper:OnboardingProvider});await waitFor(()=>expect(result.current.error).toBeTruthy());
  expect(result.current.ready).toBe(true);await act(()=>result.current.retry());await waitFor(()=>expect(result.current.error).toBeNull());
});
test('completion waits for storage and rejects duplicate writes',async()=>{
  let resolve!:()=>void;storage.setItem.mockImplementationOnce(()=>new Promise<void>(r=>{resolve=r;}));
  const {result}=await renderHook(useOnboarding,{wrapper:OnboardingProvider});await waitFor(()=>expect(result.current.ready).toBe(true));
  let task!:Promise<void>;await act(()=>{task=result.current.complete();void result.current.complete();});
  expect(storage.setItem).toHaveBeenCalledTimes(1);expect(result.current.completed).toBe(false);
  await act(async()=>{resolve();await task;});expect(result.current.completed).toBe(true);
  expect(storage.setItem).toHaveBeenCalledWith('@cn360/onboarding/v1','complete');
});
test('write failure keeps onboarding incomplete and retry succeeds',async()=>{
  storage.setItem.mockRejectedValueOnce(new Error('full'));
  const {result}=await renderHook(useOnboarding,{wrapper:OnboardingProvider});await waitFor(()=>expect(result.current.ready).toBe(true));
  await act(async()=>{await result.current.complete();});expect(result.current.completed).toBe(false);expect(result.current.error).toBeTruthy();
  await act(async()=>{await result.current.complete();});expect(result.current.completed).toBe(true);
});
