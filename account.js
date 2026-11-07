import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { doc, getFirestore, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const form = document.querySelector("#account-form");
const modeButtons = document.querySelectorAll("[data-account-mode]");
const nameField = document.querySelector("#account-name-field");
const nameInput = document.querySelector("#account-name");
const emailInput = document.querySelector("#account-email");
const passwordInput = document.querySelector("#account-password");
const submitButton = document.querySelector("#account-submit");
const resetButton = document.querySelector("#account-reset-password");
const message = document.querySelector("#account-message");
const setupMessage = document.querySelector("#firebase-setup-message");
const accountStatus = document.querySelector("#account-status");
const signOutButton = document.querySelector("#account-sign-out");

let accountMode = "signin";
let auth;
let database;
let firebaseReady = false;

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("is-error", isError);
  message.classList.toggle("is-success", !isError);
}

function getAuthErrorMessage(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "An account already uses that email. Try signing in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "That email and password combination wasn't recognized.";
    case "auth/weak-password":
      return "Choose a password with at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Couldn't connect to Firebase. Check your connection and try again.";
    default:
      console.error("Firebase account request failed.", error);
      return "We couldn't complete that account request. Check your Firebase setup and try again.";
  }
}

function setAccountMode(mode) {
  accountMode = mode;
  const isSignup = mode === "signup";
  nameField.hidden = !isSignup;
  nameInput.required = isSignup;
  passwordInput.autocomplete = isSignup ? "new-password" : "current-password";
  submitButton.textContent = isSignup ? "Create account" : "Sign in";
  resetButton.hidden = isSignup;
  modeButtons.forEach((button) => {
    const isActive = button.dataset.accountMode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  showMessage("");
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setAccountMode(button.dataset.accountMode));
});

resetButton.addEventListener("click", async () => {
  if (!firebaseReady) {
    showMessage("Password reset isn't available until Firebase is configured.", true);
    return;
  }

  if (!emailInput.value.trim()) {
    showMessage("Enter your email address first, then choose Forgot password.", true);
    emailInput.focus();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, emailInput.value.trim());
    showMessage("If an account exists for that email, Firebase will send password reset instructions.");
  } catch (error) {
    showMessage(getAuthErrorMessage(error), true);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("");

  if (!firebaseReady) {
    showMessage("Account creation and sign-in aren't connected yet. Configure Firebase using the setup instructions below, then reload this page.", true);
    return;
  }

  submitButton.disabled = true;

  try {
    const email = emailInput.value.trim();
    if (accountMode === "signup") {
      const credential = await createUserWithEmailAndPassword(auth, email, passwordInput.value);
      const displayName = nameInput.value.trim();

      try {
        await updateProfile(credential.user, { displayName });
        await setDoc(doc(database, "users", credential.user.uid), {
          uid: credential.user.uid,
          email,
          displayName,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error("The account was created, but its Firestore profile could not be saved.", error);
        showMessage("Your account was created, but we couldn't save its cloud profile. Check Firestore setup and rules, then sign in again.", true);
        return;
      }

      form.reset();
      showMessage("Your account is ready. Your profile is saved securely in Firebase.");
    } else {
      await signInWithEmailAndPassword(auth, email, passwordInput.value);
      passwordInput.value = "";
      showMessage("You're signed in.");
    }
  } catch (error) {
    showMessage(getAuthErrorMessage(error), true);
  } finally {
    submitButton.disabled = false;
  }
});

signOutButton.addEventListener("click", async () => {
  if (!firebaseReady) {
    showMessage("Sign-out isn't available until Firebase is configured.", true);
    return;
  }

  try {
    await signOut(auth);
    showMessage("You're signed out.");
  } catch (error) {
    showMessage(getAuthErrorMessage(error), true);
  }
});

if (!isFirebaseConfigured) {
  setupMessage.hidden = false;
  setupMessage.textContent = "The account form is available, but online account creation and sign-in need Firebase setup. Add your Firebase web app settings to firebase-config.js, enable Email/Password sign-in, and create a Firestore database.";
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getFirestore(app);
    firebaseReady = true;

    onAuthStateChanged(auth, (user) => {
      accountStatus.hidden = !user;
      if (user) {
        accountStatus.querySelector("strong").textContent = user.displayName || user.email;
        accountStatus.querySelector("span").textContent = user.email;
      }
    });
  } catch (error) {
    console.error("Firebase could not be initialized.", error);
    setupMessage.hidden = false;
    setupMessage.textContent = "Firebase could not start. Check the web app settings in firebase-config.js and reload this page.";
  }
}
