/* =========================================================
   REQGEN V4 — SCRIPT.JS
========================================================= */

"use strict";

/* =========================================================
   STORAGE
========================================================= */

const HISTORY_KEY = "reqgen_v4_history";
const SAVED_KEY = "reqgen_v4_saved";
const COLLECTION_KEY = "reqgen_v4_collections";
const SETTINGS_KEY = "reqgen_v4_settings";

let historyData = JSON.parse(
  localStorage.getItem(HISTORY_KEY) || "[]"
);

let savedData = JSON.parse(
  localStorage.getItem(SAVED_KEY) || "[]"
);

let collectionsData = JSON.parse(
  localStorage.getItem(COLLECTION_KEY) || "[]"
);

let settings = JSON.parse(
  localStorage.getItem(SETTINGS_KEY) || "{}"
);

let currentRequest = null;
let currentLanguage = "javascript";


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function saveStorage() {
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(historyData)
  );

  localStorage.setItem(
    SAVED_KEY,
    JSON.stringify(savedData)
  );

  localStorage.setItem(
    COLLECTION_KEY,
    JSON.stringify(collectionsData)
  );

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
  );
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   PARAMS
========================================================= */

function addParam(key = "", value = "", enabled = true) {

  const container = $("paramsContainer");

  if (!container) return;

  const row = document.createElement("div");

  row.className = "param-row";

  row.innerHTML = `
    <div class="param-enabled">
      <input
        type="checkbox"
        class="param-check"
        ${enabled ? "checked" : ""}
      >
    </div>

    <input
      type="text"
      class="param-key"
      placeholder="Key"
      value="${escapeHTML(key)}"
    >

    <input
      type="text"
      class="param-value"
      placeholder="Value"
      value="${escapeHTML(value)}"
    >

    <button
      type="button"
      class="remove-param"
    >×</button>
  `;

  row
    .querySelector(".remove-param")
    .addEventListener("click", () => {
      row.remove();
      updateURLFromParams();
    });

  row
    .querySelectorAll("input")
    .forEach((input) => {
      input.addEventListener("input", updateURLFromParams);
      input.addEventListener("change", updateURLFromParams);
    });

  container.appendChild(row);
}


function getParams() {

  const result = [];

  document
    .querySelectorAll(".param-row")
    .forEach((row) => {

      const enabled =
        row.querySelector(".param-check")?.checked;

      const key =
        row.querySelector(".param-key")?.value.trim();

      const value =
        row.querySelector(".param-value")?.value.trim();

      if (key) {
        result.push({
          key,
          value,
          enabled: !!enabled
        });
      }
    });

  return result;
}


function buildURL() {

  const base =
    $("url").value.trim();

  if (!base) return "";

  const params =
    getParams().filter(
      (param) => param.enabled && param.key
    );

  if (!params.length) {
    return base;
  }

  try {

    const url = new URL(base);

    params.forEach((param) => {
      url.searchParams.set(
        param.key,
        param.value
      );
    });

    return url.toString();

  } catch {

    const separator =
      base.includes("?") ? "&" : "?";

    return (
      base +
      separator +
      params
        .map(
          (param) =>
            `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`
        )
        .join("&")
    );
  }
}


function updateURLFromParams() {

  const base =
    $("url").value.trim();

  if (!base) return;

  try {

    const clean =
      new URL(base);

    clean.search = "";

    const params =
      getParams().filter(
        (param) => param.enabled && param.key
      );

    params.forEach((param) => {
      clean.searchParams.set(
        param.key,
        param.value
      );
    });

    $("url").value =
      clean.toString();

  } catch {
    /* Invalid URL — leave it alone */
  }
}


/* =========================================================
   HEADERS
========================================================= */

function addHeader(key = "", value = "") {

  const container =
    $("headersContainer");

  if (!container) return;

  const row =
    document.createElement("div");

  row.className =
    "header-row";

  row.innerHTML = `
    <input
      type="text"
      class="header-key"
      placeholder="Header name"
      value="${escapeHTML(key)}"
    >

    <input
      type="text"
      class="header-value"
      placeholder="Header value"
      value="${escapeHTML(value)}"
    >

    <button
      type="button"
      class="remove-header"
    >×</button>
  `;

  row
    .querySelector(".remove-header")
    .addEventListener("click", () => {
      row.remove();
    });

  container.appendChild(row);
}


function getHeaders() {

  const headers = {};

  document
    .querySelectorAll(".header-row")
    .forEach((row) => {

      const key =
        row.querySelector(".header-key")
          ?.value.trim();

      const value =
        row.querySelector(".header-value")
          ?.value.trim();

      if (key) {
        headers[key] = value;
      }
    });

  return headers;
}


/* =========================================================
   AUTH
========================================================= */

function updateAuthUI() {

  const type =
    $("authType")?.value || "none";

  document
    .querySelectorAll(".auth-fields")
    .forEach((field) => {
      field.classList.remove("active");
    });

  if (type === "bearer") {
    $("bearerFields")?.classList.add("active");
  }

  if (type === "basic") {
    $("basicFields")?.classList.add("active");
  }

  if (type === "apikey") {
    $("apiKeyFields")?.classList.add("active");
  }
}


function applyAuth(headers, params) {

  const type =
    $("authType")?.value || "none";

  if (type === "bearer") {

    const token =
      $("bearerToken")?.value.trim();

    if (token) {

      headers["Authorization"] =
        `Bearer ${token}`;
    }
  }


  if (type === "basic") {

    const username =
      $("basicUsername")?.value || "";

    const password =
      $("basicPassword")?.value || "";

    if (username || password) {

      const encoded =
        btoa(
          `${username}:${password}`
        );

      headers["Authorization"] =
        `Basic ${encoded}`;
    }
  }


  if (type === "apikey") {

    const name =
      $("apiKeyName")?.value.trim();

    const value =
      $("apiKeyValue")?.value.trim();

    const location =
      $("apiKeyLocation")?.value ||
      "header";

    if (name && value) {

      if (location === "header") {

        headers[name] = value;

      } else {

        params.push({
          key: name,
          value,
          enabled: true
        });
      }
    }
  }

  return {
    headers,
    params
  };
}


/* =========================================================
   BODY
========================================================= */

function getBody() {

  const raw =
    $("requestBody")?.value.trim();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}


/* =========================================================
   REQUEST OBJECT
========================================================= */

function buildRequestObject() {

  let headers =
    getHeaders();

  let params =
    getParams();

  const auth =
    applyAuth(
      headers,
      params
    );

  headers =
    auth.headers;

  params =
    auth.params;

  let baseURL =
    $("url").value.trim();

  let finalURL =
    buildURL();

  /*
    API key query parameter
  */

  const apiKeyParams =
    params.filter(
      (param) =>
        param.enabled &&
        param.key &&
        !getParams().some(
          (original) =>
            original.key === param.key
        )
    );

  if (apiKeyParams.length) {

    try {

      const url =
        new URL(finalURL);

      apiKeyParams.forEach(
        (param) => {
          url.searchParams.set(
            param.key,
            param.value
          );
        }
      );

      finalURL =
        url.toString();

    } catch {}
  }

  return {

    id: Date.now(),

    method:
      $("method").value,

    url:
      finalURL || baseURL,

    baseURL,

    params,

    headers,

    authType:
      $("authType")?.value || "none",

    body:
      getBody(),

    createdAt:
      new Date().toISOString()
  };
}


/* =========================================================
   JAVASCRIPT GENERATOR
========================================================= */

function generateJavaScript(request) {

  let code =
`fetch(${JSON.stringify(request.url)}, {
  method: ${JSON.stringify(request.method)}`;

  if (
    Object.keys(request.headers).length
  ) {

    code += `,
  headers: ${JSON.stringify(
      request.headers,
      null,
      2
    ).replace(/\n/g, "\n  ")}`;
  }

  if (
    request.body !== null &&
    !["GET", "HEAD"].includes(
      request.method
    )
  ) {

    if (
      typeof request.body === "string"
    ) {

      code += `,
  body: ${JSON.stringify(
        request.body
      )}`;

    } else {

      code += `,
  body: JSON.stringify(${JSON.stringify(
        request.body,
        null,
        2
      ).replace(/\n/g, "\n  ")})`;
    }
  }

  code += `
});`;

  return code;
}


/* =========================================================
   PYTHON GENERATOR
========================================================= */

function generatePython(request) {

  const method =
    request.method.toLowerCase();

  let code =
`import requests

response = requests.${method}(
    ${JSON.stringify(request.url)}`;

  if (
    Object.keys(request.headers).length
  ) {

    code += `,
    headers=${JSON.stringify(
      request.headers,
      null,
      4
    ).replace(/\n/g, "\n    ")}`;
  }

  if (
    request.body !== null &&
    !["get", "head"].includes(method)
  ) {

    if (
      typeof request.body === "string"
    ) {

      code += `,
    data=${JSON.stringify(
        request.body
      )}`;

    } else {

      code += `,
    json=${JSON.stringify(
        request.body,
        null,
        4
      ).replace(/\n/g, "\n    ")}`;
    }
  }

  code += `
)

print(response.status_code)
print(response.text)`;

  return code;
}


/* =========================================================
   CURL GENERATOR
========================================================= */

function generateCurl(request) {

  let code =
`curl -X ${request.method} "${request.url}"`;

  Object.entries(
    request.headers
  ).forEach(
    ([key, value]) => {

      code +=
` \\
  -H "${key}: ${value}"`;
    }
  );

  if (
    request.body !== null &&
    !["GET", "HEAD"].includes(
      request.method
    )
  ) {

    const body =
      typeof request.body === "string"
        ? request.body
        : JSON.stringify(
            request.body
          );

    code +=
` \\
  -d '${body}'`;
  }

  return code;
}


/* =========================================================
   JAVA GENERATOR
========================================================= */

function generateJava(request) {

  let code =
`HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${request.url}"))`;

  Object.entries(
    request.headers
  ).forEach(
    ([key, value]) => {

      code +=
`\n    .header("${key}", "${value}")`;
    }
  );

  if (
    request.body !== null &&
    !["GET", "HEAD"].includes(
      request.method
    )
  ) {

    const body =
      typeof request.body === "string"
        ? request.body
        : JSON.stringify(
            request.body
          );

    code +=
`\n    .method("${request.method}", HttpRequest.BodyPublishers.ofString(${JSON.stringify(body)}))`;

  } else {

    code +=
`\n    .method("${request.method}", HttpRequest.BodyPublishers.noBody())`;
  }

  code +=
`
    .build();

HttpResponse<String> response =
    HttpClient.newHttpClient().send(
        request,
        HttpResponse.BodyHandlers.ofString()
    );

System.out.println(response.body());`;

  return code;
}


/* =========================================================
   PHP GENERATOR
========================================================= */

function generatePHP(request) {

  let code =
`<?php

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => ${JSON.stringify(request.url)},
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => ${JSON.stringify(
      request.method
    )}`;

  if (
    Object.keys(request.headers).length
  ) {

    const headers =
      Object.entries(
        request.headers
      )
        .map(
          ([key, value]) =>
            `        ${JSON.stringify(
              `${key}: ${value}`
            )}`
        )
        .join(",\n");

    code += `,
    CURLOPT_HTTPHEADER => [
${headers}
    ]`;
  }

  if (
    request.body !== null &&
    !["GET", "HEAD"].includes(
      request.method
    )
  ) {

    const body =
      typeof request.body === "string"
        ? request.body
        : JSON.stringify(
            request.body
          );

    code += `,
    CURLOPT_POSTFIELDS => ${JSON.stringify(
      body
    )}`;
  }

  code += `
]);

$response = curl_exec($ch);

curl_close($ch);

echo $response;`;

  return code;
}


/* =========================================================
   ALL CODE
========================================================= */

function generateAllCode(request) {

  request.javascript =
    generateJavaScript(request);

  request.python =
    generatePython(request);

  request.curl =
    generateCurl(request);

  request.java =
    generateJava(request);

  request.php =
    generatePHP(request);
}


/* =========================================================
   SYNTAX HIGHLIGHTER
========================================================= */

function highlightCode(code, language) {

  let escaped =
    escapeHTML(code);

  /*
    Protect strings first.
  */

  const strings = [];

  escaped =
    escaped.replace(
      /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
      (match) => {

        const index =
          strings.push(match) - 1;

        return `___STRING_${index}___`;
      }
    );


  /*
    Comments
  */

  escaped =
    escaped.replace(
      /(\/\/.*$|#.*$)/gm,
      '<span class="token-comment">$1</span>'
    );


  /*
    Keywords
  */

  const keywords =
    /\b(const|let|var|function|return|import|from|async|await|new|class|public|private|static|void|if|else|for|while|try|catch|throw|def|True|False|None|echo|use)\b/g;

  escaped =
    escaped.replace(
      keywords,
      '<span class="token-keyword">$1</span>'
    );


  /*
    HTTP methods
  */

  escaped =
    escaped.replace(
      /\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g,
      '<span class="token-method">$1</span>'
    );


  /*
    Numbers
  */

  escaped =
    escaped.replace(
      /\b\d+(?:\.\d+)?\b/g,
      '<span class="token-number">$&</span>'
    );


  /*
    Booleans
  */

  escaped =
    escaped.replace(
      /\b(true|false|null|undefined)\b/g,
      '<span class="token-boolean">$1</span>'
    );


  /*
    Restore strings
  */

  escaped =
    escaped.replace(
      /___STRING_(\d+)___/g,
      (_, index) => {

        return `
          <span class="token-string">
            ${strings[Number(index)]}
          </span>
        `;
      }
    );


  return escaped;
}


/* =========================================================
   LINE NUMBERS
========================================================= */

function updateLineNumbers(code) {

  const lineNumbers =
    $("lineNumbers");

  if (!lineNumbers) return;

  const lines =
    code.split("\n").length;

  lineNumbers.textContent =
    Array.from(
      { length: lines },
      (_, index) => index + 1
    ).join("\n");
}


/* =========================================================
   SHOW CODE
========================================================= */

function showGeneratedCode() {

  if (!currentRequest) {

    $("generatedCode").textContent =
      "// Build a request to generate code.";

    updateLineNumbers(
      "// Build a request to generate code."
    );

    return;
  }

  let code =
    currentRequest[
      currentLanguage
    ];

  if (!code) {
    code = "// Code not available.";
  }

  const highlighted =
    highlightCode(
      code,
      currentLanguage
    );

  $("generatedCode").innerHTML =
    highlighted;

  updateLineNumbers(code);


  const languageNames = {
    javascript: "JavaScript",
    python: "Python",
    curl: "cURL",
    java: "Java",
    php: "PHP"
  };

  $("codeLanguage").textContent =
    languageNames[
      currentLanguage
    ] || currentLanguage;


  const fileNames = {
    javascript: "request.js",
    python: "request.py",
    curl: "request.sh",
    java: "Request.java",
    php: "request.php"
  };

  if ($("codeFileName")) {

    $("codeFileName").textContent =
      fileNames[
        currentLanguage
      ] || "request.txt";
  }
}


/* =========================================================
   SEND REQUEST
========================================================= */

async function sendRequest() {

  const url =
    $("url").value.trim();

  if (!url) {

    alert(
      "Please enter an API URL."
    );

    $("url").focus();

    return;
  }


  let request;

  try {

    request =
      buildRequestObject();

  } catch (error) {

    alert(
      "Unable to build request."
    );

    return;
  }


  currentRequest =
    request;

  generateAllCode(
    currentRequest
  );

  showGeneratedCode();


  const button =
    $("sendRequestBtn");

  button.disabled = true;

  button.textContent =
    "⏳ Sending...";


  $("responseStatus").textContent =
    "REQUESTING";

  $("responseStatus").className =
    "response-status";


  $("responseBody").textContent =
    "Sending request...";


  $("responseHeaders").textContent =
    "Waiting for response...";


  const start =
    performance.now();


  try {

    const options = {
      method:
        request.method,

      headers:
        request.headers
    };


    if (
      request.body !== null &&
      !["GET", "HEAD"].includes(
        request.method
      )
    ) {

      if (
        typeof request.body ===
        "string"
      ) {

        options.body =
          request.body;

      } else {

        options.body =
          JSON.stringify(
            request.body
          );
      }
    }


    const response =
      await fetch(
        request.url,
        options
      );


    const time =
      Math.round(
        performance.now() - start
      );


    const text =
      await response.text();


    let formatted =
      text;


    try {

      formatted =
        JSON.stringify(
          JSON.parse(text),
          null,
          2
        );

    } catch {
      /* Raw response */
    }


    $("statusCode").textContent =
      `${response.status} ${response.statusText}`;


    $("responseTime").textContent =
      `${time} ms`;


    $("responseSize").textContent =
      formatBytes(
        new Blob([text]).size
      );


    $("responseStatus").textContent =
      response.ok
        ? `${response.status} OK`
        : `${response.status} ERROR`;


    $("responseStatus").className =
      response.ok
        ? "response-status success"
        : "response-status error";


    $("responseBody").textContent =
      formatted;


    const responseHeaders = {};

    response.headers.forEach(
      (value, key) => {
        responseHeaders[key] =
          value;
      }
    );


    $("responseHeaders").textContent =
      JSON.stringify(
        responseHeaders,
        null,
        2
      );


    /*
      HISTORY
    */

    const historyItem = {
      ...request,

      id: Date.now(),

      status:
        response.status,

      responseTime:
        time,

      response:
        formatted,

      responseHeaders
    };


    historyData.unshift(
      historyItem
    );

    historyData =
      historyData.slice(
        0,
        50
      );


    saveStorage();

    renderHistory();


  } catch (error) {

    $("responseStatus").textContent =
      "ERROR";

    $("responseStatus").className =
      "response-status error";


    $("statusCode").textContent =
      "ERR";


    $("responseTime").textContent =
      "—";


    $("responseSize").textContent =
      "—";


    $("responseBody").textContent =
`Request failed.

${error.message}

Possible causes:
• CORS restriction
• Invalid URL
• Network unavailable
• API server unavailable`;


    $("responseHeaders").textContent =
      "// No response headers.";
  }


  button.disabled = false;

  button.textContent =
    "⚡ Send Request";
}


/* =========================================================
   FORMAT JSON
========================================================= */

function formatJSON() {

  const textarea =
    $("requestBody");

  if (!textarea) return;

  const value =
    textarea.value.trim();

  if (!value) return;

  try {

    textarea.value =
      JSON.stringify(
        JSON.parse(value),
        null,
        2
      );

  } catch {

    alert(
      "Invalid JSON."
    );
  }
}


/* =========================================================
   RESPONSE
========================================================= */

function clearResponse() {

  $("responseStatus").textContent =
    "NO RESPONSE";

  $("responseStatus").className =
    "response-status";

  $("statusCode").textContent =
    "—";

  $("responseTime").textContent =
    "—";

  $("responseSize").textContent =
    "—";

  $("responseBody").textContent =
    "// Send a request to see the response.";

  $("responseHeaders").textContent =
    "// Response headers will appear here.";
}


/* =========================================================
   COPY CODE
========================================================= */

async function copyCode() {

  if (!currentRequest) return;

  const code =
    currentRequest[
      currentLanguage
    ];

  if (!code) return;

  try {

    await navigator.clipboard
      .writeText(code);

    const button =
      $("copyCodeBtn");

    const old =
      button.textContent;

    button.textContent =
      "✓ Copied";

    setTimeout(
      () => {
        button.textContent =
          old;
      },
      1200
    );

  } catch {

    alert(
      "Unable to copy code."
    );
  }
}


/* =========================================================
   COPY RESPONSE
========================================================= */

async function copyResponse() {

  const text =
    $("responseBody").textContent;

  if (!text) return;

  try {

    await navigator.clipboard
      .writeText(text);

    const button =
      $("copyResponseBtn");

    const old =
      button.textContent;

    button.textContent =
      "✓ Copied";

    setTimeout(
      () => {
        button.textContent =
          old;
      },
      1200
    );

  } catch {

    alert(
      "Unable to copy response."
    );
  }
}


/* =========================================================
   SAVE REQUEST
========================================================= */

function saveRequest() {

  if (!currentRequest) {

    if (!$("url").value.trim()) {

      alert(
        "Enter a URL first."
      );

      return;
    }

    currentRequest =
      buildRequestObject();

    generateAllCode(
      currentRequest
    );
  }


  const name =
    prompt(
      "Request name:",
      `${currentRequest.method} Request`
    );


  if (!name) return;


  const item = {
    ...currentRequest,

    id: Date.now(),

    name:
      name.trim(),

    savedAt:
      new Date().toISOString()
  };


  savedData.unshift(item);

  savedData =
    savedData.slice(
      0,
      100
    );


  saveStorage();

  renderSaved();

  alert(
    "Request saved successfully!"
  );
}


/* =========================================================
   LOAD REQUEST
========================================================= */

function loadRequest(request) {

  currentRequest =
    JSON.parse(
      JSON.stringify(request)
    );


  $("method").value =
    request.method || "GET";


  $("url").value =
    request.baseURL ||
    request.url ||
    "";


  /*
    Params
  */

  $("paramsContainer").innerHTML =
    "";


  if (
    request.params &&
    request.params.length
  ) {

    request.params
      .filter(
        (param) =>
          param.key
      )
      .forEach(
        (param) => {

          addParam(
            param.key,
            param.value,
            param.enabled
          );
        }
      );

  } else {

    addParam();
  }


  /*
    Headers
  */

  $("headersContainer").innerHTML =
    "";


  Object.entries(
    request.headers || {}
  ).forEach(
    ([key, value]) => {

      addHeader(
        key,
        value
      );
    }
  );


  if (
    !Object.keys(
      request.headers || {}
    ).length
  ) {

    addHeader(
      "Content-Type",
      "application/json"
    );
  }


  /*
    Body
  */

  if (
    request.body === null ||
    request.body === undefined
  ) {

    $("requestBody").value =
      "";

  } else if (
    typeof request.body ===
    "string"
  ) {

    $("requestBody").value =
      request.body;

  } else {

    $("requestBody").value =
      JSON.stringify(
        request.body,
        null,
        2
      );
  }


  /*
    Auth
  */

  if ($("authType")) {

    $("authType").value =
      request.authType ||
      "none";

    updateAuthUI();
  }


  generateAllCode(
    currentRequest
  );

  showGeneratedCode();

  openPage("builder");
}


/* =========================================================
   HISTORY RENDER
========================================================= */

function renderHistory() {

  const container =
    $("historyList");

  if (!container) return;


  if (!historyData.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">↺</div>

        <h3>
          No request history
        </h3>

        <p>
          Requests you send will appear here.
        </p>
      </div>
    `;

    return;
  }


  container.innerHTML =
    historyData
      .map(
        (request, index) => {

          return `
            <div class="request-item">

              <div
                class="request-item-main"
                data-history-index="${index}"
              >

                <div class="request-item-top">

                  <span class="method-tag">
                    ${escapeHTML(
                      request.method
                    )}
                  </span>

                  <span class="request-item-name">
                    ${escapeHTML(
                      request.method +
                      " Request"
                    )}
                  </span>

                  ${
                    request.status
                      ? `
                        <span class="method-tag">
                          ${request.status}
                        </span>
                      `
                      : ""
                  }

                </div>

                <div class="request-item-url">
                  ${escapeHTML(
                    request.url
                  )}
                </div>

              </div>

              <button
                class="delete-request"
                data-history-delete="${index}"
              >
                ×
              </button>

            </div>
          `;
        }
      )
      .join("");
}


/* =========================================================
   SAVED RENDER
========================================================= */

function renderSaved() {

  const container =
    $("savedList");

  if (!container) return;


  if (!savedData.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ★
        </div>

        <h3>
          No saved requests
        </h3>

        <p>
          Save frequently used requests here.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML =
    savedData
      .map(
        (request, index) => {

          return `
            <div class="request-item">

              <div
                class="request-item-main"
                data-saved-index="${index}"
              >

                <div class="request-item-top">

                  <span class="method-tag">
                    ${escapeHTML(
                      request.method
                    )}
                  </span>

                  <span class="request-item-name">
                    ${escapeHTML(
                      request.name ||
                      "Saved Request"
                    )}
                  </span>

                </div>

                <div class="request-item-url">
                  ${escapeHTML(
                    request.url
                  )}
                </div>

              </div>

              <button
                class="delete-request"
                data-saved-delete="${index}"
              >
                ×
              </button>

            </div>
          `;
        }
      )
      .join("");
}


/* =========================================================
   COLLECTIONS
========================================================= */

function renderCollections() {

  const container =
    $("collectionsList");

  if (!container) return;


  if (!collectionsData.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ▣
        </div>

        <h3>
          No collections
        </h3>

        <p>
          Create a collection to organize your requests.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML =
    collectionsData
      .map(
        (collection, index) => {

          return `
            <div
              class="collection-card"
              data-collection-index="${index}"
            >

              <h3>
                ${escapeHTML(
                  collection.name
                )}
              </h3>

              <p>
                ${collection.requests?.length || 0}
                requests
              </p>

            </div>
          `;
        }
      )
      .join("");
}


/* =========================================================
   CREATE COLLECTION
========================================================= */

function createCollection() {

  const name =
    prompt(
      "Collection name:"
    );

  if (!name) return;


  collectionsData.push({

    id: Date.now(),

    name:
      name.trim(),

    requests: [],

    createdAt:
      new Date().toISOString()

  });


  saveStorage();

  renderCollections();
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function openPage(page) {

  document
    .querySelectorAll(".page")
    .forEach(
      (element) => {
        element.classList.remove(
          "active"
        );
      }
    );


  document
    .querySelectorAll(".nav-item")
    .forEach(
      (element) => {
        element.classList.remove(
          "active"
        );
      }
    );


  const pageMap = {

    builder: [
      "builderPage",
      "API Request Builder",
      "Build, test and generate API requests."
    ],

    history: [
      "historyPage",
      "Request History",
      "Your recently generated and tested requests."
    ],

    saved: [
      "savedPage",
      "Saved Requests",
      "Your frequently used API requests."
    ],

    collections: [
      "collectionsPage",
      "Collections",
      "Organize your API requests."
    ],

    generator: [
      "generatorPage",
      "Code Generator",
      "Generate code from your API request."
    ],

    settings: [
      "settingsPage",
      "Settings",
      "Customize your ReqGen workspace."
    ]

  };


  const info =
    pageMap[page];

  if (!info) return;


  $(info[0])
    ?.classList.add("active");


  $("pageTitle").textContent =
    info[1];

  $("pageSubtitle").textContent =
    info[2];


  const nav =
    document.querySelector(
      `[data-page="${page}"]`
    );

  nav?.classList.add("active");


  if (page === "history") {
    renderHistory();
  }

  if (page === "saved") {
    renderSaved();
  }

  if (page === "collections") {
    renderCollections();
  }


  closeMobileSidebar();
}


/* =========================================================
   NEW REQUEST
========================================================= */

function newRequest() {

  $("method").value =
    "GET";

  $("url").value =
    "";

  $("paramsContainer").innerHTML =
    "";

  $("headersContainer").innerHTML =
    "";

  $("requestBody").value =
    "";

  addHeader(
    "Content-Type",
    "application/json"
  );

  addParam();

  if ($("authType")) {

    $("authType").value =
      "none";

    updateAuthUI();
  }


  currentRequest =
    null;

  currentLanguage =
    "javascript";


  document
    .querySelectorAll(".code-tab")
    .forEach(
      (tab) => {

        tab.classList.toggle(
          "active",
          tab.dataset.language ===
            "javascript"
        );
      }
    );


  $("codeLanguage").textContent =
    "JavaScript";

  $("codeFileName").textContent =
    "request.js";


  $("generatedCode").textContent =
    "// Build a request to generate code.";

  updateLineNumbers(
    "// Build a request to generate code."
  );

  clearResponse();

  openPage("builder");
}


/* =========================================================
   FORMAT BYTES
========================================================= */

function formatBytes(bytes) {

  if (!bytes) return "0 B";

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );

  return (
    Math.round(
      (
        bytes /
        Math.pow(1024, index)
      ) * 100
    ) / 100
  ) +
  " " +
  units[index];
}


/* =========================================================
   REQUEST TABS
========================================================= */

document
  .querySelectorAll(".request-tab")
  .forEach(
    (tab) => {

      tab.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".request-tab"
            )
            .forEach(
              (item) => {
                item.classList.remove(
                  "active"
                );
              }
            );


          document
            .querySelectorAll(
              ".request-tab-content"
            )
            .forEach(
              (item) => {
                item.classList.remove(
                  "active"
                );
              }
            );


          tab.classList.add(
            "active"
          );


          const target =
            tab.dataset.requestTab;


          const panel =
            document.getElementById(
              `${target}Panel`
            );


          panel?.classList.add(
            "active"
          );
        }
      );
    }
  );


/* =========================================================
   RESPONSE TABS
========================================================= */

document
  .querySelectorAll(".response-tab")
  .forEach(
    (tab) => {

      tab.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".response-tab"
            )
            .forEach(
              (item) => {
                item.classList.remove(
                  "active"
                );
              }
            );


          document
            .querySelectorAll(
              ".response-content"
            )
            .forEach(
              (item) => {
                item.classList.remove(
                  "active"
                );
              }
            );


          tab.classList.add(
            "active"
          );


          if (
            tab.dataset.responseTab ===
            "body"
          ) {

            $("responseBodyPanel")
              .classList.add(
                "active"
              );

          } else {

            $("responseHeadersPanel")
              .classList.add(
                "active"
              );
          }
        }
      );
    }
  );


/* =========================================================
   CODE TABS
========================================================= */

document
  .querySelectorAll(".code-tab")
  .forEach(
    (tab) => {

      tab.addEventListener(
        "click",
        () => {

          currentLanguage =
            tab.dataset.language;

          document
            .querySelectorAll(
              ".code-tab"
            )
            .forEach(
              (item) => {
                item.classList.remove(
                  "active"
                );
              }
            );

          tab.classList.add(
            "active"
          );

          showGeneratedCode();
        }
      );
    }
  );


/* =========================================================
   AUTH
========================================================= */

$("authType")?.addEventListener(
  "change",
  updateAuthUI
);


/* =========================================================
   ADD PARAM
========================================================= */

$("addParamBtn")?.addEventListener(
  "click",
  () => {
    addParam();
  }
);


/* =========================================================
   ADD HEADER
========================================================= */

$("addHeaderBtn")?.addEventListener(
  "click",
  () => {
    addHeader();
  }
);


/* =========================================================
   FORMAT JSON
========================================================= */

$("formatBodyBtn")?.addEventListener(
  "click",
  formatJSON
);


/* =========================================================
   SEND
========================================================= */

$("sendRequestBtn")?.addEventListener(
  "click",
  sendRequest
);


/* =========================================================
   SAVE
========================================================= */

$("saveRequestBtn")?.addEventListener(
  "click",
  saveRequest
);


/* =========================================================
   COPY CODE
========================================================= */

$("copyCodeBtn")?.addEventListener(
  "click",
  copyCode
);


/* =========================================================
   COPY RESPONSE
========================================================= */

$("copyResponseBtn")?.addEventListener(
  "click",
  copyResponse
);


/* =========================================================
   NEW REQUEST
========================================================= */

$("newRequestBtn")?.addEventListener(
  "click",
  newRequest
);


/* =========================================================
   NAVIGATION
========================================================= */

document
  .querySelectorAll(".nav-item")
  .forEach(
    (item) => {

      item.addEventListener(
        "click",
        () => {

          openPage(
            item.dataset.page
          );
        }
      );
    }
  );


/* =========================================================
   HISTORY EVENTS
========================================================= */

$("historyList")?.addEventListener(
  "click",
  (event) => {

    const deleteButton =
      event.target.closest(
        "[data-history-delete]"
      );


    if (deleteButton) {

      const index =
        Number(
          deleteButton.dataset
            .historyDelete
        );


      historyData.splice(
        index,
        1
      );

      saveStorage();

      renderHistory();

      return;
    }


    const item =
      event.target.closest(
        "[data-history-index]"
      );


    if (item) {

      const index =
        Number(
          item.dataset
            .historyIndex
        );


      loadRequest(
        historyData[index]
      );
    }
  }
);


/* =========================================================
   SAVED EVENTS
========================================================= */

$("savedList")?.addEventListener(
  "click",
  (event) => {

    const deleteButton =
      event.target.closest(
        "[data-saved-delete]"
      );


    if (deleteButton) {

      const index =
        Number(
          deleteButton.dataset
            .savedDelete
        );


      savedData.splice(
        index,
        1
      );

      saveStorage();

      renderSaved();

      return;
    }


    const item =
      event.target.closest(
        "[data-saved-index]"
      );


    if (item) {

      const index =
        Number(
          item.dataset
            .savedIndex
        );


      loadRequest(
        savedData[index]
      );
    }
  }
);


/* =========================================================
   COLLECTIONS
========================================================= */

$("newCollectionBtn")?.addEventListener(
  "click",
  createCollection
);


/* =========================================================
   CLEAR HISTORY
========================================================= */

$("clearHistoryBtn")?.addEventListener(
  "click",
  () => {

    if (
      !confirm(
        "Clear all request history?"
      )
    ) {
      return;
    }

    historyData = [];

    saveStorage();

    renderHistory();
  }
);


/* =========================================================
   CLEAR SAVED
========================================================= */

$("clearSavedBtn")?.addEventListener(
  "click",
  () => {

    if (
      !confirm(
        "Delete all saved requests?"
      )
    ) {
      return;
    }

    savedData = [];

    saveStorage();

    renderSaved();
  }
);


/* =========================================================
   OPEN BUILDER
========================================================= */

$("openBuilderBtn")?.addEventListener(
  "click",
  () => {
    openPage("builder");
  }
);


/* =========================================================
   MOBILE MENU
========================================================= */

function closeMobileSidebar() {

  $("sidebar")
    ?.classList.remove("open");

  $("sidebarOverlay")
    ?.classList.remove("active");
}


$("mobileMenu")?.addEventListener(
  "click",
  () => {

    $("sidebar")
      ?.classList.toggle("open");

    $("sidebarOverlay")
      ?.classList.toggle("active");
  }
);


$("sidebarOverlay")?.addEventListener(
  "click",
  closeMobileSidebar
);


/* =========================================================
   URL ENTER
========================================================= */

$("url")?.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter"
    ) {

      sendRequest();
    }
  }
);


/* =========================================================
   SETTINGS
========================================================= */

$("syntaxHighlighting")?.addEventListener(
  "change",
  (event) => {

    settings.syntaxHighlighting =
      event.target.checked;

    saveStorage();

    showGeneratedCode();
  }
);


$("autoFormat")?.addEventListener(
  "change",
  (event) => {

    settings.autoFormat =
      event.target.checked;

    saveStorage();
  }
);


$("saveHistory")?.addEventListener(
  "change",
  (event) => {

    settings.saveHistory =
      event.target.checked;

    saveStorage();
  }
);


/* =========================================================
   INITIALIZE
========================================================= */

function initialize() {

  /*
    Default Params
  */

  if (
    $("paramsContainer") &&
    !$("paramsContainer").children.length
  ) {
    addParam();
  }


  /*
    Default Headers
  */

  if (
    $("headersContainer") &&
    !$("headersContainer").children.length
  ) {

    addHeader(
      "Content-Type",
      "application/json"
    );
  }


  /*
    Settings
  */

  if (
    $("syntaxHighlighting") &&
    settings.syntaxHighlighting !== undefined
  ) {

    $("syntaxHighlighting").checked =
      settings.syntaxHighlighting;
  }


  if (
    $("autoFormat") &&
    settings.autoFormat !== undefined
  ) {

    $("autoFormat").checked =
      settings.autoFormat;
  }


  if (
    $("saveHistory") &&
    settings.saveHistory !== undefined
  ) {

    $("saveHistory").checked =
      settings.saveHistory;
  }


  updateAuthUI();

  renderHistory();

  renderSaved();

  renderCollections();

  clearResponse();

  showGeneratedCode();
}


initialize();
