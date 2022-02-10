let usersList, unassignedOnly, isViewChecked = true, toggleView, dataInitialized = false, newUserText, btn_edit, newUserWrap, editMode = false;
function clickedUnAssigned() {
    if(!editMode){
        const isChecked = document.getElementById("unassigned").checked;
        if (isChecked) {
        Array.from(document.querySelectorAll(`ul#allUsers li input`)).map((item) => {
            item.checked = false;
        });
        updateTrello(["unassigned"]);
        return;
        }
        updateTrello([]);
    }
} 
function clickedRemoveUser(target) {
    toggleLoadingImage(false);
    const li = target.closest("li");
    toggleEditMode();
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { user: li.getAttribute('id'), action: 'removeUser' }, function (response) {
            getUsersData()
        });
    });
}

function clickedUsers(e) {
    if(editMode && e){
        e.preventDefault();
        e.stopPropagation();
        clickedRemoveUser(e.target);
        return;
    }
    const selected = [];
    Array.from(document.querySelectorAll(`ul#allUsers li input`)).map(item => {
        if (item.checked) {
            const li = item.closest('li');
            selected.push(li.getAttribute('id'));
        }
    })
    document.getElementById('unassigned').checked = false;
    console.log("clickedUsers > selected", selected);
    updateTrello(selected)
}   
function updateTrello(selected){
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSelected', selected }, function (response) {
            if (response) {
                setViewMode();
            }
        });
    });
}
function toggleLoadingImage(status){
    dataInitialized = status;
    document.querySelector("#title img").style.display = dataInitialized ? 'none' : 'block';
}
function getUsersData() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getUsersData' }, function (response) {
            if (!response) {
                setTimeout(() => {
                    console.log('recall...');
                    getUsersData();
                }, 1000)
            } else {
                toggleLoadingImage(true);
                const users = response.users || [];
                const selected = response.selected || [];
                if (users.length){
                    const ul = document.createElement('ul')
                    ul.setAttribute('id', 'allUsers');
                    users.forEach(user => {
                        const li = document.createElement('li')
                        const label = document.createElement("label");
                        const checkbox = document.createElement("input");
                        checkbox.setAttribute('type', 'checkbox')
                        checkbox.checked = selected.indexOf(user) > -1;
                        label.appendChild(checkbox);
                        const text = document.createTextNode(user);
                        label.appendChild(text);
                        li.appendChild(label);
                        const span = document.createElement("span");
                        li.appendChild(span);
                        li.setAttribute("id", user);
                        ul.appendChild(li)
                    })
                    ul.addEventListener('click', (e) => {
                        clickedUsers(e)
                    })
                    usersList.innerHTML = '';
                    usersList.appendChild(ul)
                }
                
                const ul2 = document.createElement('ul')
                const li2 = document.createElement('li')
                li2.innerHTML = `<li><label><input type='checkbox' id='unassigned'/>Unassigned</label></li>`
                li2.addEventListener('click', () => {
                    clickedUnAssigned()
                })
                ul2.appendChild(li2)
                unassignedOnly.innerHTML = '';
                unassignedOnly.appendChild(ul2)
                isViewChecked = response.viewMode;
                toggleView.querySelector('input').checked = isViewChecked;
                if(selected.length){
                    clickedUsers()
                }else{
                    setViewMode();
                }
            }
        });
    });
}
function setViewMode(){
    toggleView.classList.remove('active')
    if (isViewChecked){
        toggleView.classList.add('active')
    }
}

function toggleEditMode(){ 
    editMode = !editMode;
    newUserWrap.classList.remove("active");
    usersList.classList.remove("remove-mode");
    btn_edit.classList.remove("active");
    if (editMode) {
        newUserWrap.classList.add("active");
        usersList.classList.add("remove-mode");
        btn_edit.classList.add("active");
    }
}

function initMyTrelloConfig() {
    usersList = document.querySelector('#usersList');
    unassignedOnly = document.querySelector('#unassignedOnly');
    // isActiveCheck = document.querySelector('#isActiveCheck');
    toggleView = document.querySelector('#toggleView');
    
    setViewMode();
    toggleView.addEventListener('mouseup', () => {
        if (dataInitialized) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleView' }, function (response) {
                    if (response){
                        isViewChecked = response.viewMode;
                        setViewMode();
                    }
                });
            });
        }
    }) 
    getUsersData();
    newUserText = document.querySelector('#newUserText');
    const addNewUser = document.querySelector('#addNewUser');
    addNewUser.addEventListener('click', () => {
        if (newUserText.value.length && dataInitialized){
            toggleEditMode();
            toggleLoadingImage(false);
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { user: newUserText.value, action: 'addUser' }, function (response) {
                    newUserText.value = '';
                    getUsersData()
                });
            });
        }
    }) 
    btn_edit = document.querySelector("#btn_edit");
    btn_edit.addEventListener("click", () => {
      if (dataInitialized) {
        toggleEditMode();
      }
    });
    
    newUserWrap = document.querySelector("#newUserWrap");
    
    document.querySelector('#close').addEventListener('click', () => {
        window.close();
    })
}
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(()=>{
        initMyTrelloConfig();
    }, 100)
});