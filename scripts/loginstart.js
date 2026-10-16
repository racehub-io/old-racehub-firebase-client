const idpConfig = {
  "google.com": {
    provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    scopes: [
      "profile",
      "email",
      "openid",
      "https://www.googleapis.com/auth/devstorage.full_control",
    ],
    customParameters: { prompt: "select_account" },
  },
  // password: {
  //   provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
  // },
  // phone: {
  //   provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
  // },
};

async function startApplication(fbConfig) {
  try {
    // initializeApp must be called before any other Firebase APIs
    firebase.initializeApp(fbConfig);

    // a signout request may be passed in the browser querystring
    await checkForSignout();

    // whether or not the user is forced to log in every time
    await setUserPersistence(getTrueQueryParam("persistentUser"));

    // we must make a decision: if there is a persistent user then do not start the login workflow
    const foundUser = await checkForPersistentUser();
    if (!foundUser) {
      throw "NO USER";
    }

    // we found a user defined in the IndexedDB object store, so wait for the login
    firebase.auth().onAuthStateChanged(postAuthResult);
  } catch (error) {
    // no persisted user or some error, so start the login UI workflow from firebaseUI
    const response = await showLoginWindow();
    firebaseAuthUIStart(fbConfig, idpConfig);
  }
}

// when the document is loaded, call Main process to get the app config parameters
// and then we can start firebaseui
document.onreadystatechange = function () {
  if (document.readyState !== "complete") return;

  // ask the Main process to get the configuration parameters for firebase authentication
  api("GET", getQueryParam("firebaseconfig"), null)
    .then(startApplication)
    .catch((error) => {
      alert("ERROR getting app configuration, please restart application");
    });
};
