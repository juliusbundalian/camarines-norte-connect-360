import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {deleteApp, initializeApp} from 'firebase/app';
import {connectAuthEmulator, createUserWithEmailAndPassword, getAuth} from 'firebase/auth';
import {
  collection, connectFirestoreEmulator, deleteDoc, doc, getDocFromServer, getDocsFromServer,
  getFirestore, query, setDoc, terminate, updateDoc, where,
} from 'firebase/firestore';

const projectId = 'demo-cn360-connect';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
assert.match(firestoreHost ?? '', /^(localhost|127\.0\.0\.1):\d+$/);
assert.match(authHost ?? '', /^(localhost|127\.0\.0\.1):\d+$/);
const [host, port] = firestoreHost.split(':');
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/property-listings.json', import.meta.url), 'utf8'));

function field(value) {
  if (value === null) return {nullValue: null};
  if (Array.isArray(value)) return {arrayValue: {values: value.map(field)}};
  if (typeof value === 'boolean') return {booleanValue: value};
  if (Number.isInteger(value)) return {integerValue: String(value)};
  if (typeof value === 'number') return {doubleValue: value};
  if (typeof value === 'object') {
    return {mapValue: {fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, field(item)]))}};
  }
  return {stringValue: value};
}

test('published listings are readable by guests and members, with writes reserved for administrators', async () => {
  for (const [id, data] of Object.entries(fixtures)) {
    const published = id === 'danielle-luxe';
    const record = {...data, published, ...(published ? {
      latitude: 14.11, longitude: 122.96, agency: {name: 'Demo agency'},
    } : {})};
    const response = await fetch(
      `http://${firestoreHost}/v1/projects/${projectId}/databases/(default)/documents/propertyListings/${id}`,
      {
        method: 'PATCH',
        headers: {Authorization: 'Bearer owner', 'Content-Type': 'application/json'},
        body: JSON.stringify({fields: Object.fromEntries(Object.entries(record).map(([key, value]) => [key, field(value)]))}),
      },
    );
    assert.ok(response.ok, await response.text());
  }

  for (const signedIn of [false, true]) {
    const app = initializeApp({projectId, apiKey: 'demo-key'}, signedIn ? 'member' : 'guest');
    const db = getFirestore(app);
    connectFirestoreEmulator(db, host, Number(port));
    try {
      if (signedIn) {
        const auth = getAuth(app);
        connectAuthEmulator(auth, `http://${authHost}`, {disableWarnings: true});
        await createUserWithEmailAndPassword(auth, `catalog-${Date.now()}@example.test`, 'Example password 123');
      }

      const catalog = collection(db, 'propertyListings');
      const published = doc(catalog, 'danielle-luxe');
      const deny = {code: 'permission-denied'};
      const results = await getDocsFromServer(query(catalog, where('published', '==', true)));
      assert.deepEqual(results.docs.map(item => item.id), ['danielle-luxe']);
      assert.deepEqual(results.docs[0].data().agency, {name: 'Demo agency'});
      assert.equal((await getDocFromServer(published)).data().latitude, 14.11);
      await assert.rejects(getDocsFromServer(catalog), deny);
      await assert.rejects(getDocFromServer(doc(catalog, 'belle-luxe')), deny);
      await assert.rejects(setDoc(doc(catalog, 'new'), {published: true}), deny);
      await assert.rejects(updateDoc(published, {price: 1}), deny);
      await assert.rejects(deleteDoc(published), deny);
    } finally {
      await terminate(db);
      await deleteApp(app);
    }
  }
});
