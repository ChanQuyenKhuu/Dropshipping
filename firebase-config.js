export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => value && !value.startsWith("YOUR_")
);
