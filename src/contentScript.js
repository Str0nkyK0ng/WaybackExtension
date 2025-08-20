'use strict';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

// Log `title` of current active web page

// Communicate with background file by sending a message

console.log('Content script running.');
// Listen for message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //TODO: Apply the diff / do something with it
  console.log('Got message');

  if (request.type == 'GetCurrentHTML') {
    console.log('Got message from popup');
    let start = request.payload.start;
    let end = request.payload.end;
    let message = {
      type: 'INITIAL',
      payload: {
        html: document.documentElement.outerHTML,
        URL: document.URL,
        start,
        end,
      },
    };
    console.log(JSON.stringify(message));
    // send a message to the BACKGROUND worker
    chrome.runtime.sendMessage(message);
  }
  if (request.type === 'REPLACE') {
    let replaceHTML = request.payload.html;
    document.open();
    document.write(replaceHTML);
    document.close();
  }
});
