// Template configuration for Firebase credentials.
// Copy this file to `src/environments/environment.ts` and `src/environments/environment.prod.ts`
// and replace the placeholder values with your Firebase Project credentials.

export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID',
  },
  institutionalDomain: 'ulbsibiu.ro',
  web3forms: {
    accessKey: 'YOUR_WEB3FORMS_ACCESS_KEY',
  },
};
