import {
  isValidConfigJson,
  setAndFormatJSON,
  showTextArea,
} from './jsonOptions';
// prettier-ignore
const defaultConfig = {
  ".*": {
    "start": 20200101,
    "end": 20250101
  }
};
const status = document.getElementById('status');
let useCustomConfigCheckbox = document.getElementById('useCustomConfig');
let configJson = document.getElementById('configJSON');

// Saves options to chrome.storage
const saveOptions = () => {
  let config = defaultConfig;
  if (useCustomConfigCheckbox.checked) {
    //first check if the json is valid
    config = isValidConfigJson(configJson.value);
    console.log('config', config);
    if (config == false) {
      status.textContent = 'Options could not be saved - JSON is invalid.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
      return;
    }
  }

  const oldContentColor = document.getElementById('oldContentColor').value;
  const newContentColor = document.getElementById('newContentColor').value;

  chrome.storage.sync.set(
    {
      oldContentColor: oldContentColor,
      newContentColor: newContentColor,
      config: config,
      usingConfig: useCustomConfigCheckbox.checked,
    },
    () => {
      // Update status to let user know options were saved.
      console.log('Saved Config:', config);
      status.textContent = 'Options saved.';
      alert(config);
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    }
  );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get(
    {
      oldContentColor: '#ffcccc',
      newContentColor: '#ccffcc',
      config: null,
      usingConfig: false,
    },
    (items) => {
      document.getElementById('oldContentColor').value = items.oldContentColor;
      document.getElementById('newContentColor').value = items.newContentColor;
      useCustomConfigCheckbox.checked = items.usingConfig;
      if (items.usingConfig) {
        console.log('loaded:', items.config);
        configJson.innerText = setAndFormatJSON(items.config);
        showTextArea();
      }
    }
  );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);
