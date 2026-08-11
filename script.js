/* =========================================
   REQGEN V2
   History + Saved Requests
========================================= */

const methodInput = document.querySelector(".method");
const urlInput = document.querySelector(".url-input");
const bodyInput = document.querySelector("textarea");

const headersContainer = document.getElementById("headers");
const addHeaderBtn = document.getElementById("addHeader");

const javascriptOutput = document.getElementById("javascriptOutput");
const pythonOutput = document.getElementById("pythonOutput");
const curlOutput = document.getElementById("curlOutput");

const generateButtons = [
  document.getElementById("generate"),
  document.getElementById("generateRequest")
];

let headers = [];


/* =========================================
   STORAGE
========================================= */

const HISTORY_KEY = "reqgen_history";
const SAVED_KEY = "reqgen_saved";

function getHistory() {
  return JSON.parse(
    localStorage.getItem(HISTORY_KEY) || "[]"
  );
}

function getSaved() {
  return JSON.parse(
    localStorage.getItem(SAVED_KEY) || "[]"
  );
}

function saveHistory(data) {
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(data)
  );
}

function saveSaved(data) {
  localStorage.setItem(
    SAVED_KEY,
    JSON.stringify(data)
  );
}


/* =========================================
   HEADERS
========================================= */

function addHeader(key = "", value = "") {
  headers.push({ key, value });
  renderHeaders();
}

function removeHeader(index) {
  headers.splice(index, 1);
  renderHeaders();
}

function renderHeaders() {

  if (!headersContainer) return;

  headersContainer.innerHTML = "";

  headers.forEach((header, index) => {

    const row = document.createElement("div");

    row.className = "header-item";

    row.innerHTML = `
      <input
        type="text"
        class="header-key"
        placeholder="Header name"
        value="${escapeHtml(header.key)}"
      >

      <input
        type="text"
        class="header-value"
        placeholder="Header value"
        value="${escapeHtml(header.value)}"
      >

      <button
        type="button"
        class="btn-danger"
        data-remove="${index}"
      >
        Remove
      </button>
    `;

    headersContainer.appendChild(row);
  });


  document
    .querySelectorAll(".header-key")
    .forEach((input, index) => {

      input.addEventListener("input", e => {
        headers[index].key = e.target.value;
      });

    });


  document
    .querySelectorAll(".header-value")
    .forEach((input, index) => {

      input.addEventListener("input", e => {
        headers[index].value = e.target.value;
      });

    });


  document
    .querySelectorAll("[data-remove]")
    .forEach(button => {

      button.addEventListener("click", () => {
        removeHeader(
          Number(button.dataset.remove)
        );
      });

    });
}


/* =========================================
   HELPERS
========================================= */

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function getHeaders() {

  const result = {};

  headers.forEach(header => {

    const key = header.key.trim();

    if (!key) return;

    result[key] = header.value;

  });

  return result;
}


function getBody() {

  if (!bodyInput) return null;

  const value = bodyInput.value.trim();

  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}


/* =========================================
   REQUEST OBJECT
========================================= */

function getCurrentRequest() {

  return {
    id: Date.now(),
    method: methodInput?.value || "GET",
    url: urlInput?.value.trim() || "",
    headers: getHeaders(),
    body: getBody(),
    createdAt: new Date().toLocaleString()
  };

}


/* =========================================
   JAVASCRIPT
========================================= */

function generateJavaScript(
  method,
  url,
  requestHeaders,
  body
) {

  let code = `fetch("${url}", {
  method: "${method}"`;

  if (Object.keys(requestHeaders).length) {

    code += `,
  headers: ${JSON.stringify(
    requestHeaders,
    null,
    2
  )}`;

  }

  if (
    body !== null &&
    ["POST", "PUT", "PATCH"].includes(method)
  ) {

    code += `,
  body: JSON.stringify(${JSON.stringify(
      body,
      null,
      2
    )})`;

  }

  code += `
});`;

  return code;
}


/* =========================================
   PYTHON
========================================= */

function generatePython(
  method,
  url,
  requestHeaders,
  body
) {

  let code =
`import requests

response = requests.${method.toLowerCase()}(
    "${url}"`;

  if (Object.keys(requestHeaders).length) {

    code += `,
    headers=${JSON.stringify(
      requestHeaders,
      null,
      4
    ).replace(/^/gm, "    ")}`;

  }

  if (
    body !== null &&
    ["POST", "PUT", "PATCH"].includes(method)
  ) {

    code += `,
    json=${JSON.stringify(
      body,
      null,
      4
    ).replace(/^/gm, "    ")}`;

  }

  code += `
)

print(response.json())`;

  return code;
}


/* =========================================
   CURL
========================================= */

function generateCurl(
  method,
  url,
  requestHeaders,
  body
) {

  let code =
    `curl -X ${method} "${url}"`;

  Object.entries(requestHeaders)
    .forEach(([key, value]) => {

      code +=
        ` \\\n  -H "${key}: ${value}"`;

    });

  if (
    body !== null &&
    ["POST", "PUT", "PATCH"].includes(method)
  ) {

    code +=
      ` \\\n  -d '${JSON.stringify(body)}'`;

  }

  return code;
}


/* =========================================
   GENERATE
========================================= */

function generateCode() {

  const request = getCurrentRequest();

  if (!request.url) {
    alert("Please enter an API URL.");
    return;
  }

  const js = generateJavaScript(
    request.method,
    request.url,
    request.headers,
    request.body
  );

  const python = generatePython(
    request.method,
    request.url,
    request.headers,
    request.body
  );

  const curl = generateCurl(
    request.method,
    request.url,
    request.headers,
    request.body
  );


  if (javascriptOutput)
    javascriptOutput.textContent = js;

  if (pythonOutput)
    pythonOutput.textContent = python;

  if (curlOutput)
    curlOutput.textContent = curl;


  /* Automatically add to history */
  addToHistory(request);

  showToast("Request generated ✓");
}


/* =========================================
   HISTORY
========================================= */

function addToHistory(request) {

  let history = getHistory();

  /* newest first */
  history.unshift(request);

  /* Keep last 50 */
  history = history.slice(0, 50);

  saveHistory(history);

  renderHistory();
}


function deleteHistory(id) {

  const history =
    getHistory().filter(item => item.id !== id);

  saveHistory(history);

  renderHistory();

  showToast("History deleted");
}


function clearHistory() {

  localStorage.removeItem(HISTORY_KEY);

  renderHistory();

  showToast("History cleared");
}


/* =========================================
   SAVED REQUESTS
========================================= */

function saveCurrentRequest() {

  const request = getCurrentRequest();

  if (!request.url) {
    alert("Enter a URL first.");
    return;
  }

  const name =
    prompt(
      "Enter a name for this request:",
      `${request.method} Request`
    );

  if (!name) return;

  request.name = name;

  let saved = getSaved();

  saved.unshift(request);

  saveSaved(saved);

  renderSaved();

  showToast("Request saved ✓");
}


function deleteSaved(id) {

  const saved =
    getSaved().filter(item => item.id !== id);

  saveSaved(saved);

  renderSaved();

  showToast("Saved request deleted");
}


/* =========================================
   LOAD REQUEST
========================================= */

function loadRequest(request) {

  if (methodInput)
    methodInput.value = request.method;

  if (urlInput)
    urlInput.value = request.url;

  headers = Object.entries(
    request.headers || {}
  ).map(([key, value]) => ({
    key,
    value
  }));

  renderHeaders();

  if (bodyInput) {

    bodyInput.value =
      request.body
        ? JSON.stringify(
            request.body,
            null,
            2
          )
        : "";

  }

  showToast("Request loaded ✓");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================
   HISTORY UI
========================================= */

function renderHistory() {

  const container =
    document.getElementById("historyList");

  if (!container) return;

  const history = getHistory();

  if (!history.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div>🕘</div>
        <p>No request history yet.</p>
      </div>
    `;

    return;
  }


  container.innerHTML = history.map(item => `

    <div class="request-item">

      <div
        class="request-main"
        data-load-history="${item.id}"
      >

        <span class="request-method">
          ${escapeHtml(item.method)}
        </span>

        <span class="request-url">
          ${escapeHtml(item.url)}
        </span>

        <small>
          ${escapeHtml(item.createdAt)}
        </small>

      </div>

      <button
        class="delete-btn"
        data-delete-history="${item.id}"
      >
        ×
      </button>

    </div>

  `).join("");


  container
    .querySelectorAll("[data-load-history]")
    .forEach(item => {

      item.addEventListener("click", () => {

        const id =
          Number(item.dataset.loadHistory);

        const request =
          getHistory().find(
            x => x.id === id
          );

        if (request)
          loadRequest(request);

      });

    });


  container
    .querySelectorAll("[data-delete-history]")
    .forEach(button => {

      button.addEventListener("click", e => {

        e.stopPropagation();

        deleteHistory(
          Number(
            button.dataset.deleteHistory
          )
        );

      });

    });

}


/* =========================================
   SAVED UI
========================================= */

function renderSaved() {

  const container =
    document.getElementById("savedList");

  if (!container) return;

  const saved = getSaved();

  if (!saved.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div>⭐</div>
        <p>No saved requests yet.</p>
      </div>
    `;

    return;
  }


  container.innerHTML = saved.map(item => `

    <div class="request-item">

      <div
        class="request-main"
        data-load-saved="${item.id}"
      >

        <strong>
          ${escapeHtml(
            item.name || "Unnamed Request"
          )}
        </strong>

        <span class="request-method">
          ${escapeHtml(item.method)}
        </span>

        <span class="request-url">
          ${escapeHtml(item.url)}
        </span>

      </div>

      <button
        class="delete-btn"
        data-delete-saved="${item.id}"
      >
        ×
      </button>

    </div>

  `).join("");


  container
    .querySelectorAll("[data-load-saved]")
    .forEach(item => {

      item.addEventListener("click", () => {

        const id =
          Number(item.dataset.loadSaved);

        const request =
          getSaved().find(
            x => x.id === id
          );

        if (request)
          loadRequest(request);

      });

    });


  container
    .querySelectorAll("[data-delete-saved]")
    .forEach(button => {

      button.addEventListener("click", e => {

        e.stopPropagation();

        deleteSaved(
          Number(
            button.dataset.deleteSaved
          )
        );

      });

    });

}


/* =========================================
   TOAST
========================================= */

function showToast(message) {

  let toast =
    document.getElementById("reqgenToast");

  if (!toast) {

    toast = document.createElement("div");

    toast.id = "reqgenToast";

    toast.style.cssText = `
      position: fixed;
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%);
      background: #168cff;
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      z-index: 99999;
      font-weight: 600;
      box-shadow: 0 8px 30px rgba(0,0,0,.35);
    `;

    document.body.appendChild(toast);
  }

  toast.textContent = message;

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    toast.remove();
  }, 1800);
}


/* =========================================
   BUTTON EVENTS
========================================= */

generateButtons.forEach(button => {

  if (!button) return;

  button.addEventListener(
    "click",
    generateCode
  );

});


if (addHeaderBtn) {

  addHeaderBtn.addEventListener(
    "click",
    () => addHeader()
  );

}


/* =========================================
   SAVE BUTTON
========================================= */

document
  .querySelectorAll(
    "#saveRequest, .save-request, [data-action='save']"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      saveCurrentRequest
    );

  });


/* =========================================
   HISTORY BUTTON
========================================= */

document
  .querySelectorAll(
    "#historyBtn, [data-page='history']"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const history =
          getHistory();

        if (!history.length) {
          showToast("No history yet");
        }

        renderHistory();

      }
    );

  });


/* =========================================
   SAVED BUTTON
========================================= */

document
  .querySelectorAll(
    "#savedBtn, [data-page='saved']"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        renderSaved();

      }
    );

  });


/* =========================================
   INITIALIZE
========================================= */

renderHeaders();
renderHistory();
renderSaved();

console.log(
  "ReqGen V2 initialized successfully."
);
