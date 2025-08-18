// let loading = false;

async function getClosestDate(url) {
  let urlParams = {
    url: url,
    from: '20241206010101', //december 2024
    to: '20250106010101', //january 2025
    limit: -1, // latest snapshot
    output: 'json',
    fl: 'timestamp',
  };
  let searchUrl = new URL('https://web.archive.org/cdx/search/cdx');
  Object.keys(urlParams).forEach((key) =>
    searchUrl.searchParams.append(key, urlParams[key])
  );
  console.log(`Fetching closest date for: ${searchUrl}`);
  let response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  let data = await response.json();
  if (data.length > 1) {
    // The first entry is the header, so we take the second one
    return data[1][0]; // Return the timestamp
  } else {
    throw new Error('No archived snapshot available');
  }
}

async function getClosestArchive(site, date) {
  let url = `https://archive.org/wayback/available?url=${site}&timestamp=${date}`;
  console.log(`Fetching closest archive for: ${url}`);
  //do an async get request to the url
  let response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  let data = await response.json();
  if (data.archived_snapshots.closest) {
    return data.archived_snapshots.closest.url;
  } else {
    throw new Error('No archived snapshot available');
  }
}
async function getHTMLContent(url) {
  try {
    const res = await fetch(url);
    return (text = await res.text());
  } catch (e) {
    return (text = `<h1>Fetch failed: ${e}</h1>`);
  }
}
async function run(tab) {
  const currentTab = tab.url;
  console.log(`Current tab URL: ${currentTab}`);
  let closestDate = await getClosestDate(currentTab);
  console.log(`Closest date: ${closestDate}`);
  let closestURL = await getClosestArchive(currentTab, closestDate);
  console.log(`Closest URL: ${closestURL}`);
  //promote that to https
  closestURL = closestURL.replace('http://', 'https://');
  let html = await getHTMLContent(closestURL);
  //   const clean = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  return html;
}

//some setup
chrome.action.onClicked.addListener(async (tab) => {
  let html = await run(tab);

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (h) => {
      loading = false;
      document.open();
      document.write(h);
      document.close();
    },
    args: [html],
  });
});
