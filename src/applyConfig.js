export function applyConfig(jsonObject, urlString) {
  console.log('Test');
  for (const key in jsonObject) {
    const regex = new RegExp(key);
    console.log('Attempting to try:', key);
    if (regex.test(urlString)) {
      console.log('Matched ', urlString, 'to pattern', regex);
      return {
        start: new Date(
          jsonObject[key].start
            .toString()
            .replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
        ),
        end: new Date(
          jsonObject[key].end
            .toString()
            .replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
        ),
      };
    }
  }
  return null; // No match found
}
