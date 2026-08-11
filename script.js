/* =========================================
   REQGEN — SCRIPT
========================================= */

const methodInput = document.querySelector(".method");
const urlInput = document.querySelector(".url-input");

const headersContainer = document.getElementById("headers");
const addHeaderBtn = document.getElementById("addHeader");

const bodyInput = document.querySelector("textarea");

const generateButtons = [
  document.getElementById("generate"),
  document.getElementById("generateRequest")
];

const javascriptOutput = document.getElementById("javascriptOutput");
const pythonOutput = document.getElementById("pythonOutput");
const curlOutput = document.getElementById("curlOutput");

const newRequestBtn = document.getElementById("newRequest");

const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const requestTabs = document.querySelectorAll(".request-tab");
const codeTabs = document.querySelectorAll(".code-tab");

let headers = [];


/* =========================================
   DEFAULT VALUES
========================================= */

if (methodInput) {
  methodInput.value = "GET";
}

if (urlInput) {
  urlInput.value = "";
}

if (bodyInput) {
  bodyInput.value = "";
}


/* =========================================
   ADD HEADER
========================================= */

function addHeader(key = "", value = "") {

  headers.push({
    key,
    value
  });

  renderHeaders();
}


/* =========================================
   REMOVE HEADER
========================================= */

function removeHeader(index) {

  headers.splice(index, 1);

  renderHeaders();
}


/* =========================================
   RENDER HEADERS
========================================= */

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
        data-index="${index}"
      >

      <input
        type="text"
        class="header-value"
        placeholder="Header value"
        value="${escapeHtml(header.value)}"
        data-index="${index}"
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
    .forEach(input => {

      input.addEventListener("input", event => {

        const index =
          Number(event.target.dataset.index);

        headers[index].key =
          event.target.value;
      });

    });


  document
    .querySelectorAll(".header-value")
    .forEach(input => {

      input.addEventListener("input", event => {

        const index =
          Number(event.target.dataset.index);

        headers[index].value =
          event.target.value;
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
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================
   GET HEADERS
========================================= */

function getHeaders() {

  const result = {};

  headers.forEach(header => {

    const key = header.key.trim();

    if (!key) return;

    result[key] = header.value;

  });

  return result;
}


/* =========================================
   GET JSON BODY
========================================= */

function getBody() {

  if (!bodyInput) return null;

  const value =
    bodyInput.value.trim();

  if (!value) {
    return null;
  }

  try {

    return JSON.parse(value);

  } catch {

    return value;

  }

}


/* =========================================
   FORMAT JSON
========================================= */

function formatJson(value) {

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}


/* =========================================
   JAVASCRIPT GENERATOR
========================================= */

function generateJavaScript(
  method,
  url,
  requestHeaders,
  body
) {

  let code = `fetch("${url}", {
  method: "${method}"`;

  const headerKeys =
    Object.keys(requestHeaders);

  if (headerKeys.length > 0) {

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

    const bodyString =
      JSON.stringify(body, null, 2);

    code += `,
  body: JSON.stringify(${bodyString})`;

  }


  code += `
});`;

  return code;
}


/* =========================================
   PYTHON GENERATOR
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


  if (Object.keys(requestHeaders).length > 0) {

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
   CURL GENERATOR
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

    const json =
      JSON.stringify(body);

    code +=
      ` \\\n  -d '${json}'`;

  }


  return code;
}


/* =========================================
   GENERATE ALL CODE
========================================= */

function generateCode() {

  const method =
    methodInput?.value || "GET";

  const url =
    urlInput?.value.trim() || "";


  if (!url) {

    alert("Please enter an API URL.");

    return;
  }


  const requestHeaders =
    getHeaders();

  const body =
    getBody();


  const js =
    generateJavaScript(
      method,
      url,
      requestHeaders,
      body
    );

  const python =
    generatePython(
      method,
      url,
      requestHeaders,
      body
    );

  const curl =
    generateCurl(
      method,
      url,
      requestHeaders,
      body
    );


  if (javascriptOutput) {
    javascriptOutput.textContent = js;
  }

  if (pythonOutput) {
    pythonOutput.textContent = python;
  }

  if (curlOutput) {
    curlOutput.textContent = curl;
  }


  updateRequestInfo(method);
}


/* =========================================
   REQUEST INFO
========================================= */

function updateRequestInfo(method) {

  const methodInfo =
    document.querySelector(".method-info");

  if (methodInfo) {
    methodInfo.textContent = method;
  }

}


/* =========================================
   GENERATE BUTTONS
========================================= */

generateButtons.forEach(button => {

  if (!button) return;

  button.addEventListener(
    "click",
    generateCode
  );

});


/* =========================================
   ADD HEADER BUTTON
========================================= */

if (addHeaderBtn) {

  addHeaderBtn.addEventListener(
    "click",
    () => addHeader()
  );

}


/* =========================================
   NEW REQUEST
========================================= */

if (newRequestBtn) {

  newRequestBtn.addEventListener(
    "click",
    () => {

      if (methodInput) {
        methodInput.value = "GET";
      }

      if (urlInput) {
        urlInput.value = "";
      }

      if (bodyInput) {
        bodyInput.value = "";
      }

      headers = [];

      renderHeaders();

      if (javascriptOutput) {
        javascriptOutput.textContent =
          "Generate a request to see JavaScript code.";
      }

      if (pythonOutput) {
        pythonOutput.textContent =
          "Generate a request to see Python code.";
      }

      if (curlOutput) {
        curlOutput.textContent =
          "Generate a request to see cURL code.";
      }

      updateRequestInfo("GET");

    }
  );

}


/* =========================================
   CODE COPY BUTTONS
========================================= */

document
  .querySelectorAll(".copy-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        const targetId =
          button.dataset.copy;

        const target =
          document.getElementById(targetId);

        if (!target) return;

        try {

          await navigator.clipboard.writeText(
            target.textContent
          );

          const oldText =
            button.textContent;

          button.textContent =
            "Copied ✓";

          setTimeout(() => {

            button.textContent =
              oldText;

          }, 1500);

        } catch {

          alert("Copy failed.");

        }

      }
    );

  });


/* =========================================
   REQUEST TABS
========================================= */

requestTabs.forEach(tab => {

  tab.addEventListener(
    "click",
    () => {

      requestTabs.forEach(item => {
        item.classList.remove("active");
      });

      tab.classList.add("active");

    }
  );

});


/* =========================================
   CODE TABS
========================================= */

codeTabs.forEach((tab, index) => {

  tab.addEventListener(
    "click",
    () => {

      codeTabs.forEach(item => {
        item.classList.remove("active");
      });

      tab.classList.add("active");

      const outputs =
        document.querySelectorAll(".output-box");

      outputs.forEach(output => {
        output.style.display = "none";
      });

      if (outputs[index]) {
        outputs[index].style.display = "block";
      }

    }
  );

});


/* =========================================
   MOBILE SIDEBAR
========================================= */

if (mobileMenu) {

  mobileMenu.addEventListener(
    "click",
    () => {

      sidebar?.classList.add("open");

      sidebarOverlay?.classList.add("active");

    }
  );

}


if (sidebarOverlay) {

  sidebarOverlay.addEventListener(
    "click",
    () => {

      sidebar?.classList.remove("open");

      sidebarOverlay?.classList.remove("active");

    }
  );

}


/* =========================================
   INITIALIZE
========================================= */

renderHeaders();

updateRequestInfo("GET");
