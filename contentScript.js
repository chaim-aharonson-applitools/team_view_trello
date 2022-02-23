(function () {
  class LocalstorageHandler {
    constructor() {
      this.localstorage_name = "applitools_trello_users";
      let lsObject = localStorage.getItem(this.localstorage_name);
      lsObject = JSON.parse(lsObject);

      if (!lsObject) {
        lsObject = {};
      }
      this.lsObject = lsObject;
      Object.keys(lsObject).forEach((key) => {
        this[key] = lsObject[key];
      });
    }

    get(itemName) {
      return this[itemName];
    }
    set(itemName, value) {
      this.lsObject[itemName] = value;
      this[itemName] = value;
      localStorage.setItem(
        this.localstorage_name,
        JSON.stringify(this.lsObject)
      );
    }
    _get(itemName) {
      return this.get(itemName);
    }
    _set(itemName, value) {
      return this.set(itemName, value);
    }
  }
  let users,
    selected = [],
    viewMode = true,
    inProgress = false,
    lastUrl = null;
  const ls = new LocalstorageHandler();
  function isDefined(variable) {
    return !(typeof variable === "undefined" || variable === null);
  }
  function getAllusers() {
    const allUsersList = new Set();
    const dom = document.querySelectorAll(`#board .list-card`);
    Array.from(dom).map((item) => {
      Array.from(item.querySelectorAll(`.member`)).map((member) => {
        const elt =
          member.querySelector(".member-avatar") ||
          member.querySelector(".member-initials");
        const title = elt && elt.getAttribute("title");
        const regex = /(.+)(\s\((.+)\))/gm;
        const matches = regex.exec(title);
        const _user = matches[3];
        if (!users.includes(_user)) {
          allUsersList.add(matches[3]);
        }
      });
    });
    //console.log("all users", [...allUsersList]);
    return sortUsers([...allUsersList]);
  }
  function highlightUsersOnPage() {
    const dom = document.querySelectorAll(`#board .list-card`);
    inProgress = true;
    if (dom && dom.length) {
      const isUnassigned = selected.includes("unassigned");
      const _selected = isUnassigned ? users : selected;
      console.log("isUnassigned", isUnassigned, _selected);
      Array.from(dom).map((item) => {
        let found = false; //member-initials//img.member-avatar
        Array.from(item.querySelectorAll(`.member`)).map((member) => {
          const elt =
            member.querySelector(".member-avatar") ||
            member.querySelector(".member-initials");
          const title = elt && elt.getAttribute("title");
          const regex = /(.+)(\s\((.+)\))/gm;
          const matches = regex.exec(title);
          if (matches && _selected.includes(matches[3])) {
            found = true;
          }
        });
        if ((found && !isUnassigned) || (!found && isUnassigned)) {
          item.classList.add("my-trello");
        }
      });
      inProgress = false;
    } else {
      // wait for Trello page to load its content
      setTimeout(() => {
        highlightUsersOnPage();
      }, 1500);
    }
  }
  function handleCss() {
    removeCssFromPage();
    if (selected.length) {
      if (viewMode) {
        addCssToPage(" #board .list-card:not(.my-trello){opacity: 0.3;}");
      } else {
        addCssToPage(" #board .list-card:not(.my-trello){display: none;}");
      }
    }
  }
  function remove() {
    Array.from(document.querySelectorAll(`.my-trello`)).map((item) => {
      item.classList.remove("my-trello");
    });
  }
  function removeCssFromPage() {
    Array.from(document.getElementsByTagName(`style`)).map((item) => {
      if (item.getAttribute("id") === "my_trello") {
        item.parentNode.removeChild(item);
      }
    });
  }
  function sortUsers(list) {
    return list.sort((a, b) => (a > b ? 1 : -1));
  }
  function addCssToPage(additionalCss = "") {
    const css =
      "#board .list-card.my-trello { outline-offset: -2px; outline: 2px dashed red } #board .list-card.my-trello .list-card-title{background-color: #fff2cd}" +
      additionalCss;
    const head = document.head || document.getElementsByTagName("head")[0];
    const style = document.createElement("style");

    style.setAttribute("id", "my_trello");
    head.appendChild(style);

    if (style.styleSheet) {
      // This is required for IE8 and below.
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
  }
  function onUrlChange() {
    if (!inProgress) {
      inProgress = true;
      setTimeout(()=>{
        console.log("URL changed!", location.href);
        handleCss();
        remove();
        highlightUsersOnPage();
      }, 1000)
    }
  }
  users = ls._get("users") || [];
  selected = ls._get("selected") || [];
  viewMode = ls._get("viewMode");
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    console.log("action", request.action, request, users);
    if (request.action === "getUsersData") {
      sendResponse({
        users: users || [],
        viewMode: viewMode,
        selected: selected,
      });
    } else if (request.action === "updateSelected") {
      selected = request.selected;
      ls._set("selected", selected);
      handleCss();
      remove();
      highlightUsersOnPage();
      sendResponse({ status: "done" });
    } else if (request.action === "toggleView") {
      viewMode = !viewMode;
      ls._set("viewMode", viewMode);
      handleCss();
      sendResponse({ viewMode });
    } else if (request.action === "removeUser") {
      const user = request.user;
      users.splice(users.indexOf(user), 1);
      users = sortUsers(users);
      ls._set("users", users);
      sendResponse({ status: "done" });
    } else if (request.action === "addBulkUsers") {
      const new_users = request.users;
      users = users.concat(new_users);
      users = sortUsers(users);
      ls._set("users", users);
      sendResponse({ status: "done" });
    } else if (request.action === "getAllusers") {
      sendResponse({ allUsers: getAllusers() });
    } else if (request.action === "addUser") {
      // deprecated for now
      const user = request.user;
      users.push(user);
      ls._set("users", users);
      sendResponse({ status: "done" });
    }
  });
  handleCss();
  highlightUsersOnPage();
  lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      onUrlChange();
    }
  }).observe(document, { subtree: true, childList: true });
})();
