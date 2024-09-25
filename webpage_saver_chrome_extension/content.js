chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getHTML") {
    let html = document.documentElement.outerHTML;
    sendResponse({html: html});
  }
});