chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveWebsite") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      let activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {action: "getHTML"}, (response) => {
        if (response && response.html) {
          let blob = new Blob([response.html], {type: 'text/html'});
          let url = URL.createObjectURL(blob);
          let filename = activeTab.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
          
          chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
          });
        }
      });
    });
  }
});