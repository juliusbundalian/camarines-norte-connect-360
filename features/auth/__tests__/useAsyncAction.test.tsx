import {act, renderHook} from '@testing-library/react-native';
import {useAsyncAction} from '../useAsyncAction';
test('guards simultaneous submission, clears pending, and permits retry', async()=>{
  let resolve!:()=>void;const pending=new Promise<void>(r=>{resolve=r;}); const action=jest.fn(()=>pending);
  const {result}=await renderHook(useAsyncAction);let first!:Promise<boolean>;let second!:Promise<boolean>;
  await act(()=>{first=result.current.run(action);second=result.current.run(action);});
  expect(action).toHaveBeenCalledTimes(1);expect(result.current.pending).toBe(true);
  await act(async()=>{resolve();await first;await second;});expect(result.current.pending).toBe(false);
  await act(async()=>{await result.current.run(async()=>{throw {code:'auth/network-request-failed'};});});
  expect(result.current.error).toMatch(/connection/i);expect(result.current.pending).toBe(false);
  await act(async()=>{await result.current.run(async()=>{});});expect(result.current.error).toBeNull();
});
test('settling after unmount does not write stale state', async()=>{
  let resolve!:()=>void; const deferred=new Promise<void>(r=>{resolve=r;});const {result,unmount}=await renderHook(useAsyncAction);
  let task!:Promise<boolean>;await act(()=>{task=result.current.run(()=>deferred);});await unmount();
  resolve();expect(await task).toBe(false);
});
