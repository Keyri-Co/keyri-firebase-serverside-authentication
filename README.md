This is a project from [Keyri](https://keyri.com/) demonstrating how our passwordless and QR authentication system can be used across an application spanning web and native mobile clients that use Firebase for user management and authentication. This is a [Next.js](https://nextjs.org/) project that, for the sake of simplicity, utilizes Next's API route functionality to simulate a "real" Node.js server using, for example, Express.

A key feature of this project is that one Firebase user can be authenticated using either Firebase's built-in authentication interfaces or Keyri's passwordless and QR authentication system interchangeably. This is achieved by using Firebase's [custom token](https://firebase.google.com/docs/auth/admin/create-custom-tokens) functionality to create a custom token for the user that is then used to authenticate the user with your Firebase-based client application. The user, whether authenticated through Firebase methods or Keyri passwordless auth, is defined by its Firebase UID, thereby ensuring perfect consistency between the two auth flows.

The live demo of this web project can be found here: [TODO: Link to live vercel app](https://firebase-server-auth-web.vercel.app/). The companion mobile app is available in its own repository [TODO: Link to Aditya's repo](), and a build of that app is available upon request via Testflight. Please email [zain@keyri.com](mailto:zain@keyri.com) to request access.

### Assumptions

This project uses Firestore as a complementary user database to store users' Keyri public keys, since Firebase Authentication does not allow for custom fields. In practice, any database can be used, ideally one that incorporate all of the user's credentials, such as hashed password, OAuth grants, AND Keyri public key, into one record/document or at least with strong relations between discrete tables, with the user's UID as the relational key. This Firestore-based demo solution is used here as a compromise for simplicity in development at the potential cost of long-term maintainability for actual production applications.

## Building this yourself

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the resulting web application.

## API Usage

Keyri-related authentication API routes can be accessed on [http://localhost:3000/api/keyriregistration](http://localhost:3000/api/keyriregistration) (registering a user's Keyri public key credential for immediate and future authentication) and [http://localhost:3000/api/keyrilogin](http://localhost:3000/api/keyrilogin) (logging in the pre-registed user).

The /api/keyriregistration route is a POST route that expects a JSON body with the following structure:

```json
{
  "email": "abc@xyz.tld",
  "publicKey": "[base64-encoded-public-key minus the PEM header and footer]"
}
```

This registration route, in production, must be hit by your mobile client, as that is where the Keyri mobile SDK generates the keypair for the user.

The /api/keyrilogin route is a POST route that expects a JSON body with the following structure:

```json
{
  "email": "abc@xyz.tld",
  "data": "[utf-8 encoded ${timestamp_nonce} string]",
  "signature": "[base64-encoded ECDH signature]"
}
```

Both of these routes return a custom Firebase token that can be exchanged for a Firebase user credential in your client application, just like any registration and login route would (in terms of UX if not mechanism). The presence of this user credential in your client signifies the authenticated state of your user. This exchange is taken care of by the web app in this project.

In this web app, the /api/keyrilogin route is hit upon scanning the QR code with the aforementioned Keyri SDK-enabled mobile app, and functions that wrap this call are used to seamlessly log the user in without any manual input.

NOTABLY, the /api/keyrilogin route can be hit directly by your Keyri SDK-enabled mobile application. Doing so would allow instant, input-less login upon, for example, passing a biometrics check like FaceID. This functionality, in addition to QR login on the web app, is implemented in the companion mobile app in this project: [TODO: link to Aditya's repo]().

## Learn More

To learn more about Keyri, take a look at the following resources:

- [Keyri Documentation](https://docs.keyri.com) - learn about Keyri QR and passwordless authentication features.
- [Keyri Youtube Channel](https://www.youtube.com/@Keyri) - a series of demos of Keyri UX and security, as well as step-by-step tutorials on incorporating Keyri authentication into various authentication systems.

# Get started with Keyri

Incorporating Keyri QR and passwordless authentication for your web and mobile applications is easy and free. Integration entails adding our SDK to your native mobiile app (available for Swift, Kotlin/Java, Flutter, and React Native) and, for QR login functionality, adding our QR widget iframe to your login page.

To get started, visit [Keyri](https://app.keyri.com/) and sign up for a free account. Once you have an account, you can create a new project and generate a project-specific appKey. This appKey is used to authenticate your requests from your mobile app to the Keyri API. You can find your appKey in the project settings page.

Questions and suggestions are always welcome. Feel free to drop us a line at [hello@keyri.com](mailto:hello@keyri.com)
