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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type == 'APPLY_FAIL') {
    updateStatus('An error occurred. Could not apply diff.');
    hideWheel();
    return;
  }
  if (message.type === 'STATE_UPDATE') {
    console.log('Got a runtime state update:', message.state);
    processState(message.state);
  }
});

//message the background worker asking for state
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
  if (response && response.state) {
    // Handle the state response if needed
    console.log('Current state:', response.state);
    processState(response.state);
  }
});

function processState(state) {
  if (
    state.state == 'APPLY_SUCCESS' ||
    state.state == 'IDLE' ||
    state.state == 'SNAPSHOT_SEARCH_COMPLETE'
  ) {
    searchButton.disabled = false;
  } else {
    searchButton.disabled = true;
  }

  if (state.state == 'SNAPSHOT_SEARCH_COMPLETE') {
    if (state.timestamp == null) {
      updateStatus('No snapshot found in range.');
      hideWheel();
      return;
    }

    foundDate = state.timestamp;
    foundDate =
      foundDate.slice(0, 4) +
      '-' +
      foundDate.slice(4, 6) +
      '-' +
      foundDate.slice(6, 8);
    updateStatus('Date Found! Loading HTML from ' + foundDate);
    showWheel();
  }
  if (state.state == 'SNAPSHOT_SEARCH_BEGIN') {
    updateStatus('Searching for closest date...');
    startLoading();
  }
  if (state.state == 'APPLY_SUCCESS') {
    foundDate = state.timestamp;
    foundDate =
      foundDate.slice(0, 4) +
      '-' +
      foundDate.slice(4, 6) +
      '-' +
      foundDate.slice(6, 8);
    updateStatus('Showing diff from: ' + foundDate);
    hideWheel();
  }
  //regardless set dates
  if (state.state != 'IDLE') {
    startDate.value = state.start;
    endDate.value = state.end;
  }
}

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
    searchButton.disabled = true;
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

function updateStatus(status) {
  statusTooltip.textContent = status;
  statusDiv.style.display = '';
}

function showWheel() {
  statusWheel.style.display = '';
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
