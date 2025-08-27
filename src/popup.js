const { applyConfig } = require('./applyConfig');

function sendToContentScript(json) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, json, (response) => {});
  });
}

async function getUrl() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      resolve(tab.url);
    });
  });
}
let startDate = document.getElementById('start');
let endDate = document.getElementById('end');
let searchButton = document.getElementById('search');
let statusDiv = document.getElementById('status-div');
let statusTooltip = document.getElementById('status');
let statusWheel = document.getElementById('spinning-icon');
let foundDate = '';

console.log('Popup script running:');

//determine the defaultStart and end based on the user's configs

let defaultStart = new Date('2024-12-01');
let defaultEnd = new Date('2025-01-01');
const restoreOptions = async () => {
  console.log('Restoring options');
  chrome.storage.sync.get(
    {
      oldContentColor: '#ffcccc',
      newContentColor: '#ccffcc',
      config: null,
      usingConfig: false,
    },
    async (items) => {
      if (items.usingConfig) {
        console.log('Using Config');
        let url = await getUrl();
        let configDates = applyConfig(items.config, url);
        if (configDates) {
          console.log('applying config');
          defaultStart = configDates.start;
          defaultEnd = configDates.end;
          console.log(
            'Start:',
            defaultStart.toISOString(),
            ',End:',
            defaultEnd.toISOString()
          );
          startDate.value = defaultStart.toISOString().split('T')[0];
          endDate.value = defaultEnd.toISOString().split('T')[0];
        }
      }
    }
  );
};
document.addEventListener('DOMContentLoaded', restoreOptions);

searchButton.addEventListener('click', () => {
  const start = startDate.value;
  const end = endDate.value;

  //make sure start and end are values
  if (!start || !end) {
    updateStatus('Please select start and end dates.');
  } else {
    //Communicate to the contentScript:
    updateStatus('Searching for closest date...');
    startLoading();
    sendToContentScript({
      type: 'GetCurrentHTML',
      payload: {
        start,
        end,
      },
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type == 'APPLY_FAIL') {
    updateStatus('An error occurred. Could not apply diff.');
    hideWheel();

    return;
  }
  if (message.type === 'SEARCH_RESULT') {
    if (message.payload.timestamp == null) {
      updateStatus('No snapshot found in range.');
      hideWheel();
      return;
    }

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
  statusDiv.style.display = '';
}

function hideWheel() {
  statusWheel.style.display = 'none';
}
function startLoading() {
  statusDiv.style.display = '';
  statusWheel.style.display = '';
}
function stopLoading() {
  statusDiv.style.display = 'none';
  statusWheel.style.display = 'none';
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
  window.open('https://github.com/Str0nkyK0ng/WaybackExtension', '_blank');
});
