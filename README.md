<p align="center"><img width="196" height="196" src="https://i.imgur.com/zIXGZCg.png"></p>
<h1 align="center">PicWiz Legacy</h1>

> Capture screenshots, right-click on pictures, or get an an overview of all pics in the tab, to either (bulk) download or use them on [ImgOps.com](https://ImgOps.com).

This extension is not affiliated with ImgOps.com - it merely simplifies the way you can access the website.

<sub>For the Manifest V3 extension go here: [PicWiz](https://github.com/majin-cs/PicWiz)</sub>

---

## Installation

<a href="https://addons.mozilla.org/en-US/firefox/addon/picwiz-legacy/">
 <picture>
    <source srcset="https://i.imgur.com/ZluoP7T.png" media="(prefers-color-scheme: dark)">
    <img height="50" src="https://i.imgur.com/4PobQqE.png" alt="Firefox add-ons">
 </picture>
</a>

#### Or from GitHub:

1. Download the zip from the [release section](https://github.com/majin-cs/PicWiz-Legacy/releases) 
- Either use the zip in **Firefox** by visting [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox) and loading it as temporary add-on 
- Or unpack it and use it indefinitely in **Chrome** by visting [chrome://extensions/](chrome://extensions/), clicking on "Load unpacked" in the top left corner and selecting the unzipped extension folder

## Features

1. Easily access ImgOps.com by opening the context menu on any picture in the browser
   - If it is of type data:url (Base64) upload it automatically to ImgOps.com
2. Provides an overview of all pictures found in the active tab in the extension popup where you then can:
   - Open them individually on ImgOps.com
   - Select pictures or simply press the _Select all_ checkbox to (bulk) download all selected pictures
3. Take a screenshot (shortcut defaults to `Ctrl + Shift + S`) and pick one of the options:
   - Copy to the clipboard
   - Save
   - Open on ImgOps.com

## Options

| Name             | Toggles                                                 |
| ---------------- | ------------------------------------------------------- |
| loadImagesOnOpen | Scrape pictures and display them when opening the popup |
| notifications    | Notifications                                           |

## Shortcuts

| Name             | Default Keys       |
| ---------------- | ------------------ |
| Screenshot       | `Ctrl + Shift + S` |

## Permissions

| Name             | Required for                                                             | 
| ---------------- | ------------------------------------------------------------------------ |
| "<all_urls>"     | Having the screenshot feature work on every website (importing scripts)  |
| "contextMenus",  | Displaying the ImgOps menu option when right-clicking a picture          |
| "activeTab"      | Scraping images and taking the screenshot                                |
| "clipboardWrite" | Copying screenhots to the clipboard                                      |
| "notifications"  | Notifying when picture was copied                                        |
| "storage"        | Saving options                                                           |
| "downloads"      | Downloading selected pictures                                            |

## Showcase

| Right-click a picture  | Perform various image operations such as _Reverse Image Search_ on ImgOps.com |
| ---------------------- | ----------------------------------------------------------------------------- |
| ![Context Menu Item](https://i.imgur.com/CECo9n7.png) | ![ImgOps Website Options](https://i.imgur.com/LBWH7qV.png) |

| Select pictures to download or take a screenshot      |
| -------------------------------------------------------- |
| ![Extension Popup Showcase](https://i.imgur.com/q2gl71U.gif) |

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
