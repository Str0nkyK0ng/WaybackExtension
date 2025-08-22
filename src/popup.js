function sendToContentScript(json) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, json, (response) => {});
  });
}

let startDate = document.getElementById('start');
let endDate = document.getElementById('end');
let searchButton = document.getElementById('search');
let statusDiv = document.getElementById('status-div');
let statusTooltip = document.getElementById('status');
let statusWheel = document.getElementById('spinning-icon');
let foundDate = '';

console.log('Popup script running.');

let defaultStart = new Date('2024-12-01');
let defaultEnd = new Date('2025-01-01');

startDate.value = defaultStart.toISOString().split('T')[0];
endDate.value = defaultEnd.toISOString().split('T')[0];

searchButton.addEventListener('click', () => {
  const start = startDate.value;
  const end = endDate.value;
  console.log('Talking to ContentWorker');
  //Communicate to the contentScript:
  startLoading();
  sendToContentScript({
    type: 'GetCurrentHTML',
    payload: {
      start,
      end,
    },
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('ASdnLKSNAD');
  if (message.type === 'SEARCH_RESULT') {
    foundDate = message.payload.timestamp;
    foundDate =
      foundDate.slice(0, 4) +
      '-' +
      foundDate.slice(4, 6) +
      '-' +
      foundDate.slice(6, 8);

    updateStatus('Date Found! Loading HTML from ' + foundDate);
  }
  if (message.type == 'SEARCH_COMPLETE') {
    updateStatus('Displaying differences from ' + foundDate);

    hideWheel();
  }
});

function updateStatus(status) {
  statusTooltip.textContent = status;
}

function hideWheel() {
  statusWheel.style.display = 'none';
}
function startLoading() {
  statusDiv.style.display = '';
}
function stopLoading() {
  statusDiv.style.display = 'none';
}
stopLoading();

let optionsButton = document.getElementById('options');
optionsButton.addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage().catch((error) => {
      console.error('Could not open options page:', error);
      // Fallback to opening options.html directly
      window.open(chrome.runtime.getURL('options.html'));
    });
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

let sourceButton = document.getElementById('source');
sourceButton.addEventListener('click', () => {
  window.open('https://github.com', '_blank');
});
