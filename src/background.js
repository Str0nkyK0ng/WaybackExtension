'use strict';
// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages
const utf8 = require('utf8');
console.log('Background Worker Initialized');
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

  // Send the response back to the popup
  chrome.runtime.sendMessage({
    type: 'SEARCH_RESULT',
    payload: {
      data: data,
      url: url,
      timestamp: data.length > 1 ? data[1][0] : null,
    },
  });

  if (data.length > 1) {
    // The first entry is the header, so we take the second one
    return data[1][0]; // Return the timestamp
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
  console.log(`Closest date: ${closestDate}`);
  let closestURL = await getClosestArchive(currentTab, closestDate);
  console.log(`Got Old HTML Content: ${closestURL}`);
  return closestURL;
}

//communicate with the content script to use the html / url
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'INITIAL') {
    let url = request.payload.URL;
    let start = request.payload.start.replaceAll('-', '') + '010101';
    let end = request.payload.end.replaceAll('-', '') + '010101';
    console.log(start, end);

    let html = await run(url, start, end);

    //msg the contentScript the older html
    console.log('Messaging content script');
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'REPLACE',
      payload: {
        html,
      },
    });
  }
  return true;
});
