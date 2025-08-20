function sendToContentScript(json) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, json, (response) => {});
  });
}

let startDate = document.getElementById('start');
let endDate = document.getElementById('end');
let searchButton = document.getElementById('search');
let statusHeader = document.getElementById('status');
console.log('Popup script running.');

let defaultStart = new Date('2024-12-01');
let defaultEnd = new Date('2025-01-01');

startDate.value = defaultStart.toISOString().split('T')[0];
endDate.value = defaultEnd.toISOString().split('T')[0];

// let loading = true;
// let dots = 0;
// function statusBlink() {
//   if (!loading) return;
//   dots = (dots + 1) % 3;
//   statusHeader.textContent = 'Loading' + '.'.repeat(dots + 1);
//   setTimeout(() => {
//     statusBlink();
//   }, 1000);
// }

searchButton.addEventListener('click', () => {
  const start = startDate.value;
  const end = endDate.value;
  console.log('Talking to ContentWorker');
  //Communicate to the contentScript:
  sendToContentScript({
    type: 'GetCurrentHTML',
    payload: {
      start,
      end,
    },
  });
});
