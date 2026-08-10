const methodInput = document.querySelector(".method");
const urlInput = document.querySelector(".url-input");
const bodyInput = document.querySelector("textarea");

const addHeaderBtn = document.querySelector("#addHeader");
const generateBtn = document.querySelector("#generate");
const copyBtn = document.querySelector(".copy-btn");

const headersContainer = document.querySelector("#headers");
const output = document.querySelector("#output");

let headers = [];

// Add a new header
if (addHeaderBtn) {
  addHeaderBtn.addEventListener("click", () => {
    const header = {
      key: "",
      value: ""
    };

    headers.push(header);
    renderHeaders();
  });
}

// Render headers
function renderHeaders() {
  if (!headersContainer) return;

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
        class="btn btn-danger"
        type="button"
        data-remove="${index}"
      >
        Remove
      </button>
    `;

    headersContainer.appendChild(wrapper);
  });
}

// Update header values
if (headersContainer) {
  headersContainer.addEventListener("input", (event) => {
    const index = event.target.dataset.index;
    const type = event.target.dataset.type;

    if (index === undefined || !type) return;

    headers[index][type] = event.target.value;
  });

  headersContainer.addEventListener("click", (event) => {
    const removeIndex = event.target.dataset.remove;

    if (removeIndex === undefined) return;

    headers.splice(Number(removeIndex), 1);
    renderHeaders();
  });
}

// Generate request
if (generateBtn) {
  generateBtn.addEventListener("click", () => {
    const method = methodInput?.value || "GET";
    const url = urlInput?.value.trim() || "";

    if (!url) {
      showOutput("Please enter an API URL first.");
      return;
    }

    const request = {
      method,
      url,
      headers: getHeaders(),
      body: getBody()
    };

    showOutput(generatePreview(request));
  });
}

// Get headers
function getHeaders() {
  const result = {};

  headers.forEach((header) => {
    const key = header.key.trim();

    if (!key) return;

    result[key] = header.value;
  });

  return result;
}

// Get JSON body
function getBody() {
  const text = bodyInput?.value.trim();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Generate readable request preview
function generatePreview(request) {
  const headerText = Object.entries(request.headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  let result = `${request.method} ${request.url}\n`;

  if (headerText) {
    result += `\nHeaders:\n${headerText}\n`;
  }

  if (request.body !== null) {
    result += `\nBody:\n${typeof request.body === "string"
      ? request.body
      : JSON.stringify(request.body, null, 2)
    }`;
  }

  return result;
}

// Show generated output
function showOutput(text) {
  if (!output) return;

  output.textContent = text;
}

// Copy generated request
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    if (!output?.textContent) return;

    try {
      await navigator.clipboard.writeText(output.textContent);

      const oldText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";

      setTimeout(() => {
        copyBtn.textContent = oldText;
      }, 1500);
    } catch {
      alert("Copy failed. Please copy manually.");
    }
  });
}

// Basic HTML escaping
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Start with one header field
headers.push({
  key: "Content-Type",
  value: "application/json"
});

renderHeaders();
