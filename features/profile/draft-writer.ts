import type {ProfileDraft} from './profile-types';
/** A session owns one writer. Queued writes never run after disposal. */
export class DraftWriter {
 private pending:ProfileDraft|null=null;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private tail:Promise<void>=Promise.resolve();
 private disposed=false;
 private latest=0;
 private pendingVersion=0;
 constructor(private persist:(draft:ProfileDraft)=>Promise<void>,private status:(state:'saved'|'saving'|'unsaved')=>void=()=>{}){}
 schedule(draft:ProfileDraft){
  if(this.disposed)return;
  this.pending={...draft};this.pendingVersion=++this.latest;this.status('saving');clearTimeout(this.timer);
  this.timer=setTimeout(()=>{void this.flush().catch(()=>{});},600);
 }
 flush():Promise<void>{
  clearTimeout(this.timer);
  const draft=this.pending,version=this.pendingVersion;this.pending=null;
  if(this.disposed)return Promise.resolve();
  if(!draft)return this.tail;
  const work=this.tail.then(async()=>{
   if(this.disposed)return;
   try{await this.persist(draft);if(!this.disposed)this.status(this.pending?'saving':'saved');}
   catch(error){if(!this.disposed){if(version===this.latest){this.pending??=draft;this.pendingVersion=version;this.status('unsaved');}}throw error;}
  });
  this.tail=work.catch(()=>{});
  return work;
 }
 async run<T>(operation:()=>Promise<T>):Promise<T>{
  await this.flush();
  if(this.disposed)throw new Error('The active account changed.');
  // Reserve the queue before awaiting the operation, including newly scheduled drafts.
  let result!:T;
  const work=this.tail.then(async()=>{if(this.disposed)throw new Error('The active account changed.');result=await operation();});
  this.tail=work.catch(()=>{});await work;return result;
 }
 dispose(){this.disposed=true;clearTimeout(this.timer);this.pending=null;}
}
