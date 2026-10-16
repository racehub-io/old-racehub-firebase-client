// webutils.js
// this is not a module, but is included in other HTML pages

function isJSON(s) {
  return typeof s == "string" && (s.charAt(0) == "{" || s.charAt(0) == "[");
}

function isObject(obj) {
  return obj && typeof obj == "object";
}

function parseJSON(jString) {
  if (jString == null) return null;
  if (!isJSON(jString)) {
    return jString;
  }
  try {
    return JSON.parse(jString);
  } catch (err) {
    console.error("ERROR parsing JSON: ", err, jString);
    return null;
  }
}

function stringifyJSON(thisObject) {
  if (thisObject == null) return null;
  if (typeof thisObject !== "object" && !Array.isArray(thisObject)) {
    return thisObject;
  }
  try {
    return JSON.stringify(thisObject);
  } catch (err) {
    console.error("ERROR stringifying JSON: ", err);
    return null;
  }
}

function api(method, url, payload) {
  return new Promise((resolve, reject) => {
    const endpoint = new URL(url, window.location.href);
    if (window.location.protocol !== "https:" ||
        !["localhost", "127.0.0.1"].includes(window.location.hostname) ||
        endpoint.origin !== window.location.origin) {
      reject(new Error("Use the local application endpoint."));
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open(method, endpoint.href);
    if (isJSON(payload) || isObject(payload)) {
      xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    }
    xhr.onreadystatechange = function () {
      // readyState 4 is DONE
      if (xhr.readyState !== 4) return;
      if (xhr.status < 200 || xhr.status >= 300) {
        console.error("API request failed.", xhr.status);
        reject({
          error: "API ERROR",
          url: url,
          status: xhr.status,
        });
        return;
      }
      resolve(parseJSON(xhr.response));
    };
    xhr.send(stringifyJSON(payload));
  });
}
