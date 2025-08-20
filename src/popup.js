function sendToContentScript(json) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, json, (response) => {});
  });
}

let startDate = document.getElementById('start');
let endDate = document.getElementById('end');
let searchButton = document.getElementById('search');
let urlHeader = document.getElementById('url');

console.log('Popup script running.');

console.log(new Date().toISOString().split('T')[0]);
endDate.value = new Date().toISOString().split('T')[0];
urlHeader.value = document.URL;

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
