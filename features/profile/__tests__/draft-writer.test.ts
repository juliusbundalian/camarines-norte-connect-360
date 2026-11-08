import {DraftWriter} from '../draft-writer';
import {emptyDraft} from '../profile-types';
beforeEach(()=>jest.useFakeTimers());afterEach(()=>jest.useRealTimers());
it('coalesces edits and serializes writes that arrive during a save',async()=>{
 const written:string[]=[];let release!:()=>void;
 const writer=new DraftWriter(async draft=>{written.push(draft.displayName);if(written.length===1)await new Promise<void>(r=>release=r);});
 writer.schedule({...emptyDraft(),displayName:'A'});writer.schedule({...emptyDraft(),displayName:'Alex'});
 await jest.advanceTimersByTimeAsync(600);expect(written).toEqual(['Alex']);
 writer.schedule({...emptyDraft(),displayName:'Alex B'});const pending=writer.flush();release();await pending;
 expect(written).toEqual(['Alex','Alex B']);writer.dispose();
});
it('retains failed pending content for retry and drops future work after disposal',async()=>{
 let fail=true;const written:string[]=[];
 const writer=new DraftWriter(async d=>{if(fail)throw new Error('offline');written.push(d.displayName);});
 writer.schedule({...emptyDraft(),displayName:'Alex'});await expect(writer.flush()).rejects.toThrow('offline');
 fail=false;await writer.flush();expect(written).toEqual(['Alex']);
 writer.dispose();writer.schedule({...emptyDraft(),displayName:'Wrong account'});await writer.flush();expect(written).toEqual(['Alex']);
});
