/* =========================================
   REQGEN V3 — SCRIPT
   Production by BLOOD-CO
========================================= */

"use strict";

/* =========================================
   STORAGE
========================================= */

const HISTORY_KEY = "reqgen_v3_history";
const SAVED_KEY = "reqgen_v3_saved";

let historyData = JSON.parse(
  localStorage.getItem(HISTORY_KEY) || "[]"
);

let savedData = JSON.parse(
  localStorage.getItem(SAVED_KEY) || "[]"
);

let currentRequest = null;
let currentLanguage = "javascript";


/* =========================================
   HELPERS
========================================= */

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
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


/* =========================================
   REQUEST HEADERS
========================================= */

function addHeader(key = "", value = "") {

  const container = $("headersContainer");

  const row = document.createElement("div");

  row.className = "header-row";

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
      title="Remove header"
    >
      ×
    </button>
  `;

  row
    .querySelector(".remove-header")
    .addEventListener("click", () => {
      row.remove();
    });

  container.appendChild(row);
}


function getRequestHeaders() {

  const result = {};

  document
    .querySelectorAll(".header-row")
    .forEach((row) => {

      const key =
        row
          .querySelector(".header-key")
          .value
          .trim();

      const value =
        row
          .querySelector(".header-value")
          .value
          .trim();

      if (key) {
        result[key] = value;
      }
    });

  return result;
}


/* =========================================
   BODY
========================================= */

function getParsedBody() {

  const raw = $("requestBody").value.trim();

  if (!raw) {
    return null;
  }

  try {

    return JSON.parse(raw);

  } catch {

    return raw;
  }
}


/* =========================================
   CODE GENERATORS
========================================= */

function generateJavaScript(request) {

  let code =
`fetch(${JSON.stringify(request.url)}, {
  method: "${request.method}"`;

  if (Object.keys(request.headers).length > 0) {

    code += `,
  headers: ${JSON.stringify(
    request.headers,
    null,
    2
  ).replace(/\n/g, "\n  ")}`;
  }

  if (
    request.body !== null &&
    !["GET", "HEAD"].includes(request.method)
  ) {

    if (typeof request.body === "string") {

      code += `,
  body: ${JSON.stringify(request.body)}`;

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


function generatePython(request) {

  const method =
    request.method.toLowerCase();

  let code =
`import requests

response = requests.${method}(
    ${JSON.stringify(request.url)}`;

  if (
    Object.keys(request.headers).length > 0
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

    if (typeof request.body === "string") {

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


function generateCurl(request) {

  let code =
`curl -X ${request.method} "${request.url}"`;

  Object.entries(request.headers)
    .forEach(([key, value]) => {

      code +=
` \\
  -H "${key}: ${value}"`;
    });

  if (
    request.body !== null &&
    !["GET", "HEAD"].includes(request.method)
  ) {

    let bodyText;

    if (typeof request.body === "string") {

      bodyText = request.body;

    } else {

      bodyText = JSON.stringify(
        request.body
      );
    }

    code +=
` \\
  -d '${bodyText}'`;
  }

  return code;
}


/* =========================================
   GENERATE ALL CODE
========================================= */

function buildRequestObject() {

  return {

    id: Date.now(),

    method: $("method").value,

    url: $("url").value.trim(),

    headers: getRequestHeaders(),

    body: getParsedBody(),

    createdAt:
      new Date().toISOString()
  };
}


function generateAllCode(request) {

  request.javascript =
    generateJavaScript(request);

  request.python =
    generatePython(request);

  request.curl =
    generateCurl(request);
}


/* =========================================
   SHOW GENERATED CODE
========================================= */

function showGeneratedCode() {

  if (!currentRequest) {
    return;
  }

  const output =
    $("generatedCode");

  const languageLabel =
    $("codeLanguage");

  if (currentLanguage === "javascript") {

    output.textContent =
      currentRequest.javascript;

    languageLabel.textContent =
      "JavaScript";

  }

  else if (currentLanguage === "python") {

    output.textContent =
      currentRequest.python;

    languageLabel.textContent =
      "Python";

  }

  else {

    output.textContent =
      currentRequest.curl;

    languageLabel.textContent =
      "cURL";
  }
}


/* =========================================
   RESPONSE
========================================= */

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


function showResponseError(message) {

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
    message;
}


/* =========================================
   SEND API REQUEST
========================================= */

async function sendRequest() {

  const method =
    $("method").value;

  const url =
    $("url").value.trim();

  if (!url) {

    alert("Please enter an API URL.");

    $("url").focus();

    return;
  }


  let headers =
    getRequestHeaders();

  let body =
    $("requestBody").value.trim();


  /* Prevent invalid JSON */

  if (body) {

    try {

      JSON.parse(body);

    } catch {

      if (
        headers["Content-Type"] &&
        headers["Content-Type"]
          .toLowerCase()
          .includes("application/json")
      ) {

        alert(
          "Invalid JSON body. Please check your JSON."
        );

        return;
      }
    }
  }


  const button =
    $("sendRequestBtn");

  const oldText =
    button.textContent;

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


  const startTime =
    performance.now();


  try {

    const options = {

      method: method,

      headers: headers
    };


    /*
      Only attach body to methods
      that normally support a body.
    */

    if (
      body &&
      !["GET", "HEAD"].includes(method)
    ) {

      options.body = body;
    }


    const response =
      await fetch(url, options);


    const endTime =
      performance.now();

    const responseTime =
      Math.round(
        endTime - startTime
      );


    /* STATUS */

    $("statusCode").textContent =
      `${response.status} ${response.statusText}`;


    $("responseTime").textContent =
      `${responseTime} ms`;


    $("responseStatus").textContent =
      response.ok
        ? `${response.status} OK`
        : `${response.status} ERROR`;


    $("responseStatus").className =
      response.ok
        ? "response-status success"
        : "response-status error";


    /* HEADERS */

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


    /* BODY */

    const text =
      await response.text();


    let formattedBody =
      text;


    try {

      const json =
        JSON.parse(text);

      formattedBody =
        JSON.stringify(
          json,
          null,
          2
        );

    } catch {

      /* Not JSON */
    }


    $("responseBody").textContent =
      formattedBody;


    /* SIZE */

    const size =
      new Blob([text]).size;

    $("responseSize").textContent =
      formatBytes(size);


    /* SAVE REQUEST TO HISTORY */

    const historyRequest =
      buildRequestObject();

    generateAllCode(
      historyRequest
    );


    historyRequest.status =
      response.status;

    historyRequest.responseTime =
      responseTime;


    historyRequest.response =
      formattedBody;


    historyData.unshift(
      historyRequest
    );


    historyData =
      historyData.slice(0, 50);


    saveStorage();

    renderHistory();


  } catch (error) {

    console.error(error);


    showResponseError(
      `Request failed.\n\n${error.message}\n\nPossible reasons:\n• Invalid URL\n• Network error\n• CORS restriction\n• Target API unavailable`
    );

  }


  button.disabled = false;

  button.textContent =
    oldText;
}


/* =========================================
   FORMAT BYTES
========================================= */

function formatBytes(bytes) {

  if (bytes === 0) {
    return "0 B";
  }

  if (!bytes) {
    return "—";
  }

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
    parseFloat(
      (
        bytes /
        Math.pow(1024, index)
      ).toFixed(2)
    )
    +
    " " +
    units[index]
  );
}


/* =========================================
   SAVE REQUEST
========================================= */

function saveRequest() {

  if (!currentRequest) {

    if (!$("url").value.trim()) {

      alert(
        "Enter a URL and generate/test the request first."
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
      "Enter a name for this request:",
      `${currentRequest.method} Request`
    );


  if (!name) {
    return;
  }


  const saved =
    {
      ...currentRequest,

      id: Date.now(),

      name:
        name.trim(),

      savedAt:
        new Date().toISOString()
    };


  savedData.unshift(
    saved
  );


  savedData =
    savedData.slice(0, 50);


  saveStorage();

  renderSaved();


  alert(
    "Request saved successfully!"
  );
}


/* =========================================
   LOAD REQUEST
========================================= */

function loadRequest(request) {

  currentRequest =
    {
      ...request
    };


  $("method").value =
    request.method || "GET";


  $("url").value =
    request.url || "";


  $("requestBody").value =
    typeof request.body === "string"
      ? request.body
      : request.body
        ? JSON.stringify(
            request.body,
            null,
            2
          )
        : "";


  $("headersContainer").innerHTML =
    "";


  const requestHeaders =
    request.headers || {};


  Object.entries(
    requestHeaders
  ).forEach(
    ([key, value]) => {

      addHeader(
        key,
        value
      );
    }
  );


  if (
    Object.keys(
      requestHeaders
    ).length === 0
  ) {

    addHeader();
  }


  generateAllCode(
    currentRequest
  );


  showGeneratedCode();

  clearResponse();

  openPage("builder");
}


/* =========================================
   HISTORY
========================================= */

function renderHistory() {

  const container =
    $("historyList");


  if (!historyData.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ↺
        </div>

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

          const status =
            request.status || "—";

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
                        <span
                          class="method-tag"
                          style="
                            color:${
                              request.status >= 200 &&
                              request.status < 300
                                ? "#29d391"
                                : "#ff6078"
                            };
                          "
                        >
                          ${status}
                        </span>
                      `
                      : ""
                  }

                </div>

                <div
                  class="request-item-url"
                >
                  ${escapeHTML(
                    request.url
                  )}
                </div>

              </div>


              <button
                type="button"
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


/* =========================================
   SAVED
========================================= */

function renderSaved() {

  const container =
    $("savedList");


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

                <div
                  class="request-item-url"
                >
                  ${escapeHTML(
                    request.url
                  )}
                </div>

              </div>


              <button
                type="button"
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


/* =========================================
   PAGE NAVIGATION
========================================= */

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


  if (page === "builder") {

    $("builderPage")
      .classList.add("active");

    document
      .querySelector(
        '[data-page="builder"]'
      )
      .classList.add("active");


    $("pageTitle").textContent =
      "API Request Tester";


    $("pageSubtitle").textContent =
      "Build, test and generate API requests.";
  }


  if (page === "history") {

    $("historyPage")
      .classList.add("active");

    document
      .querySelector(
        '[data-page="history"]'
      )
      .classList.add("active");


    $("pageTitle").textContent =
      "Request History";


    $("pageSubtitle").textContent =
      "Your recently generated and tested requests.";


    renderHistory();
  }


  if (page === "saved") {

    $("savedPage")
      .classList.add("active");

    document
      .querySelector(
        '[data-page="saved"]'
      )
      .classList.add("active");


    $("pageTitle").textContent =
      "Saved Requests";


    $("pageSubtitle").textContent =
      "Your frequently used API requests.";


    renderSaved();
  }


  closeMobileSidebar();
}


/* =========================================
   NEW REQUEST
========================================= */

function newRequest() {

  $("method").value =
    "GET";

  $("url").value =
    "";

  $("requestBody").value =
    "";


  $("headersContainer")
    .innerHTML = "";


  addHeader(
    "Content-Type",
    "application/json"
  );


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


  $("generatedCode").textContent =
    "// Build a request to generate code.";


  $("codeLanguage").textContent =
    "JavaScript";


  clearResponse();

  openPage("builder");
}


/* =========================================
   RESPONSE TABS
========================================= */

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


/* =========================================
   CODE TABS
========================================= */

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


/* =========================================
   COPY CODE
========================================= */

$("copyCodeBtn")
  .addEventListener(
    "click",
    async () => {

      const code =
        $("generatedCode")
          .textContent;


      if (
        !code ||
        code.startsWith("// Build")
      ) {

        return;
      }


      try {

        await navigator.clipboard
          .writeText(code);


        const button =
          $("copyCodeBtn");

        const old =
          button.textContent;


        button.textContent =
          "Copied!";


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
  );


/* =========================================
   COPY RESPONSE
========================================= */

$("copyResponseBtn")
  .addEventListener(
    "click",
    async () => {

      const response =
        $("responseBody")
          .textContent;


      if (!response) {
        return;
      }


      try {

        await navigator.clipboard
          .writeText(response);


        const button =
          $("copyResponseBtn");

        const old =
          button.textContent;


        button.textContent =
          "Copied!";


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
  );


/* =========================================
   ADD HEADER
========================================= */

$("addHeaderBtn")
  .addEventListener(
    "click",
    () => {

      addHeader();
    }
  );


/* =========================================
   SEND
========================================= */

$("sendRequestBtn")
  .addEventListener(
    "click",
    sendRequest
  );


/* =========================================
   SAVE
========================================= */

$("saveRequestBtn")
  .addEventListener(
    "click",
    saveRequest
  );


/* =========================================
   NEW REQUEST
========================================= */

$("newRequestBtn")
  .addEventListener(
    "click",
    newRequest
  );


/* =========================================
   NAVIGATION
========================================= */

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


/* =========================================
   HISTORY EVENTS
========================================= */

$("historyList")
  .addEventListener(
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


/* =========================================
   SAVED EVENTS
========================================= */

$("savedList")
  .addEventListener(
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


/* =========================================
   CLEAR HISTORY
========================================= */

$("clearHistoryBtn")
  .addEventListener(
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


/* =========================================
   CLEAR SAVED
========================================= */

$("clearSavedBtn")
  .addEventListener(
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


/* =========================================
   MOBILE SIDEBAR
========================================= */

function closeMobileSidebar() {

  const sidebar =
    document.querySelector(
      ".sidebar"
    );

  const overlay =
    $("sidebarOverlay");


  sidebar.classList.remove(
    "open"
  );

  overlay.classList.remove(
    "active"
  );
}


$("mobileMenu")
  .addEventListener(
    "click",
    () => {

      const sidebar =
        document.querySelector(
          ".sidebar"
        );

      const overlay =
        $("sidebarOverlay");


      sidebar.classList.toggle(
        "open"
      );

      overlay.classList.toggle(
        "active"
      );
    }
  );


$("sidebarOverlay")
  .addEventListener(
    "click",
    closeMobileSidebar
  );


/* =========================================
   URL ENTER KEY
========================================= */

$("url")
  .addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        sendRequest();
      }
    }
  );


/* =========================================
   INITIALIZE
========================================= */

function initialize() {

  /*
    Default header
  */

  if (
    $("headersContainer")
      .children.length === 0
  ) {

    addHeader(
      "Content-Type",
      "application/json"
    );
  }


  renderHistory();

  renderSaved();

  clearResponse();
}


initialize();
