'use strict';
const utf8 = require('utf8');
console.log('Background Worker Initialized:' + new Date().toISOString());

let stateData = {
  state: 'IDLE',
};

//tab data = name and state
let tabData = {};

let currentTabURL = '';

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    swapToNewURL(tab.url, tab.id);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    swapToNewURL(tab.url, tab.id);
  }
});

function swapToNewURL(newURL, tabId) {
  // Store the old tab data only if we have a valid current URL
  if (currentTabURL) {
    console.log('Storing old tab data for:', currentTabURL, ' before leaving');
    tabData[currentTabURL] = { ...stateData };
  }
  currentTabURL = newURL;
  // Restore state for the new tab or create default state
  if (tabData[currentTabURL] != null) {
    stateData = tabData[currentTabURL];
    console.log('Tab switched to:', newURL, 'state:', stateData.state);
  } else {
    stateData = { state: 'IDLE', tabId };
    tabData[currentTabURL] = { ...stateData };
  }
}

async function getClosestSnapshot(url, start, end) {
  let urlParams = {
    url: utf8.encode(url),
    from: start,
    to: end,
    limit: 1, // latest snapshot
    output: 'json',
    fl: 'timestamp',
  };
  let searchUrl = new URL('https://web.archive.org/cdx/search/cdx');
  Object.keys(urlParams).forEach((key) =>
    searchUrl.searchParams.append(key, urlParams[key])
  );
  console.log('Search URL:', searchUrl.toString());
  let response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  let data = await response.json();
  console.log('Closest earch Response:' + JSON.stringify(data));

  stateData = {
    ...stateData,
    state: 'SNAPSHOT_SEARCH_COMPLETE',
    timestamp: data.length > 1 ? data[1][0] : null,
    url: url,
  };

  // Send the response back to the popup
  chrome.runtime.sendMessage({
    type: 'STATE_UPDATE',
    state: stateData,
  });

  if (data.length > 1) {
    return data[1][0]; //  // The first entry is the header, so we take the second one
  } else {
    throw new Error('No archived snapshot available:' + JSON.stringify(data));
  }
}

async function getClosestArchive(site, date) {
  let url = new URL(`https://web.archive.org/web/${date}/${site}`);
  // It's odd, but the archive might store the site under http or https. So we'll fetch both
  site = site.replace(/^https?:\/\//, '');
  console.log(`Fetching archive for: ${url} on ${date}`);

  try {
    let response = await fetch(url);
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
    }
    let text = await response.text();
    return text;
  } catch (e) {
    console.error('Error:', e);
  }
}

async function run(currentTab, startTime, endTime) {
  let closestDate = await getClosestSnapshot(currentTab, startTime, endTime);
  let closestURL = await getClosestArchive(currentTab, closestDate);
  console.log(`Got Old HTML Content: ${closestURL}`);
  return closestURL;
}

//communicate with the content script to use the html / url
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'APPLY_SUCCESS') {
    console.log('Got APPLY_SUCCESS from content worker');
    //set it in our state
    stateData = {
      ...stateData,
      state: 'APPLY_SUCCESS',
    };
    chrome.runtime.sendMessage({
      type: 'STATE_UPDATE',
      state: stateData,
    });
  }

  if (request.type === 'GET_STATE') {
    //always just send the state to the popup
    console.log('Providing state update');
    sendResponse({
      type: 'STATE_UPDATE',
      state: stateData,
    });
  }

  if (request.type === 'INITIAL') {
    console.log('Starting search');
    let url = request.payload.URL;
    let start = request.payload.start.replaceAll('-', '') + '010101';
    let end = request.payload.end.replaceAll('-', '') + '010101';
    console.log(start, end);

    let html = await run(url, start, end);
    //msg the contentScript the older html
    console.log('Messaging content script:' + tabData[url].tabId);
    chrome.tabs.sendMessage(tabData[url].tabId, {
      type: 'REPLACE',
      payload: {
        html,
      },
    });
  }
  return true;
});
