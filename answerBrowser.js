"use strict";

const { mainapp, fbstorage, fbwindow } = require("racehub-electron-firebase");
const clients = require("./api/index");
const urlParser = require("url").parse;

function buildProfile(user) {
  if (!user) {
    return {};
  }
  return {
    Name: user.displayName,
    Email: user.email,
    "User ID": user.uid,
    "Photo:": user.photoURL,
    "Last Login": new Date(parseInt(user.lastLoginAt, 10)).toString(),
  };
}

function getUser(parameter) {
  switch (parameter) {
    case "profile":
      return buildProfile(global.user);
    case "provider":
      return global.user.providerData[0];
    case "context":
      return global.appContext;
  }
}

async function infoRequest(request, ...parameters) {
  let sendContent;
  switch (request) {
    case "user":
      sendContent = await getUser(parameters[0]);
      break;
    case "docs":
      sendContent = await getDocs(parameters[0]);
      break;
    case "folder-list":
      sendContent = await listFolders(parameters[0]);
      break;
    case "file-list":
      sendContent = await listFiles(parameters[0], parameters[1]);
      break;
  }
  mainapp.sendToBrowser("info-request", sendContent);
}

let worker;

const startClients = () => {
  if (!worker) {
    console.log("Starts the parser");
    // worker = new Worker("./api/f1/f12021/parser.js", {
    //   workerData: { filename: "1635369422140" },
    // });
    // worker.once("message", (result) => {
    //   console.log(result);
    // });
    // worker.on("error", (error) => {
    //   console.log(error);
    // });
    // worker.on("exit", (exitCode) => {
    //   console.log(`It exited with code ${exitCode}`);
    // });
  }

  // const parser = new F1ParquetParser(1, basePath);
  // Object.values(clients).map((client) => {
  //   const { clientId, clientType } = client;
  //   // store.dispatch(addClient(clientId, clientType));
  //   // client.connect(); // userSettings.get(`recorders_${clientType}_auto_start`) ? client.connect() : null;
  // });
};

async function getContent(filepath, domain = "file") {
  if (!filepath || filepath.length == 0) return {};
  return await fbstorage[domain].download(filepath);
}

function openWithUrl(url, contentType) {
  // see BrowserWindow options: https://www.electronjs.org/docs/api/browser-window#new-browserwindowoptions
  const urlParts = urlParser(url);
  const lastPart = urlParts.pathname.split("/").pop();
  const resource = decodeURIComponent(lastPart);
  const openOptions = {
    show: true,
    title: resource,
    width: 300,
    height: 400,
    center: true,
    resizable: false,
    // skipTaskbar: true,
    parent: global.mainWindow,
    // autoHideMenuBar: true,
  };
  return new fbwindow.open(url, openOptions);
}

module.exports = {
  infoRequest,
  startClients,
};
