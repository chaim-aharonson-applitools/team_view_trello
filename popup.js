let teamList,
  unassignedOnly,
  isViewChecked = true,
  toggleView,
  dataInitialized = false,
  btn_edit,
  allUsersWrap,
  editMode = false;
const windowIdealHeight = 260;
const noSelectedUsersText = "No selected Users!";
function clickedUnAssigned() {
  if (!editMode) {
    const isChecked = document.getElementById("unassigned").checked;
    if (isChecked) {
      Array.from(document.querySelectorAll(`ul#allTeamUsers li input`)).map(
        (item) => {
          item.checked = false;
        }
      );
      updateTrello(["unassigned"]);
      return;
    }
    updateTrello([]);
  }
}
function clickedRemoveUser(target) {
  toggleLoadingImage(false);
  const li = target.closest("li");
  // uncomment to unset 'edit mode' upon each user removal
  //toggleEditMode();
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { user: li.getAttribute("id"), action: "removeUser" },
      function (response) {
        getUsersData();
      }
    );
  });
}
function delayStyle(elt, prop, value, delay = 500, callback = () => {}) {
  setTimeout(() => {
    elt.style[prop] = value;
    callback();
  }, delay);
}
function clickedAddBulkUsers() {
  const selected = [];
  Array.from(document.querySelectorAll(`ul#allUsersList li input`)).map(
    (item) => {
      if (item.checked) {
        selected.push(item.getAttribute("id"));
      }
    }
  );
  if (selected.length) {
    allUsersWrap.innerHTML = "";
    toggleEditMode();
    toggleLoadingImage(false);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { users: selected, action: "addBulkUsers" },
        function (response) {
          getUsersData();
        }
      );
    });
  } else {
    const warn = document.getElementById("warn");
    warn.style.display = "block";
    warn.style.opacity = "1";
    const callback = () => {
      delayStyle(warn, "display", "none");
    };
    delayStyle(warn, "opacity", 0, 1000, callback);
  }
}
function clickedUsers(e) {
  if (editMode && e) {
    e.preventDefault();
    e.stopPropagation();
    clickedRemoveUser(e.target);
    return;
  }
  const selected = [];
  Array.from(document.querySelectorAll(`ul#allTeamUsers li input`)).map(
    (item) => {
      if (item.checked) {
        const li = item.closest("li");
        selected.push(li.getAttribute("id"));
      }
    }
  );
  document.getElementById("unassigned").checked = false;
  //console.log("clickedUsers > selected", selected);
  updateTrello(selected);
}
function updateTrello(selected) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "updateSelected", selected },
      function (response) {
        if (response) {
          setViewMode();
        }
      }
    );
  });
}
function toggleLoadingImage(status) {
  dataInitialized = status;
  document.querySelector("#title img").style.display = dataInitialized
    ? "none"
    : "block";
}
function getAllUsersList() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "getAllusers" },
      function (response) {
        allUsersWrap.innerHTML = "";
        allUsersWrap.classList.add("active");
        const allUsers = response.allUsers;
        const ul = document.createElement("ul");
        ul.setAttribute("id", "allUsersList");
        let lis = "";
        allUsers.forEach((user) => {
          lis += `<li><label><input type='checkbox' id='${user}'/> ${user}</label></li>`;
        });
        ul.innerHTML = lis;
        allUsersWrap.appendChild(ul);
        const btn = document.createElement("button");
        const text = document.createTextNode("Add selected to team");
        btn.appendChild(text);
        btn.addEventListener("click", () => {
          clickedAddBulkUsers();
        });
        allUsersWrap.appendChild(btn);
        const warn = document.createElement("div");
        warn.setAttribute("id", "warn");
        warn.setAttribute("style", "display: none; opacity: 0;");
        const warn_text = document.createTextNode(noSelectedUsersText);
        warn.appendChild(warn_text);
        allUsersWrap.appendChild(warn);
      }
    );
  });
}
function getUsersData() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "getUsersData" },
      function (response) {
        if (!response) {
          setTimeout(() => {
            console.log("recall...");
            getUsersData();
          }, 1000);
        } else {
          toggleLoadingImage(true);
          const users = response.users || [];
          const selected = response.selected || [];
          if (users.length) {
            const ul = document.createElement("ul");
            ul.setAttribute("id", "allTeamUsers");
            users.forEach((user) => {
              const li = document.createElement("li");
              const label = document.createElement("label");
              const checkbox = document.createElement("input");
              checkbox.setAttribute("type", "checkbox");
              checkbox.checked = selected.indexOf(user) > -1;
              label.appendChild(checkbox);
              const text = document.createTextNode(user);
              label.appendChild(text);
              li.appendChild(label);
              const span = document.createElement("span");
              li.appendChild(span);
              li.setAttribute("id", user);
              ul.appendChild(li);
            });
            ul.addEventListener("click", (e) => {
              clickedUsers(e);
            });
            teamList.innerHTML = "";
            teamList.appendChild(ul);
          }

          const ul2 = document.createElement("ul");
          const li2 = document.createElement("li");
          li2.innerHTML = `<li><label><input type='checkbox' id='unassigned'/>Unassigned</label></li>`;
          li2.addEventListener("click", () => {
            clickedUnAssigned();
          });
          ul2.appendChild(li2);
          unassignedOnly.innerHTML = "";
          unassignedOnly.appendChild(ul2);
          isViewChecked = response.viewMode;
          toggleView.querySelector("input").checked = isViewChecked;
          if (selected.length) {
            clickedUsers();
          } else {
            setViewMode();
          }
        }
      }
    );
  });
}
function setViewMode() {
  toggleView.classList.remove("active");
  if (isViewChecked) {
    toggleView.classList.add("active");
  }
}

function toggleEditMode() {
  editMode = !editMode;
  allUsersWrap.innerHTML = "";
  document.body.style.height = windowIdealHeight + "px";
  document.body.style.maxHeight = windowIdealHeight + "px";
  teamList.classList.remove("edit-mode");
  btn_edit.classList.remove("active");
  allUsersWrap.classList.remove("active");
  if (editMode) {
    document.body.style.height = "auto";
    document.body.style.maxHeight = "auto";
    teamList.classList.add("edit-mode");
    btn_edit.classList.add("active");
    getAllUsersList();
  }
}

function initMyTrelloConfig() {
  teamList = document.querySelector("#teamList");
  unassignedOnly = document.querySelector("#unassignedOnly");
  toggleView = document.querySelector("#toggleView");

  setViewMode();
  toggleView.addEventListener("mouseup", () => {
    if (dataInitialized) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "toggleView" },
          function (response) {
            if (response) {
              isViewChecked = response.viewMode;
              setViewMode();
            }
          }
        );
      });
    }
  });
  getUsersData();
  document.body.style.height = windowIdealHeight + "px";
  document.body.style.maxHeight = windowIdealHeight + "px";
  btn_edit = document.querySelector("#btn_edit");
  btn_edit.addEventListener("click", () => {
    if (dataInitialized) {
      toggleEditMode();
    }
  });

  allUsersWrap = document.querySelector("#allUsersWrap");

  document.querySelector("#close").addEventListener("click", () => {
    window.close();
  });
}
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    initMyTrelloConfig();
  }, 100);
});
