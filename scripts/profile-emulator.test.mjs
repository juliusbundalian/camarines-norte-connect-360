import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {initializeApp,deleteApp}=require('firebase/app');
const {initializeAuth,connectAuthEmulator,createUserWithEmailAndPassword,signOut}=require('firebase/auth');
const {getFirestore,connectFirestoreEmulator,doc,getDocFromServer,getDocs,collection,updateDoc,serverTimestamp,terminate}=require('firebase/firestore');
const authHost=process.env.FIREBASE_AUTH_EMULATOR_HOST,dbHost=process.env.FIRESTORE_EMULATOR_HOST;
assert.match(authHost??'',/^(localhost|127\.0\.0\.1):\d+$/);assert.match(dbHost??'',/^(localhost|127\.0\.0\.1):\d+$/);
const [host,port]=dbHost.split(':');
Object.assign(process.env,{EXPO_PUBLIC_FIREBASE_API_KEY:'demo-key',EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:'demo-cn360-connect.firebaseapp.com',EXPO_PUBLIC_FIREBASE_PROJECT_ID:'demo-cn360-connect',EXPO_PUBLIC_FIREBASE_APP_ID:'demo-app',EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL:`http://${authHost}`,EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST:host,EXPO_PUBLIC_FIRESTORE_EMULATOR_PORT:port});
globalThis.__DEV__=true;
const {profileService:service}=await import('../services/firebase/profile-service.ts');
const {getFirebaseAuth,getFirebaseApp,getFirestoreDb}=await import('../services/firebase/client.ts');
const {emptyDraft}=await import('../features/profile/profile-types.ts');
let uid;
const deny=e=>e.code==='permission-denied';
after(async()=>{await terminate(getFirestoreDb());await deleteApp(getFirebaseApp());});
test('profile lifecycle is owner-scoped, idempotent and rejects stale/completed writes',async()=>{
 uid=(await createUserWithEmailAndPassword(getFirebaseAuth(),`profile-${randomUUID()}@example.com`,'Example password 123')).user.uid;
 const first=await service.ensure(uid,emptyDraft());assert.equal(first.revision,0);
 assert.equal((await service.ensure(uid,emptyDraft())).revision,0);
 assert.equal((await service.load(uid)).status,'incomplete');
 await assert.rejects(service.load('another-user'),/account/);
 const gender=await service.saveGender(uid,'female',{...emptyDraft(),avatarId:'avatar-8'},0);assert.equal(gender.currentStep,'profile');
 await assert.rejects(service.saveDraft(uid,emptyDraft(),0),/updated elsewhere/);
 const draft={...gender.draft,displayName:'Alex',birthdateText:'02/29/2024',mobileText:''};
 const saved=await service.saveDraft(uid,draft,1);assert.equal(saved.revision,2);
 const completed=await service.complete(uid,{gender:'female',displayName:'Alex',birthdate:'2024-02-29',mobileNumber:null,avatarId:'avatar-8'},2);
 assert.equal(completed.status,'complete');assert.equal(completed.revision,3);assert.equal(completed.createdAt.toMillis(),first.createdAt.toMillis());
 assert.equal((await service.complete(uid,{gender:'female',displayName:'Alex',birthdate:'2024-02-29',mobileNumber:null,avatarId:'avatar-8'},2)).revision,3);
 await assert.rejects(service.saveDraft(uid,draft,3),/already complete/);
 await assert.rejects(updateDoc(doc(getFirestoreDb(),'users',uid),{status:'incomplete',revision:4,updatedAt:serverTimestamp()}),deny);
});
test('rules deny cross-user reads, collection listing and guest access',async()=>{
 await assert.rejects(getDocs(collection(getFirestoreDb(),'users')),deny);
 const app=initializeApp({apiKey:'demo-key',projectId:'demo-cn360-connect',appId:'other'},`other-${randomUUID()}`);
 const auth=initializeAuth(app);connectAuthEmulator(auth,`http://${authHost}`,{disableWarnings:true});
 const db=getFirestore(app);connectFirestoreEmulator(db,host,Number(port));
 try{
  await createUserWithEmailAndPassword(auth,`other-${randomUUID()}@example.com`,'Example password 123');
  await assert.rejects(getDocFromServer(doc(db,'users',uid)),deny);
  await signOut(auth);await assert.rejects(getDocFromServer(doc(db,'users',uid)),deny);
 }finally{await terminate(db);await deleteApp(app);}
});
test('rules reject malformed dates, completion, oversized drafts and timestamp changes',async()=>{
 await signOut(getFirebaseAuth());
 uid=(await createUserWithEmailAndPassword(getFirebaseAuth(),`invalid-${randomUUID()}@example.com`,'Example password 123')).user.uid;
 await service.ensure(uid,emptyDraft());const p=await service.saveGender(uid,'other',emptyDraft(),0);
 const ref=doc(getFirestoreDb(),'users',uid);
 await assert.rejects(updateDoc(ref,{draft:{...p.draft,mobileText:'1'.repeat(33)},revision:2,updatedAt:serverTimestamp()}),deny);
 await assert.rejects(updateDoc(ref,{createdAt:serverTimestamp(),revision:2,updatedAt:serverTimestamp()}),deny);
 await assert.rejects(service.complete(uid,{gender:'other',displayName:'Alex',birthdate:'2023-02-29',mobileNumber:null,avatarId:'avatar-1'},1),deny);
 await assert.rejects(service.complete(uid,{gender:'other',displayName:'Alex',birthdate:'2999-01-01',mobileNumber:null,avatarId:'avatar-1'},1),deny);
 await assert.rejects(service.complete(uid,{gender:'other',displayName:' ',birthdate:'2000-01-01',mobileNumber:null,avatarId:'avatar-1'},1),deny);
 assert.equal((await service.load(uid)).status,'incomplete');
});
