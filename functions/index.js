const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp();

const customToken = functions.https.onCall((data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in first.");
  }
  return getAuth().createCustomToken(context.auth.uid);
});

module.exports = { customToken };
