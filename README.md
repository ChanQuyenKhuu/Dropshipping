# Dropshipping
A dropshipping e-commerce website that allows customers to browse products, place orders, and purchase items online without requiring inventory management.

Click a product's stars to view its ratings and comments. Reviews are saved in the current browser with local storage and are not shared across visitors. A buyer can only post a review for a product after its demo checkout is submitted; the checkout does not process or charge payments.

## Customer accounts

The account page uses Firebase Authentication for email/password sign-up, sign-in, and password reset. New customer profiles are saved in Firestore at `users/{uid}`.

The account form can be opened before Firebase is configured, but account creation and sign-in require the setup below.

1. Create a Firebase project, add a web app, enable **Authentication → Email/Password**, and create a Firestore database.
2. Replace the placeholder values in `firebase-config.js` with the web app configuration from Firebase project settings. Firebase web configuration is public client configuration; never put service-account keys or other private credentials in this file.
3. Publish `firestore.rules` in the Firestore Rules console.
4. Add your website host to Firebase Authentication's authorized domains and serve the site through HTTP(S), rather than opening the HTML files directly.
