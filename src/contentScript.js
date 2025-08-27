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
import HtmlDiff from 'htmldiff-js';

let newContentColor;
let oldContentColor;
await chrome.storage.sync.get(
  { oldContentColor: '#ffcccc', newContentColor: '#ccffcc' },
  (items) => {
    newContentColor = items.newContentColor;
    oldContentColor = items.oldContentColor;
    console.log('Content Colors:', newContentColor, oldContentColor);
  }
);

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
    // send a message to the BACKGROUND worker
    chrome.runtime.sendMessage(message);
  }
  if (request.type === 'REPLACE') {
    let oldHTML = request.payload.html;
    console.log('Calculating diff to apply');

    try {
      document.documentElement.innerHTML = HtmlDiff.execute(
        oldHTML,
        document.documentElement.innerHTML
      );
    } catch (e) {
      console.log('Error:', e);
      chrome.runtime.sendMessage({
        type: 'APPLY_FAIL',
        error: e,
      });
      return;
    }

    // Add styling for diff modifications
    const style = document.createElement('style');
    style.textContent = `
      ins {
      background-color: ${newContentColor};
      font-style: italic;
      }
      del  {
      background-color: ${oldContentColor};
      font-style: italic;
      }

    `;
    document.head.appendChild(style);

    // tell the popup that the work is complete
    chrome.runtime.sendMessage({
      type: 'SEARCH_COMPLETE',
    });
  }
});

function ping() {
  console.log('Alive');
  setTimeout(() => {
    ping();
  }, 1000);
}
ping();
