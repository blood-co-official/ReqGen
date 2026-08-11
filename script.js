const methodInput = document.querySelector(".method");
const urlInput = document.querySelector(".url-input");
const bodyInput = document.querySelector("textarea");

const addHeaderBtn = document.querySelector("#addHeader");
const generateBtn = document.querySelector("#generate");
const headersContainer = document.querySelector("#headers");

const javascriptOutput = document.querySelector("#javascriptOutput");
const pythonOutput = document.querySelector("#pythonOutput");
const curlOutput = document.querySelector("#curlOutput");

let headers = [
  {
    key: "Content-Type",
    value: "application/json"
  }
];

/* =========================
   HEADER SYSTEM
========================= */

function renderHeaders() {
  headersContainer.innerHTML = "";

  headers.forEach((header, index) => {
    const wrapper = document.createElement("div");

    wrapper.className = "header-item";

    wrapper.innerHTML = `
      <input
        type="text"
        placeholder="Header name"
        value="${escapeHtml(header.key)}"
        data-index="${index}"
        data-type="key"
      >

      <input
        type="text"
        placeholder="Header value"
        value="${escapeHtml(header.value)}"
        data-index="${index}"
        data-type="value"
      >

      <button
        type="button"
        class="btn btn-danger"
        data-remove="${index}"
      >
        Remove
      </button>
    `;

    headersContainer.appendChild(wrapper);
  });
}


/* Add header */

addHeaderBtn.addEventListener("click", () => {
  headers.push({
    key: "",
    value: ""
  });

  renderHeaders();
});


/* Update headers */

headersContainer.addEventListener("input", (event) => {
  const index = event.target.dataset.index;
  const type = event.target.dataset.type;

  if (index === undefined || !type) return;

  headers[index][type] = event.target.value;
});


/* Remove header */

headersContainer.addEventListener("click", (event) => {
  const index = event.target.dataset.remove;

  if (index === undefined) return;

  headers.splice(Number(index), 1);

  renderHeaders();
});


/* =========================
   GENERATE CODE
========================= */

generateBtn.addEventListener("click", () => {

  const method = methodInput.value;
  const url = urlInput.value.trim();

  if (!url) {
    javascriptOutput.textContent = "Please enter an API URL.";
    pythonOutput.textContent = "Please enter an API URL.";
    curlOutput.textContent = "Please enter an API URL.";
    return;
  }

  const requestHeaders = getHeaders();
  const body = getBody();

  javascriptOutput.textContent =
    generateJavaScript(method, url, requestHeaders, body);

  pythonOutput.textContent =
    generatePython(method, url, requestHeaders, body);

  curlOutput.textContent =
    generateCurl(method, url, requestHeaders, body);
});


/* =========================
   GET HEADERS
========================= */

function getHeaders() {

  const result = {};

  headers.forEach((header) => {

    const key = header.key.trim();

    if (!key) return;

    result[key] = header.value;

  });

  return result;
}


/* =========================
   GET JSON BODY
========================= */

function getBody() {

  const value = bodyInput.value.trim();

  if (!value) {
    return null;
  }

  try {

    return JSON.parse(value);

  } catch {

    return value;

  }
}


/* =========================
   JAVASCRIPT GENERATOR
========================= */

function generateJavaScript(method, url, headers, body) {

  const headerLines = Object.entries(headers)
    .map(([key, value]) => `    "${key}": "${escapeJs(value)}"`)
    .join(",\n");

  let code = `fetch("${escapeJs(url)}", {
  method: "${method}"`;

  if (Object.keys(headers).length > 0) {

    code += `,
  headers: {
${headerLines}
  }`;

  }

  if (body !== null) {

    const bodyJson =
      typeof body === "string"
        ? body
        : JSON.stringify(body, null, 2);

    code += `,
  body: JSON.stringify(${bodyJson})`;

  }

  code += `
});`;

  return code;
}


/* =========================
   PYTHON GENERATOR
========================= */

function generatePython(method, url, headers, body) {

  const pythonMethod = method.toLowerCase();

  let code = `import requests

response = requests.${pythonMethod}(
    "${escapePython(url)}"`;

  if (Object.keys(headers).length > 0) {

    code += `,
    headers=${JSON.stringify(headers, null, 4)}`;

  }

  if (body !== null) {

    if (typeof body === "string") {

      code += `,
    data=${JSON.stringify(body)}`;

    } else {

      code += `,
    json=${JSON.stringify(body, null, 4)}`;

    }

  }

  code += `
)`;

  return code;
}


/* =========================
   CURL GENERATOR
========================= */

function generateCurl(method, url, headers, body) {

  let code =
    `curl -X ${method} "${escapeCurl(url)}"`;

  Object.entries(headers).forEach(([key, value]) => {

    code += ` \\
  -H "${escapeCurl(key)}: ${escapeCurl(value)}"`;

  });

  if (body !== null) {

    const bodyText =
      typeof body === "string"
        ? body
        : JSON.stringify(body);

    code += ` \\
  -d '${bodyText.replace(/'/g, "'\\''")}'`;

  }

  return code;
}


/* =========================
   COPY BUTTONS
========================= */

document.querySelectorAll(".copy-btn").forEach((button) => {

  button.addEventListener("click", async () => {

    const targetId = button.dataset.copy;
    const target = document.getElementById(targetId);

    if (!target) return;

    try {

      await navigator.clipboard.writeText(target.textContent);

      const oldText = button.textContent;

      button.textContent = "Copied!";

      setTimeout(() => {
        button.textContent = oldText;
      }, 1500);

    } catch {

      alert("Copy failed. Please copy manually.");

    }

  });

});


/* =========================
   ESCAPE HELPERS
========================= */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeJs(value) {

  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n");

}


function escapePython(value) {

  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n");

}


function escapeCurl(value) {

  return String(value)
    .replaceAll('"', '\\"');

}


/* Initial render */

renderHeaders();
