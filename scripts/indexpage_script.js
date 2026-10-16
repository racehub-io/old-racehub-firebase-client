// indexpage_script.js
// functions for interacting with main app, note that ipc is defined in weblocal.js

function signout() {
  // send the signout signal back to Main
  ipc.send("user-signout", Date.now().toString());
}

// custom elements
class InfoButton extends HTMLButtonElement {
  constructor() {
    super();
    this.setAttribute("class", "btn btn-info");
    this.setAttribute("type", "button");
    this.setAttribute("data-toggle", "modal");
    this.setAttribute("data-target", "#ModalDialog");
  }
}
// customElements.define("info-button", InfoButton, { extends: "button" });

function showSpinner(parent, bShowState) {
  const spinner = parent.find(".spinner-border");
  switch (bShowState) {
    case true:
      spinner.removeClass("invisible");
      break;
    case false:
      spinner.addClass("invisible");
      break;
    case "show":
      spinner.removeClass("d-none");
      break;
    case "hide":
      spinner.addClass("d-none");
      break;
  }
}

function insertSpinner(parent, bShowState) {
  const spinner = parent.find(".spinner-border");
  if (bShowState) spinner.removeClass("d-none");
  else spinner.addClass("d-none");
}

function displayDate(fileISOString) {
  const fileDate = new Date(fileISOString);
  var showDate = fileDate.toLocaleDateString(undefined, displayDate.doptions);
  if (
    showDate == new Date().toLocaleDateString(undefined, displayDate.doptions)
  ) {
    showDate = fileDate.toLocaleTimeString();
  }
  return showDate;
}

displayDate.doptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

function imageLink(iconClass, url, mime) {
  const link = `<a class="fa fa-fw fa-lg fa-${iconClass} mr-1" href="#" data-url="${url}" data-content="${mime}">`;
  return link;
}
