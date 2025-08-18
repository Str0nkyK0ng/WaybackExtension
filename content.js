// let header = document.getElementById('status');
// console.log('Header element:', header);
// let exampleJson = {
//   url: 'https://www.cdc.gov/rsv/hcp/vaccine-clinical-guidance/pregnant-people.html',
//   archived_snapshots: {
//     closest: {
//       status: '200',
//       available: true,
//       url: 'http://web.archive.org/web/20250715015226/https://www.cdc.gov/rsv/hcp/vaccine-clinical-guidance/pregnant-people.html',
//       timestamp: '20250715015226',
//     },
//   },
// };

chrome.action.onClicked.addListener(async (tab) => {
  // Fetch from archive in extension context (no CORS block)
  const url = 'https://web.archive.org/web/20250813204736/https://www.cdc.gov/';
  let text;
  try {
    const res = await fetch(url);
    text = await res.text();
  } catch (e) {
    text = `<h1>Fetch failed: ${e}</h1>`;
  }

  // Inject into the active tab
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (html) => {
      document.open();
      document.write(html);
      document.close();
    },
    args: [text],
  });
});
