'use strict';
import { DiffDOM } from 'diff-dom';

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
    // send a message to the BACKGROUND worker
    chrome.runtime.sendMessage(message);
  }
  if (request.type === 'REPLACE') {
    console.log('Calculating diff to apply');
    let oldHTML = request.payload.html;
    let parser = new DOMParser();
    let oldDocument = parser.parseFromString(oldHTML, 'text/html');

    let dd = new DiffDOM({
      preDiffApply: function (info) {
        // Skip if replacing a SCRIPT element
        if (info.diff.action === 'replaceElement') {
          let newHTML = info.diff.newValue;
          if (newHTML) {
            if (
              newHTML.nodeName === 'SCRIPT' &&
              newHTML.attributes &&
              newHTML.attributes.src
            ) {
              console.log('Removed Script', JSON.stringify(info));
              return true;
            }
            if (
              (newHTML.attributes &&
                newHTML.attributes.rel === 'stylesheet prefetch') ||
              (oldHTML &&
                oldHTML.attributes &&
                oldHTML.attributes.rel === 'stylesheet prefetch')
            ) {
              console.log('Removed external CSS', JSON.stringify(info));
              return true;
            }
          }
        }
        // Skip if adding or replacing an element with rel="stylesheet prefetch"

        // {"action":"addElement","element":{"nodeName":"SCRIPT"}}
        if (
          info.diff.action == 'addElement' &&
          info.diff.element.nodeName == 'SCRIPT'
        ) {
          console.log(JSON.stringify(info));
          return true;
        }
      },
    });
    let domdif = dd.diff(document.documentElement, oldDocument.documentElement);
    console.log('Diff', JSON.stringify(domdif));
    // Apply the diff to the actual DOM
    dd.apply(document.documentElement, domdif);
  }
});
