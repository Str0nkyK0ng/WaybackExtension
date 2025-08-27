//JSON EDITOR
let useCustomConfigCheckbox = document.getElementById('useCustomConfig');
let configError = document.getElementById('configErrors');
let textArea = document.getElementById('configJSON');

useCustomConfigCheckbox.addEventListener('click', () => {
  if (useCustomConfigCheckbox.checked) {
    showTextArea();
  } else {
    textArea.style.display = 'none';
    configError.textContent = '';
  }
});

export function showTextArea() {
  textArea.style.display = '';
  textArea.style.backgroundColor = '';
}

textArea.addEventListener('blur', () => {
  const isValid = isValidConfigJson(textArea.value);

  if (isValid) {
    const parsed = JSON.parse(textArea.value);
    textArea.value = JSON.stringify(parsed, null, 2);
    textArea.style.backgroundColor = '';
  } else {
    textArea.style.backgroundColor = 'rgba(255, 0, 0, 0.49)';
  }
});

export function isValidConfigJson(jsonText) {
  try {
    console.log('Testing JSON Config');
    let jsonObject = JSON.parse(jsonText);
    for (const [key, value] of Object.entries(jsonObject)) {
      let start = value.start;
      let end = value.end;
      if (!start) {
        console.log(key);
        throw Error('Missing start date in entry:' + key);
      } else if (!end) {
        throw Error('Missing end date in entry:' + key);
      }

      //check if the dates are valid
      console.log('Should test dates');
      let isStartValid = isValidDate(start);
      let isEndValid = isValidDate(end);

      if (!isStartValid || !isEndValid) {
        throw Error('One (or more) dates are invalid in entry:' + key);
      }
      if (isStartValid > isEndValid) {
        throw Error('End date is before start dates in entry:' + key);
      }
    }
    configError.textContent = '';
    return jsonObject;
  } catch (e) {
    configError.textContent = e;
    return false;
  }
}

function isValidDate(dateNum) {
  dateNum = dateNum + '';
  console.log('Testing', dateNum);
  //it should be at minimum YYYYmmDD (8 digits) and it should not be greater than today
  let length = (dateNum + '').length;
  if (length != 8) {
    return false;
  }
  //otherwise try to parse the date
  let date = Date.parse(
    dateNum.slice(0, 4) + '-' + dateNum.slice(4, 6) + '-' + dateNum.slice(6, 8)
  );
  if (date > new Date()) {
    return false;
  }
  return date;
}

export function setAndFormatJSON(jsonObject) {
  console.log('Config Json obj:' + JSON.stringify(jsonObject));
  textArea.value = JSON.stringify(jsonObject, null, 2);
  textArea.style.backgroundColor = '';
}
