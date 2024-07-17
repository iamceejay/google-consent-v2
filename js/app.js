// Utilities
function ready(fn) {
  if (document.readyState != "loading") {
    fn();
  } else if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    document.attachEvent("onreadystatechange", function () {
      if (document.readyState != "loading") fn();
    });
  }

  if (isConsentStateProvided(loadConsentState())) {
    createFloatingButton();
  }
}

function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

function applyStyles(el, styles) {
  if (null === el) return;
  for (var key of Object.keys(styles || {})) {
    el.style[key] = styles[key];
  }
}

function applySimpleMarkdown(text) {
  return (text || "")
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*\s?([^\n]+)\*\*/g, "<b>$1</b>")
    .replace(/\_\_\s?([^\n]+)\_\_/g, "<b>$1</b>")
    .replace(/\*\s?([^\n]+)\*/g, "<i>$1</i>")
    .replace(/\_\s?([^\n]+)\_/g, "<i>$1</i>");
}

function createAndApplyButton(name, text, parent) {
  if (text === undefined || text === null || text === "") {
    return;
  }
  var btn = document.createElement("a");
  btn.setAttribute("href", "#" + name);
  btn.classList.add("consent-banner-button");
  btn.textContent = text;
  parent.appendChild(btn);
}

function addEventListener(elements, event, callback) {
  if (elements === null) {
    return null;
  }
  if (elements.addEventListener) {
    elements.addEventListener(event, callback);
  }
  if (elements.forEach) {
    elements.forEach((el) => el.addEventListener(event, callback));
  }
}

function dispatchBodyEvent(eventName) {
  document.body.dispatchEvent(new CustomEvent("consent-banner." + eventName));
}

// State Management
function isConsentStateProvided(consentState) {
  return null !== consentState;
}

function loadConsentState() {
  console.warn("ConsentBannerJS: loadConsentState function is not provided");
  return null;
}

function saveConsentState(consentState) {
  console.warn("ConsentBannerJS: saveConsentState function is not provided");

  createFloatingButton();

  return null;
}

// Components
function createMain(config) {
  var main = document.createElement("div");
  main.setAttribute("id", "consent-banner-main");
  main.setAttribute("data-mode", config.display.mode);
  main.setAttribute("data-wall", config.display.wall ?? false);
  main.style.display = "none";
  return main;
}

function createWall(config) {
  var wall = document.createElement("div");
  wall.setAttribute("id", "consent-banner-wall");
  return wall;
}

function createModal(config) {
  var modal = document.createElement("div");
  modal.style.display = "none";
  modal.setAttribute("id", "consent-banner-modal");
  modal.innerHTML =
    '<div class="consent-banner-modal-wrapper"><div><h2></h2><p></p></div><div class="consent-banner-modal-buttons"></div></div>';
  modal.querySelector("h2").textContent = config.modal.title;
  modal.querySelector("p").innerHTML = applySimpleMarkdown(
    config.modal.description
  );
  var buttons = modal.querySelector(".consent-banner-modal-buttons");

  createAndApplyButton("settings", config.modal.buttons.settings, buttons);
  createAndApplyButton("close", config.modal.buttons.close, buttons);
  createAndApplyButton("reject", config.modal.buttons.reject, buttons);
  createAndApplyButton("accept", config.modal.buttons.accept, buttons);
  return modal;
}

function createSettings(config, existingConsentState) {
  var isConsentProvided = isConsentStateProvided(existingConsentState);

  var settings = document.createElement("div");
  settings.setAttribute("id", "consent-banner-settings");
  settings.style.display = "none";
  settings.innerHTML =
    '<div><form><h2></h2><div><p></p><ul></ul></div><div class="consent-banner-settings-buttons"></div></form></div>';

  settings.querySelector("h2").textContent = config.settings.title;
  settings.querySelector("p").innerHTML = applySimpleMarkdown(
    config.settings.description
  );

  var buttons = settings.querySelector(".consent-banner-settings-buttons");

  createAndApplyButton("reject", config.settings.buttons.reject, buttons);
  createAndApplyButton("close", config.settings.buttons.close, buttons);
  createAndApplyButton("save", config.settings.buttons.save, buttons);
  createAndApplyButton("accept", config.settings.buttons.accept, buttons);

  var consentTypes = config.consent_types;
  for (var key of Object.keys(consentTypes || {})) {
    var listItem = document.createElement("li");
    var listItemTitle = document.createElement("label");
    var listItemDescription = document.createElement("p");
    var listItemHidden = document.createElement("input");
    listItemHidden.setAttribute("type", "hidden");
    listItemHidden.setAttribute("name", consentTypes[key].name);
    listItemHidden.setAttribute("value", "denied");
    var listItemCheckbox = document.createElement("input");
    listItemCheckbox.setAttribute("type", "checkbox");
    listItemCheckbox.setAttribute("name", consentTypes[key].name);
    listItemCheckbox.setAttribute("value", "granted");
    listItemCheckbox.setAttribute("id", consentTypes[key].name);

    if (
      (isConsentProvided &&
        "granted" === existingConsentState[consentTypes[key].name]) ||
      (!isConsentProvided && "granted" === consentTypes[key].default)
    ) {
      listItemCheckbox.setAttribute("checked", "checked");
    }

    if (
      (isConsentProvided &&
        "denied" === existingConsentState[consentTypes[key].name]) ||
      (!isConsentProvided && "denied" === consentTypes[key].default)
    ) {
      listItemCheckbox.removeAttribute("checked");
    }

    if (consentTypes[key].default === "required") {
      listItemCheckbox.setAttribute("checked", "checked");
      listItemCheckbox.setAttribute("disabled", "disabled");
      listItemHidden.setAttribute("value", "granted");
    }

    listItemTitle.textContent = consentTypes[key].title;
    listItemTitle.setAttribute("for", consentTypes[key].name);
    listItemDescription.innerHTML = applySimpleMarkdown(
      consentTypes[key].description
    );
    listItem.appendChild(listItemHidden);
    listItem.appendChild(listItemCheckbox);
    listItem.appendChild(listItemTitle);
    listItem.appendChild(listItemDescription);
    settings.querySelector("ul").appendChild(listItem);
  }
  return settings;
}

function updateSettings(settings, config, existingConsentState) {
  var isConsentProvided = isConsentStateProvided(existingConsentState);
  var consentTypes = config.consent_types;
  for (var key of Object.keys(consentTypes || {})) {
    var listItemCheckbox = settings.querySelector(
      '[type="checkbox"][name="' + consentTypes[key].name + '"]'
    );
    if (
      (isConsentProvided &&
        "granted" === existingConsentState[consentTypes[key].name]) ||
      (!isConsentProvided && "granted" === consentTypes[key].default)
    ) {
      listItemCheckbox.setAttribute("checked", "checked");
    }
    if (
      (isConsentProvided &&
        "denied" === existingConsentState[consentTypes[key].name]) ||
      (!isConsentProvided && "denied" === consentTypes[key].default)
    ) {
      listItemCheckbox.removeAttribute("checked");
    }

    if (consentTypes[key].default === "required") {
      listItemCheckbox.setAttribute("checked", "checked");
      listItemCheckbox.setAttribute("disabled", "disabled");
    }
  }
}

function hideMain(main) {
  main.style.display = "none";
  hideWall(main);
}

function showWall(main) {
  var wall = main.querySelector("#consent-banner-wall");
  wall.style.background = "rgba(0, 0, 0, .7)";
  wall.style.position = "fixed";
  wall.style.top = "0";
  wall.style.right = "0";
  wall.style.left = "0";
  wall.style.bottom = "0";
}

function hideWall(main) {
  var wall = main.querySelector("#consent-banner-wall");
  wall.style.position = "static";
  wall.style.background = "none";
}

function showModal(main) {
  main.style.display = "block";
  main.querySelector("#consent-banner-modal").style.display = "block";
}

function hideModal(main) {
  main.style.display = "block";
  main.querySelector("#consent-banner-modal").style.display = "none";
}

function showSettings(main) {
  main.style.display = "block";
  main.querySelector("#consent-banner-settings").style.display = "block";
  showWall(main);
}

function hideSettings(main) {
  main.style.display = "block";
  main.querySelector("#consent-banner-settings").style.display = "none";
  if (
    "true" !== main.getAttribute("data-wall") ||
    isConsentStateProvided(loadConsentState())
  ) {
    hideWall(main);
  }
}

function consentBannerJsMain(config) {
  var body = document.querySelector("body");

  var existingConsentState = loadConsentState();

  // create all components
  var main = createMain(config);
  var wall = createWall(config);
  var modal = createModal(config);
  var settings = createSettings(config, existingConsentState);

  main.appendChild(wall);
  wall.appendChild(modal);
  wall.appendChild(settings);

  // apply actions
  addEventListener(
    settings.querySelector('[href="#accept"]'),
    "click",
    function (ev) {
      ev.preventDefault();
      var consentTypes = config.consent_types;
      var consentState = {};
      for (var key of Object.keys(consentTypes || {})) {
        var consentTypeName = consentTypes[key].name;
        consentState[consentTypeName] = "granted";
      }
      updateSettings(settings, config, consentState);
      saveConsentState(consentState);
      hideMain(main);
      dispatchBodyEvent("hidden");
    }
  );

  addEventListener(modal.querySelector('[href="#accept"]'), "click", function (
    ev
  ) {
    ev.preventDefault();
    var consentTypes = config.consent_types;
    var consentState = {};
    for (var key of Object.keys(consentTypes || {})) {
      var consentTypeName = consentTypes[key].name;
      consentState[consentTypeName] = "granted";
    }
    updateSettings(settings, config, consentState);
    saveConsentState(consentState);
    hideMain(main);
    dispatchBodyEvent("hidden");
  });

  addEventListener(
    settings.querySelector('[href="#close"]'),
    "click",
    function (ev) {
      ev.preventDefault();
      hideSettings(main);
      if (!isConsentStateProvided(loadConsentState())) {
        showModal(main);
      } else {
        dispatchBodyEvent("hidden");
      }
    }
  );

  addEventListener(
    modal.querySelector('[href="#settings"]'),
    "click",
    function (ev) {
      ev.preventDefault();
      hideModal(main);
      showSettings(main);
      dispatchBodyEvent("shown");
    }
  );

  addEventListener(modal.querySelector('[href="#reject"]'), "click", function (
    ev
  ) {
    ev.preventDefault();
    var consentTypes = config.consent_types;
    var consentState = {};
    for (var key of Object.keys(consentTypes || {})) {
      var consentTypeName = consentTypes[key].name;
      consentState[consentTypeName] = "denied";
    }
    saveConsentState(consentState);
    updateSettings(settings, config, consentState);
    hideMain(main);
    dispatchBodyEvent("hidden");
  });

  addEventListener(
    settings.querySelector('[href="#reject"]'),
    "click",
    function (ev) {
      ev.preventDefault();
      var consentTypes = config.consent_types;
      var consentState = {};
      for (var key of Object.keys(consentTypes || {})) {
        var consentTypeName = consentTypes[key].name;
        consentState[consentTypeName] = "denied";
      }
      saveConsentState(consentState);
      updateSettings(settings, config, consentState);
      hideMain(main);
      dispatchBodyEvent("hidden");
    }
  );

  addEventListener(settings.querySelector('[href="#save"]'), "click", function (
    ev
  ) {
    ev.preventDefault();
    settings.querySelector("form").requestSubmit();
  });

  addEventListener(settings.querySelector("form"), "submit", function (ev) {
    ev.preventDefault();
    const formData = new FormData(ev.target);

    consentState = Object.fromEntries(formData);
    saveConsentState(consentState);
    updateSettings(settings, config, consentState);
    hideMain(main);
    dispatchBodyEvent("hidden");
  });

  addEventListener(
    body.querySelectorAll('[href$="#consent-banner-settings"]'),
    "click",
    function (ev) {
      ev.preventDefault();
      showSettings(main);
      hideModal(main);
      dispatchBodyEvent("shown");
    }
  );

  addEventListener(body, "consent-banner.show-settings", function (ev) {
    ev.preventDefault();
    showSettings(main);
    hideModal(main);
    dispatchBodyEvent("shown");
  });

  body.appendChild(main);

  if (true !== isConsentStateProvided(existingConsentState)) {
    if (true === config.display.wall) {
      showWall(main);
    }

    if ("bar" === config.display.mode) {
      applyStyles(modal, {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        "border-bottom": "none",
        "border-left": "none",
        "border-right": "none",
        padding: "5px",
      });
      applyStyles(modal.querySelector("h2"), {
        display: "none",
      });

      applyStyles(modal.querySelector(".consent-banner-modal-buttons"), {
        "margin-left": "20px",
      });
      showModal(main);
      dispatchBodyEvent("shown");
    }

    if ("modal" === config.display.mode) {
      applyStyles(modal, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      applyStyles(modal.querySelector(".consent-banner-modal-wrapper"), {
        display: "block",
      });
      showModal(main);
      dispatchBodyEvent("shown");
    }

    if ("settings" === config.display.mode) {
      showSettings(main);
      dispatchBodyEvent("shown");
    }
  }
}

function createFloatingButton() {
  const button = document.createElement("div");
  button.setAttribute("id", "floating-settings-button");
  button.innerHTML = `<?xml version="1.0" ?><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M 16 4 C 9.371094 4 4 9.371094 4 16 C 4 22.628906 9.371094 28 16 28 C 22.628906 28 28 22.628906 28 16 C 28 15.515625 27.964844 15.039063 27.90625 14.566406 C 27.507813 14.839844 27.023438 15 26.5 15 C 25.421875 15 24.511719 14.3125 24.160156 13.359375 C 23.535156 13.757813 22.796875 14 22 14 C 19.789063 14 18 12.210938 18 10 C 18 9.265625 18.210938 8.585938 18.558594 7.992188 C 18.539063 7.996094 18.519531 8 18.5 8 C 17.117188 8 16 6.882813 16 5.5 C 16 4.941406 16.1875 4.433594 16.496094 4.019531 C 16.332031 4.011719 16.167969 4 16 4 Z M 23.5 4 C 22.671875 4 22 4.671875 22 5.5 C 22 6.328125 22.671875 7 23.5 7 C 24.328125 7 25 6.328125 25 5.5 C 25 4.671875 24.328125 4 23.5 4 Z M 14.050781 6.1875 C 14.25 7.476563 15 8.585938 16.046875 9.273438 C 16.015625 9.511719 16 9.757813 16 10 C 16 13.308594 18.691406 16 22 16 C 22.496094 16 22.992188 15.9375 23.46875 15.8125 C 24.152344 16.4375 25.015625 16.851563 25.953125 16.96875 C 25.464844 22.03125 21.1875 26 16 26 C 10.484375 26 6 21.515625 6 16 C 6 11.152344 9.46875 7.097656 14.050781 6.1875 Z M 22 9 C 21.449219 9 21 9.449219 21 10 C 21 10.550781 21.449219 11 22 11 C 22.550781 11 23 10.550781 23 10 C 23 9.449219 22.550781 9 22 9 Z M 14 10 C 13.449219 10 13 10.449219 13 11 C 13 11.550781 13.449219 12 14 12 C 14.550781 12 15 11.550781 15 11 C 15 10.449219 14.550781 10 14 10 Z M 27 10 C 26.449219 10 26 10.449219 26 11 C 26 11.550781 26.449219 12 27 12 C 27.550781 12 28 11.550781 28 11 C 28 10.449219 27.550781 10 27 10 Z M 11 13 C 9.894531 13 9 13.894531 9 15 C 9 16.105469 9.894531 17 11 17 C 12.105469 17 13 16.105469 13 15 C 13 13.894531 12.105469 13 11 13 Z M 16 15 C 15.449219 15 15 15.449219 15 16 C 15 16.550781 15.449219 17 16 17 C 16.550781 17 17 16.550781 17 16 C 17 15.449219 16.550781 15 16 15 Z M 12.5 19 C 11.671875 19 11 19.671875 11 20.5 C 11 21.328125 11.671875 22 12.5 22 C 13.328125 22 14 21.328125 14 20.5 C 14 19.671875 13.328125 19 12.5 19 Z M 19.5 20 C 18.671875 20 18 20.671875 18 21.5 C 18 22.328125 18.671875 23 19.5 23 C 20.328125 23 21 22.328125 21 21.5 C 21 20.671875 20.328125 20 19.5 20 Z"/></svg>`;

  applyStyles(button, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "50px",
    height: "50px",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
    zIndex: 1000,
    padding: "5px",
    transition: "transform 0.3s ease",
  });

  document.body.appendChild(button);

  button.addEventListener("click", function () {
    showSettings(document.querySelector("#consent-banner-main"));
  });
}

window.cookiesBannerJs = function (
  overrideLoadConsentState,
  overrideSaveConsentState,
  config
) {
  loadConsentState = overrideLoadConsentState;
  saveConsentState = overrideSaveConsentState;
  ready(consentBannerJsMain.bind(null, config));
};

window.dispatchEvent(new CustomEvent("consent-banner.ready"));
