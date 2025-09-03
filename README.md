# <img src="public/icons/icon_48.png" width="45" align="left">  Wayback Extension
[![The Recurse Center](https://img.shields.io/badge/created%20at-recurse%20center-white)](https://www.recurse.com/)

## Usage
The Wayback Extension searches the Internet Archive Wayback Machine for snapshots of your current page, then displays the content via "diff-like" highlighting. It is primarily designed for text changes.

## Contributors
Thank you to [Florian Ragwitz](https://github.com/rafl) for helping me out with this!

## Options
Within the options folder you can change the following:
- Default Highlighting Colors
- Default Date Ranges For Different urls.
  - By default no configuration will be applied. Configurations must follow the following format:
  ```json5 
  {
    "https://www.cdc.gov/.*":  //Regex expression of URL to match
    {
      "start": 20250101, //Jan 1st 2025 default start (YYYYmmDD)
      "end": 20250801 //August 1st 2025 default end (YYYYmmDD)
    },
    "https://www.google.com/.*":  //Regex expression of URL to match
    {
      "start": 19950101, //Jan 1st 1995 default start (YYYYmmDD)
      "end": 20230801 //August 1st 2023 default end (YYYYmmDD)
    }
  }
  ```
  - If multiple expressions match a URL, there is **no set rule** which will determine which one to apply.
  
## Importing Into Chrome
`npm run build` should create a build folder.
Go to extensions. Click on "Load Unpacked" and then select the build folder.

## Development
- This project was bootstrapped with [Chrome Extension CLI](https://github.com/dutiyesh/chrome-extension-cli)
- Run `npm install` to get all the necessary packages
- Run `npm run watch` to setup webpack
- Run `web-ext run --target=chromium --source-dir ./build` to open up a Chrome Session that will auto-refresh the extension for you

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
