// Saves options to chrome.storage
const saveOptions = () => {
  const oldContentColor = document.getElementById('oldContentColor').value;
  const newContentColor = document.getElementById('newContentColor').value;

  chrome.storage.sync.set(
    { oldContentColor: oldContentColor, newContentColor: newContentColor },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
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
    { oldContentColor: '#ffcccc', newContentColor: '#ccffcc' },
    (items) => {
      document.getElementById('oldContentColor').value = items.oldContentColor;
      document.getElementById('newContentColor').value = items.newContentColor;
    }
  );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);
