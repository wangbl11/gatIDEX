function saveOptions(e) {
  browser.storage.sync.set({
    localSave: document.querySelector("#localSave").value
  });
  e.preventDefault();
}

function restoreOptions() {
  var storageItem = browser.storage.managed.get('localSave');
  storageItem.then((res) => {
    document.querySelector("#managed-colour").innerText = res.localSave;
  });

  var gettingItem = browser.storage.sync.get('localSave');
  gettingItem.then((res) => {
    document.querySelector("#localSave").value = res.localSave;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
