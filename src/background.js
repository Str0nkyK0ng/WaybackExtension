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
  if (data.length > 1) {
    // The first entry is the header, so we take the second one
    return data[1][0]; // Return the timestamp
  } else {
    throw new Error('No archived snapshot available:' + JSON.stringify(data));
  }
}

async function getClosestArchive(site, date) {
  // It's odd, but the archive might store the site under http or https. So we'll fetch both
  site = site.replace(/^https?:\/\//, '');
  const protocols = ['http://', 'https://'];
  let lastError;
  for (const protocol of protocols) {
    let urlParams = {
      url: utf8.encode(protocol + site),
      timestamp: date,
    };
    const url = new URL(`https://archive.org/wayback/available`);
    Object.keys(urlParams).forEach((key) =>
      url.searchParams.append(key, urlParams[key])
    );
    console.log(`Fetching closest archive for: ${url}`);

    try {
      let response = await fetch(url);
      if (!response.ok) {
        lastError = `HTTP error! status: ${response.status}`;
        continue;
      }
      let data = await response.json();
      if (data.archived_snapshots.closest) {
        return data.archived_snapshots.closest.url;
      }
    } catch (e) {
      lastError = e;
      console.error('Error on protocol', protocol, ' ', e);
      continue;
    }
  }
  throw new Error('Error getting snapshot: ' + lastError);
}

async function getHTMLContent(url) {
  try {
    const res = await fetch(url);
    return await res.text();
  } catch (e) {
    console.error(e);
  }
}
async function run(currentTab, startTime, endTime) {
  let closestDate = await getClosestSnapshot(currentTab, startTime, endTime);
  console.log(`Closest date: ${closestDate}`);
  let closestURL = await getClosestArchive(currentTab, closestDate);
  // promote down to http
  closestURL = closestURL.replace('https', 'http');
  // Postpend 'fw_' after the timestamp in the closestURL
  closestURL = closestURL.replace(/(\/web\/\d{14})/, '$1fw_');
  console.log(`Closest URL: ${closestURL}`);
  // attempt to add some text to the path after /web
  let html = await getHTMLContent(closestURL);
  console.log(`Got Old HTML Content: ${html}`);
  return html;
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
