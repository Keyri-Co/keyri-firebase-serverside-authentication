import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  linkWithCredential,
} from 'firebase/auth';

const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseClientConfig);
const auth = getAuth();

export default function Home() {
  const [user, setUser] = useState(() => auth.currentUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [keyriUser, setKeyriUser] = useState(false);
  const [passwordUser, setPasswordUser] = useState(false);
  const [unifiedUser, setUnifiedUser] = useState(false);

  useEffect(() => {
    console.log('user', user);
    auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        defineUserType(user);
        console.log('user', user);
      } else {
        setUser(null);
        console.log('user', user);
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener('message', async (evt) => {
      if (evt.data.keyri && evt.data.data && document.location.origin == evt.origin) {
        const { data } = evt;
        if (!data.error) {
          try {
            console.log('data', data);
            const payload = JSON.parse(data.data);
            // const email = payload.email;
            // const timestamp_nonce = payload.data;
            // const signature = payload.signature;
            await handleQrLogin(payload);
          } catch (error) {
            setAuthError('Could not log in with custom token');
          }
        } else if (data.error) {
          setAuthError(data.error);
        }
      }
    });
  }, []);

  const registerEmailPassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError('A user with this email already exists. Please try logging in instead.');
      console.log(error);
    }
  };

  const loginEmailPassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError("Invalid email or password OR you're not registered");
      console.log(error);
    }
  };

  const handleQrLogin = async (payload) => {
    try {
      const customToken = await fetch('/api/keyrilogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      }).then((res) => loginCustomToken(res.body));
    } catch (error) {
      setAuthError('Could not log in with custom token');
    }
  };

  const loginCustomToken = async (token) => {
    try {
      await signInWithCustomToken(auth, token);
    } catch (error) {
      console.log(error);
    }
  };

  const defineUserType = (user) => {
    if (user.providerData[0].providerId === 'password') {
      setPasswordUser(true);
    } else if (user.providerData.length === 0) {
      setKeyriUser(true);
    }
    if (keyriUser && passwordUser) {
      setPasswordUser(false);
      setKeyriUser(false);
      setUnifiedUser(true);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      setEmail('');
      setPassword('');
      setKeyriUser(false);
      setPasswordUser(false);
      setUnifiedUser(false);
    } catch (error) {
      console.log(error);
    }
  };

  const addPasswordToUser = async (email, password) => {
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await user.linkWithCredential(credential);
      setPasswordUser(true);
      setUnifiedUser(true);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Keyri + Firebase Serverside Passwordless Auth</title>
        <meta
          name='description'
          content='A web app showcasing Keyri passwordless authentication compatibility with the Firebase auth suite'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Firebase + <a href='https://keyri.com'>Keyri</a> passwordless auth
        </h1>

        <p className={styles.description}>
          Registration and login for the same user can be handled both through Firebase's native auth suite and Keyri's
          passwordless authentication.
        </p>

        {user ? (
          <>
            {unifiedUser ? (
              <>
                <p className={styles.description}>
                  Perfect! You're registered both through email/password login AND Keyri auth.
                </p>
                <p style={{ textAlign: 'center' }}>You can use either method to log into this account.</p>
              </>
            ) : keyriUser ? (
              <>
                <p className={styles.description}>Awesome, you're all set with Keyri passwordless authentication.</p>
                <p style={{ textAlign: 'center' }}>
                  You can now add a password to your account with the form below if you want redundancy.
                </p>
                <input
                  type={'password'}
                  className={styles.traditionalAuthInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={'password'}
                />
                <button className={styles.authButton} disabled={!password} onClick={addPasswordToUser}>
                  Add password to account
                </button>
              </>
            ) : passwordUser ? (
              <>
                <p className={styles.description}>Great, you're registered with a password!</p>
                <p style={{ textAlign: 'center' }}>
                  To try out Keyri QR login, sign in to the example iOS app with the same email/password, then tap
                  "Enable Keyri"
                </p>
                <p style={{ textAlign: 'center' }}>You can then come back here and log in by scanning the QR code.</p>
              </>
            ) : null}
            <p>
              Your user <code>displayName</code> is <b>{user.email}</b>
            </p>
            <p>
              Your user <code>uid</code> is <b>{user.uid}</b>
            </p>
            <button className={styles.authButton} onClick={logOut}>
              Log out
            </button>
          </>
        ) : (
          <>
            <p className={styles.description}>
              To sign in with Keyri's QR login, use the example app provided via TestFlight.
            </p>
            <div className={styles.grid}>
              <div className={styles.card}>
                <h2>Traditional Firebase Auth</h2>
                <p>Log in or register with username+password</p>
                <br />
                <input
                  type={'text'}
                  className={styles.traditionalAuthInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={'Your email address'}
                />
                <input
                  type={'password'}
                  className={styles.traditionalAuthInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={'password'}
                />

                <button className={styles.authButton} disabled={!email || !password} onClick={loginEmailPassword}>
                  Log in
                </button>
                <button className={styles.authButton} disabled={!email || !password} onClick={registerEmailPassword}>
                  Register
                </button>
                <br />
                <br />
                {authError && <p className={styles.errorMsg}>{authError}</p>}
              </div>

              <div className={styles.card}>
                <h2>Keyri QR Login</h2>
                <p>Scan the code below with the example Keyri+Firebase app to log in</p>
                <br />
                <div className={styles.qrContainer}>
                  <iframe
                    src='./KeyriQR.html'
                    id='qr-iframe'
                    height={300}
                    width={300}
                    scrolling='no'
                    frameBorder={0}
                    style={{ border: 2, borderColor: 'white', center: 'true' }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
