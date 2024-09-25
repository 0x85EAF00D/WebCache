document.getElementById('saveButton').addEventListener('click', () => {
  chrome.runtime.sendMessage({action: "saveWebsite"});
});