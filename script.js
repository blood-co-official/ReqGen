/* =========================================
   REQGEN V2 — SCRIPT.JS
   Production by BLOOD-CO
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================
     STORAGE
  ========================================= */

  const HISTORY_KEY = "reqgen_history";
  const SAVED_KEY = "reqgen_saved";

  let history = JSON.parse(
    localStorage.getItem(HISTORY_KEY) || "[]"
  );

  let savedRequests = JSON.parse(
    localStorage.getItem(SAVED_KEY) || "[]"
  );

  let currentRequest = null;


  /* =========================================
     HELPERS
  ========================================= */

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) => document.querySelectorAll(selector);

  function saveStorage() {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );

    localStorage.setItem(
      SAVED_KEY,
      JSON.stringify(savedRequests)
    );
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getValue(selectors, fallback = "") {
    for (const selector of selectors) {
      const element = $(selector);

      if (element && element.value !== undefined) {
        return element.value;
      }
    }

    return fallback;
  }


  /* =========================================
     FORM ELEMENTS
  ========================================= */

  const methodInput =
    $("#method") ||
    $("#request-method") ||
    $(".method");

  const urlInput =
    $("#url") ||
    $("#request-url") ||
    $(".url-input");

  const headersContainer =
    $("#headers-container") ||
    $(".headers-container");

  const bodyInput =
    $("#json-body") ||
    $("#body") ||
    $(".json-body");

  const outputBox =
    $("#output") ||
    $("#output-box") ||
    $(".output-box pre");

  const generateButton =
    $("#generate-btn") ||
    $("#generateRequest") ||
    $(".generate-btn");

  const saveButton =
    $("#save-btn") ||
    $("#saveRequest") ||
    $(".save-btn");


  /* =========================================
     GET METHOD
  ========================================= */

  function getMethod() {
    return (
      methodInput?.value ||
      "GET"
    ).toUpperCase();
  }


  /* =========================================
     GET URL
  ========================================= */

  function getUrl() {
    return (
      urlInput?.value ||
      ""
    ).trim();
  }


  /* =========================================
     HEADERS
  ========================================= */

  function getHeaders() {

    const headers = {};

    if (!headersContainer) {
      return headers;
    }

    const rows =
      headersContainer.querySelectorAll(
        ".header-item"
      );

    rows.forEach(row => {

      const key =
        row.querySelector(
          ".header-key"
        )?.value.trim();

      const value =
        row.querySelector(
          ".header-value"
        )?.value.trim();

      if (key && value) {
        headers[key] = value;
      }
    });

    return headers;
  }


  /* =========================================
     BODY
  ========================================= */

  function getBody() {
    return (
      bodyInput?.value ||
      ""
    ).trim();
  }


  /* =========================================
     ADD HEADER
  ========================================= */

  function addHeader(key = "", value = "") {

    if (!headersContainer) {
      return;
    }

    const row =
      document.createElement("div");

    row.className = "header-item";

    row.innerHTML = `
      <input
        type="text"
        class="header-key"
        placeholder="Header name"
        value="${escapeHtml(key)}"
      >

      <input
        type="text"
        class="header-value"
        placeholder="Header value"
        value="${escapeHtml(value)}"
      >

      <button
        type="button"
        class="btn-danger remove-header"
      >
        ×
      </button>
    `;

    headersContainer.appendChild(row);

    const removeButton =
      row.querySelector(
        ".remove-header"
      );

    removeButton.addEventListener(
      "click",
      () => {
        row.remove();
      }
    );
  }


  /* =========================================
     ADD HEADER BUTTON
  ========================================= */

  const addHeaderButton =
    $("#add-header") ||
    $("#addHeader") ||
    $(".add-header");

  if (addHeaderButton) {

    addHeaderButton.addEventListener(
      "click",
      () => addHeader()
    );

  }


  /* =========================================
     PARSE JSON BODY
  ========================================= */

  function parseBody(body) {

    if (!body) {
      return null;
    }

    try {
      return JSON.parse(body);
    } catch {
      return body;
    }

  }


  /* =========================================
     JAVASCRIPT GENERATOR
  ========================================= */

  function generateJavaScript(
    url,
    method,
    headers,
    body
  ) {

    let code = "";

    code += `fetch("${url}", {\n`;

    code += `  method: "${method}"`;

    if (Object.keys(headers).length) {

      code += `,\n`;

      code += `  headers: {\n`;

      const entries =
        Object.entries(headers);

      entries.forEach(
        ([key, value], index) => {

          code +=
            `    "${key}": "${value}"`;

          if (
            index <
            entries.length - 1
          ) {
            code += ",";
          }

          code += "\n";
        }
      );

      code += `  }`;
    }

    if (
      body &&
      !["GET", "HEAD"].includes(method)
    ) {

      const parsed =
        parseBody(body);

      if (
        parsed !== null &&
        typeof parsed === "object"
      ) {

        code += `,\n`;

        code +=
          `  body: JSON.stringify(`;

        code +=
          JSON.stringify(
            parsed,
            null,
            2
          );

        code += `)\n`;

      } else {

        code += `,\n`;

        code +=
          `  body: ${JSON.stringify(body)}\n`;

      }

    } else {

      code += `\n`;

    }

    code += `});`;

    return code;
  }


  /* =========================================
     PYTHON GENERATOR
  ========================================= */

  function generatePython(
    url,
    method,
    headers,
    body
  ) {

    let code =
      `import requests\n\n`;

    code +=
      `response = requests.${method.toLowerCase()}(\n`;

    code +=
      `    "${url}"`;

    /* HEADERS */

    if (
      Object.keys(headers).length > 0
    ) {

      code += `,\n`;

      code += `    headers={\n`;

      const entries =
        Object.entries(headers);

      entries.forEach(
        ([key, value], index) => {

          code +=
            `        "${key}": ${JSON.stringify(value)}`;

          if (
            index <
            entries.length - 1
          ) {
            code += ",";
          }

          code += "\n";
        }
      );

      code += `    }`;
    }


    /* BODY */

    if (
      body &&
      !["GET", "HEAD"].includes(method)
    ) {

      const parsed =
        parseBody(body);

      if (
        parsed !== null &&
        typeof parsed === "object"
      ) {

        const json =
          JSON.stringify(
            parsed,
            null,
            4
          );

        const lines =
          json.split("\n");

        code += `,\n`;

        code += `    json=`;

        lines.forEach(
          (line, index) => {

            if (index === 0) {
              code += line;
            } else {
              code += "\n    " + line;
            }

          }
        );

      } else {

        code +=
          `,\n    data=${JSON.stringify(body)}`;

      }

    }

    code += `\n)\n\n`;

    code +=
      `print(response.json())`;

    return code;
  }


  /* =========================================
     CURL GENERATOR
  ========================================= */

  function generateCurl(
    url,
    method,
    headers,
    body
  ) {

    let code =
      `curl -X ${method} "${url}"`;

    Object.entries(headers)
      .forEach(
        ([key, value]) => {

          code +=
            ` \\\n  -H "${key}: ${value}"`;

        }
      );

    if (
      body &&
      !["GET", "HEAD"].includes(method)
    ) {

      const parsed =
        parseBody(body);

      let bodyString;

      if (
        parsed !== null &&
        typeof parsed === "object"
      ) {

        bodyString =
          JSON.stringify(parsed);

      } else {

        bodyString = body;

      }

      bodyString =
        bodyString.replace(
          /'/g,
          "'\\''"
        );

      code +=
        ` \\\n  -d '${bodyString}'`;
    }

    return code;
  }


  /* =========================================
     GENERATE ALL
  ========================================= */

  function generateRequest() {

    const method = getMethod();

    const url = getUrl();

    const headers = getHeaders();

    const body = getBody();


    if (!url) {

      alert(
        "Please enter an API URL."
      );

      return;

    }


    currentRequest = {

      id: Date.now(),

      method,

      url,

      headers,

      body,

      createdAt:
        new Date().toISOString()

    };


    const javascriptCode =
      generateJavaScript(
        url,
        method,
        headers,
        body
      );

    const pythonCode =
      generatePython(
        url,
        method,
        headers,
        body
      );

    const curlCode =
      generateCurl(
        url,
        method,
        headers,
        body
      );


    currentRequest.javascript =
      javascriptCode;

    currentRequest.python =
      pythonCode;

    currentRequest.curl =
      curlCode;


    history.unshift(
      currentRequest
    );


    if (history.length > 30) {
      history =
        history.slice(0, 30);
    }


    saveStorage();

    showOutput(
      javascriptCode,
      "JavaScript"
    );

    renderHistory();

  }


  /* =========================================
     OUTPUT
  ========================================= */

  function showOutput(
    code,
    language
  ) {

    if (!outputBox) {
      return;
    }

    outputBox.textContent =
      code;

    outputBox.dataset.language =
      language;

  }


  /* =========================================
     CODE TABS
  ========================================= */

  $$(".code-tab")
    .forEach(tab => {

      tab.addEventListener(
        "click",
        () => {

          $$(".code-tab")
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );

          tab.classList.add(
            "active"
          );

          if (!currentRequest) {
            return;
          }

          const language =
            tab.dataset.language ||
            tab.textContent.trim();

          if (
            language
              .toLowerCase()
              .includes("python")
          ) {

            showOutput(
              currentRequest.python,
              "Python"
            );

          } else if (
            language
              .toLowerCase()
              .includes("curl")
          ) {

            showOutput(
              currentRequest.curl,
              "cURL"
            );

          } else {

            showOutput(
              currentRequest.javascript,
              "JavaScript"
            );

          }

        }
      );

    });


  /* =========================================
     GENERATE BUTTON
  ========================================= */

  if (generateButton) {

    generateButton.addEventListener(
      "click",
      generateRequest
    );

  }


  /* =========================================
     SAVE CURRENT REQUEST
  ========================================= */

  function saveCurrentRequest() {

    if (!currentRequest) {

      alert(
        "Generate a request first."
      );

      return;

    }


    const name =
      prompt(
        "Enter a name for this request:",
        `${currentRequest.method} Request`
      );


    if (!name) {
      return;
    }


    const saved = {

      ...currentRequest,

      name:
        name.trim(),

      savedAt:
        new Date().toISOString()

    };


    savedRequests.unshift(
      saved
    );


    if (
      savedRequests.length > 50
    ) {

      savedRequests =
        savedRequests.slice(
          0,
          50
        );

    }


    saveStorage();

    renderSavedRequests();

    alert(
      "Request saved successfully!"
    );

  }


  if (saveButton) {

    saveButton.addEventListener(
      "click",
      saveCurrentRequest
    );

  }


  /* =========================================
     COPY OUTPUT
  ========================================= */

  document.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          ".copy-btn"
        );

      if (!button) {
        return;
      }

      if (!outputBox) {
        return;
      }

      const code =
        outputBox.textContent;

      try {

        await navigator.clipboard
          .writeText(code);

        const oldText =
          button.textContent;

        button.textContent =
          "Copied!";

        setTimeout(
          () => {
            button.textContent =
              oldText;
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
     LOAD REQUEST INTO BUILDER
  ========================================= */

  function loadRequest(request) {

    if (!request) {
      return;
    }


    if (methodInput) {
      methodInput.value =
        request.method || "GET";
    }


    if (urlInput) {
      urlInput.value =
        request.url || "";
    }


    if (bodyInput) {
      bodyInput.value =
        request.body || "";
    }


    if (headersContainer) {

      headersContainer.innerHTML =
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

    }


    currentRequest =
      request;


    showOutput(
      request.javascript || "",
      "JavaScript"
    );


    openBuilder();

  }


  /* =========================================
     HISTORY
  ========================================= */

  function renderHistory() {

    const container =
      $("#history-list") ||
      $(".history-list") ||
      $("#request-history") ||
      $(".request-list");

    if (!container) {
      return;
    }


    if (!history.length) {

      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">↺</div>
          <h3>No request history</h3>
          <p>Your generated requests will appear here.</p>
        </div>
      `;

      return;

    }


    container.innerHTML =
      history.map(
        (request, index) => `

        <div
          class="request-item"
          data-history-index="${index}"
        >

          <div
            class="request-main"
            data-load-history="${index}"
          >

            <span class="request-method">
              ${escapeHtml(request.method)}
            </span>

            <strong>
              ${escapeHtml(
                request.name ||
                `${request.method} Request`
              )}
            </strong>

            <span class="request-url">
              ${escapeHtml(request.url)}
            </span>

          </div>

          <button
            class="delete-btn"
            data-delete-history="${index}"
            type="button"
          >
            ×
          </button>

        </div>

      `
      ).join("");

  }


  /* =========================================
     SAVED REQUESTS
  ========================================= */

  function renderSavedRequests() {

    const container =
      $("#saved-list") ||
      $(".saved-list") ||
      $("#saved-requests") ||
      $(".saved-requests-list");

    if (!container) {
      return;
    }


    if (!savedRequests.length) {

      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">★</div>
          <h3>No saved requests</h3>
          <p>Your frequently used requests will appear here.</p>
        </div>
      `;

      return;

    }


    container.innerHTML =
      savedRequests.map(
        (request, index) => `

        <div
          class="request-item"
          data-saved-index="${index}"
        >

          <div
            class="request-main"
            data-load-saved="${index}"
          >

            <strong>
              ${escapeHtml(
                request.name ||
                "Saved Request"
              )}
            </strong>

            <span class="request-method">
              ${escapeHtml(request.method)}
            </span>

            <span class="request-url">
              ${escapeHtml(request.url)}
            </span>

          </div>

          <button
            class="delete-btn"
            data-delete-saved="${index}"
            type="button"
          >
            ×
          </button>

        </div>

      `
      ).join("");

  }


  /* =========================================
     HISTORY / SAVED CLICK HANDLER
  ========================================= */

  document.addEventListener(
    "click",
    event => {

      const historyLoad =
        event.target.closest(
          "[data-load-history]"
        );

      if (historyLoad) {

        const index =
          Number(
            historyLoad.dataset
              .loadHistory
          );

        loadRequest(
          history[index]
        );

        return;

      }


      const savedLoad =
        event.target.closest(
          "[data-load-saved]"
        );

      if (savedLoad) {

        const index =
          Number(
            savedLoad.dataset
              .loadSaved
          );

        loadRequest(
          savedRequests[index]
        );

        return;

      }


      const deleteHistory =
        event.target.closest(
          "[data-delete-history]"
        );

      if (deleteHistory) {

        const index =
          Number(
            deleteHistory.dataset
              .deleteHistory
          );

        history.splice(
          index,
          1
        );

        saveStorage();

        renderHistory();

        return;

      }


      const deleteSaved =
        event.target.closest(
          "[data-delete-saved]"
        );

      if (deleteSaved) {

        const index =
          Number(
            deleteSaved.dataset
              .deleteSaved
          );

        savedRequests.splice(
          index,
          1
        );

        saveStorage();

        renderSavedRequests();

      }

    }
  );


  /* =========================================
     CLEAR HISTORY
  ========================================= */

  const clearHistoryButton =
    $("#clear-history") ||
    $("#clearHistory") ||
    $(".clear-history");

  if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
      "click",
      () => {

        if (!history.length) {
          return;
        }

        const confirmed =
          confirm(
            "Clear all request history?"
          );

        if (!confirmed) {
          return;
        }

        history = [];

        saveStorage();

        renderHistory();

      }
    );

  }


  /* =========================================
     CLEAR SAVED
  ========================================= */

  const clearSavedButton =
    $("#clear-saved") ||
    $("#clearSaved") ||
    $(".clear-saved");

  if (clearSavedButton) {

    clearSavedButton.addEventListener(
      "click",
      () => {

        if (!savedRequests.length) {
          return;
        }

        const confirmed =
          confirm(
            "Delete all saved requests?"
          );

        if (!confirmed) {
          return;
        }

        savedRequests = [];

        saveStorage();

        renderSavedRequests();

      }
    );

  }


  /* =========================================
     NEW REQUEST
  ========================================= */

  const newRequestButtons =
    $$(".new-request-btn");

  newRequestButtons
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (methodInput) {
            methodInput.value =
              "GET";
          }

          if (urlInput) {
            urlInput.value =
              "";
          }

          if (bodyInput) {
            bodyInput.value =
              "";
          }

          if (headersContainer) {
            headersContainer.innerHTML =
              "";
          }

          currentRequest = null;

          showOutput(
            "// Build a request to generate code.",
            "JavaScript"
          );

          openBuilder();

        }
      );

    });


  /* =========================================
     SIDEBAR
  ========================================= */

  const sidebar =
    $(".sidebar");

  const menuButton =
    $(".mobile-menu");

  const overlay =
    $(".sidebar-overlay");

  function openSidebar() {

    sidebar?.classList.add(
      "open"
    );

    overlay?.classList.add(
      "active"
    );

  }

  function closeSidebar() {

    sidebar?.classList.remove(
      "open"
    );

    overlay?.classList.remove(
      "active"
    );

  }

  if (menuButton) {

    menuButton.addEventListener(
      "click",
      () => {

        if (
          sidebar?.classList.contains(
            "open"
          )
        ) {
          closeSidebar();
        } else {
          openSidebar();
        }

      }
    );

  }

  overlay?.addEventListener(
    "click",
    closeSidebar
  );


  /* =========================================
     PAGE NAVIGATION
  ========================================= */

  function openBuilder() {

    const pages =
      $$(".page");

    pages.forEach(
      page =>
        page.style.display =
          "none"
    );


    const builder =
      $("#builder-page") ||
      $("#request-builder") ||
      $(".builder-page");


    if (builder) {
      builder.style.display =
        "block";
    }


    $$(".nav-item")
      .forEach(
        item =>
          item.classList.remove(
            "active"
          )
      );


    const builderNav =
      document.querySelector(
        '[data-page="builder"]'
      );

    builderNav?.classList.add(
      "active"
    );


    closeSidebar();

  }


  document.addEventListener(
    "click",
    event => {

      const nav =
        event.target.closest(
          ".nav-item"
        );

      if (!nav) {
        return;
      }


      const page =
        nav.dataset.page;


      if (!page) {
        return;
      }


      $$(".nav-item")
        .forEach(
          item =>
            item.classList.remove(
              "active"
            )
        );

      nav.classList.add(
        "active"
      );


      $$(".page")
        .forEach(
          item =>
            item.style.display =
              "none"
        );


      if (
        page === "builder"
      ) {

        openBuilder();

      } else if (
        page === "history"
      ) {

        const historyPage =
          $("#history-page");

        if (historyPage) {
          historyPage.style.display =
            "block";
        }

        renderHistory();

        closeSidebar();

      } else if (
        page === "saved"
      ) {

        const savedPage =
          $("#saved-page");

        if (savedPage) {
          savedPage.style.display =
            "block";
        }

        renderSavedRequests();

        closeSidebar();

      }

    }
  );


  /* =========================================
     INITIAL LOAD
  ========================================= */

  renderHistory();

  renderSavedRequests();


  /* =========================================
     DEFAULT HEADER
  ========================================= */

  if (
    headersContainer &&
    headersContainer.children.length === 0
  ) {

    addHeader(
      "Content-Type",
      "application/json"
    );

  }


  /* =========================================
     DEFAULT OUTPUT
  ========================================= */

  if (
    outputBox &&
    !outputBox.textContent.trim()
  ) {

    outputBox.textContent =
      "// Build a request to generate code.";

  }


  console.log(
    "ReqGen V2 loaded successfully."
  );

});
