import { KeyriError } from '../errorList';

const crypto = require('crypto');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const configuration = require('../config/firebaseAdmin');

admin.initializeApp({
  credential: admin.credential.cert(configuration.firebaseConfig),
});

const db = getFirestore();

//// Authentication

// Adding a Keyri public key credential to the user's profile
const keyriRegister = async (email, publicKey) => {
  // First check if the user already exists
  if (
    await admin
      .auth()
      .getUserByEmail(email)
      .catch((error) => {
        console.log(`User already exists: ${email}`);
      })
  ) {
    // If they exist, update their public key
    const userRecord = await admin
      .auth()
      .getUserByEmail(email)
      .catch((error) => {
        console.log(`Firebase error: ${error}`);
      });
    await db.collection('users').doc(userRecord.email).set(
      {
        uid: userRecord.uid,
        email: userRecord.email,
        publicKey,
      },
      { merge: true }
    );
    return 'User with this email already exists. Public key added or updated.';
  } else {
    try {
      // Create the user in Firebase Authentication
      const userRecord = await admin.auth().createUser({
        email,
        displayName: email,
      });
      // Make a record for this user in Firestore, including the Keyri public key
      await db.collection('users').doc(userRecord.email).set({
        uid: userRecord.uid,
        email: userRecord.email,
        publicKey,
      });
      // Create a custom token for the user
      const token = await admin.auth().createCustomToken(userRecord.uid);
      return token;
    } catch (error) {
      console.log(`Line 48 Firebase error: ${error}`);
    }
  }
};

// Meat and potatoes authentication logic
const verifySignature = (pubKeyB64, data, signatureB64) => {
  // Make sure you received all the necessary data
  if (typeof pubKeyB64 === 'undefined' || typeof data === 'undefined' || typeof signatureB64 === 'undefined') {
    console.log('Missing data');
  }

  // Make sure you received a valid timestamp
  const timestamp = parseInt(data.slice(0, 13), 10);
  const now = new Date().getTime();
  if (Number.isNaN(timestamp) || Math.abs(now - timestamp) > 60_000) {
    return false;
  }

  // The actual cryptographic verification
  const pubKey = crypto.createPublicKey(`-----BEGIN PUBLIC KEY-----\n${pubKeyB64}\n-----END PUBLIC KEY-----`);
  try {
    const verify = crypto.createVerify('sha256');
    verify.update(Buffer.from(data));
    verify.end();
    const verified = verify.verify(pubKey, Buffer.from(signatureB64, 'base64'));
    return verified;
  } catch (e) {
    console.log('Signature could not be verified');
  }
};

// The full login function for getting a custom Firebase token to be used client-side for authentication
const keyriLogin = async (email, data, signatureB64) => {
  // First, get the user's public key from Firestore
  const userDoc = await db
    .collection('users')
    .doc(email)
    .get()
    .catch((error) => {
      console.log(`Firebase error: ${error}`);
      throw new KeyriError(1000, error.message);
    });
  if (!userDoc || !userDoc.data()) throw new KeyriError(1002);
  const pubKeyB64 = userDoc.data().publicKey;
  // Verify the signature
  const verified = verifySignature(pubKeyB64, data, signatureB64);
  // If the signature is valid, create a custom token for the user
  if (verified) {
    const userRecord = await admin
      .auth()
      .getUserByEmail(email)
      .catch((error) => {
        console.log(`Firebase error: ${error}`);
        throw new KeyriError(1000, error.message);
      });
    return admin.auth().createCustomToken(userRecord.uid);
  }
  throw new KeyriError(1003);
};

module.exports = { keyriRegister, keyriLogin };
