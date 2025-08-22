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
    let oldHTML = request.payload.html;
    let parser = new DOMParser();
    let oldDocument = parser.parseFromString(oldHTML, 'text/html');
    console.log('Calculating diff to apply');

    let diffRanges = [];
    let dd = new DiffDOM({
      preVirtualDiffApply: function (info) {
        console.log('preVirtualDiffApply', JSON.stringify(info));
        // let diff = info.diff;

        // if (diff.action == 'replaceElement' && diff.oldValue && diff.newValue) {
        // }
      },
      // preDiffApply: function (info) {
      //   console.log('preDiffApply', info);
      // },
      // postDiffApply: function (info) {
      //   let range = new Range();

      //   // Set range based on the node being modified
      //   if (info.node && info.node.parentNode) {
      //     console.log(info);
      //     range.setStartBefore(info.node);
      //     range.setEndAfter(info.node);
      //     diffRanges.push(range);
      //   }
      // },
    });
    //style all the ranges

    let domdif = dd.diff(document.documentElement, oldDocument.documentElement);
    // console.log('Diff', JSON.stringify(domdif));
    // Apply the diff to the actual DOM
    dd.apply(document.documentElement, domdif);
    //also inject this css
    let style = document.createElement('style');
    style.textContent = `
      ::highlight(user-1-highlight) {
        background-color: yellow;
        color: black;
      }
    `;
    let highlight = new Highlight(...diffRanges);
    CSS.highlights.set('user-1-highlight', highlight);
    document.head.appendChild(style);
  }
});
