"use strict";

const { app } = require("electron");
const { mainapp } = require("racehub-electron-firebase");
const { infoRequest, startClients } = require("../answerBrowser");

!(function () {
  mainapp.setupAppConfig();
})();

mainapp.event.once("user-login", (user) => {
  global.user = user;
  // this event will trigger on sign-in, not every time the app runs with cached credentials
});

mainapp.event.once("user-ready", async (user) => {
  global.user = user;
  mainapp.sendToBrowser("app-ready");
});

mainapp.event.once("window-open", (window) => {
  // first event will be the main window
});

mainapp.event.once("main-window-ready", (window) => {
  // shut down the app and clean up when the main window closes
  window &&
    window.on("close", (_) => {
      mainapp.closeApplication(window);
    });

  // signout button was pressed
  mainapp.getFromBrowser("user-signout", mainapp.signoutUser);

  // starts client
  mainapp.getFromBrowser("start-client", startClients);

  // one of the information request buttons was clicked
  mainapp.getFromBrowser("info-request", infoRequest);
});

// This function will be called when Electron has finished initialization and is ready to create
// browser windows. Some APIs can only be used after this event occurs. launchInfo is macOS specific.
// see: https://www.electronjs.org/docs/api/app#event-ready
app.on("ready", async (launchInfo) => {
  global.launchInfo = launchInfo | {};
  try {
    await mainapp.startMainApp({
      title: "RaceHub",
      open_html: "pages/index.html",
      show: true,
    });
    // now do some other synchronous startup thing if you want to
    // otherwise wait for the "user-ready" event
  } catch (error) {
    console.error(error);
  }
});

// see: https://electronjs.org/docs/api/app#event-activate-macos
// macOS specific - Emitted when the application is activated. Various actions can trigger this
// event, such as launching the application for the first time, attempting to re-launch the
// application when it's already running, or clicking on the application's dock or taskbar icon.
app.on("activate", (appEvent, hasVisibleWindows) => {
  // do whatever
});
