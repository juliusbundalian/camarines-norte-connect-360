import {getFirestore,connectFirestoreEmulator} from '@react-native-firebase/firestore';
import {getNativeAuth} from './native-auth';
import {getFirebaseConfiguration} from './config';
let database:ReturnType<typeof getFirestore>|undefined;

export function getNativeFirestore() {
  const config=getFirebaseConfiguration();
  const app=getNativeAuth().app;
  if(app.options.projectId!==config.options.projectId) {
    throw new Error('Firebase Android configuration does not match the active project.');
  }
  if(database)return database;
  const next=getFirestore(app);
  if(config.firestoreEmulator) {
    if(!config.options.projectId?.startsWith('demo-'))throw new Error('Native Firestore Emulator requires a demo- project.');
    connectFirestoreEmulator(next,config.firestoreEmulator.host,config.firestoreEmulator.port);
  }
  database=next;
  return next;
}
