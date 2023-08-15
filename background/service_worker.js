import { isValidImgUrl, isBase64Image, generateNumUUID, runInCurrenTab, delay } from "../shared/utils.js";
import { IMG_OPS_URLs, ACTIONS, CONTEXT_MENU_ITEM_ID, i18n, ERRORS, SHORTCUT_URL } from "../shared/constants.js";

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/******************************************************************************/

async function injectCSSFile(tab, cssPath) {
  try {
    /* Firefox needs relative path */
    const path = typeof browser !== 'undefined' ? '../' + cssPath : cssPath;
    browserAPI.tabs.insertCSS(tab.id, { file: path, });
  } catch (error) {
    console.error('Error inserting CSS:', error);
  }
}

function createImgTab(imgUrl) {
  browserAPI.tabs.create({
    url: `${IMG_OPS_URLs.ROOT}${imgUrl}`
  });
}

function createImgUploadTab(imgUrl) {
  browserAPI.tabs.create({
    url: IMG_OPS_URLs.UPLOAD,
  }, (createdTab) => {
    if (createdTab.active) {
      sendUploadAction(createdTab, imgUrl)
    }
  });
}

/* Forwards upload action to content script */
async function sendUploadAction(tab, imgUrl) {
  const uploadTabListener = async (tabId, info) => {
    if (info.status === 'complete' && tabId === tab.id) {
      const res = await browserAPI.tabs.sendMessage(tab.id, { action: ACTIONS.UPLOAD_BASE_64, img: imgUrl });
      if (res && res.error) {
        console.error(response.message);
      }
      browserAPI.tabs.onUpdated.removeListener(uploadTabListener);
    }
  };
  browserAPI.tabs.onUpdated.addListener(uploadTabListener);
}

function openImgOps(imgUrl) {
  if (isValidImgUrl(imgUrl)) {
    createImgTab(imgUrl);
  } else if (isBase64Image(imgUrl)) {
    createImgUploadTab(imgUrl);
  } else {
    /* Try to open anyway, as there are cases where the image has no extension 
    + the user will see the error from the site itself */
    createImgTab(imgUrl);
  }
}

function takeScreenshot() {
  return new Promise((resolve, reject) => {
    try {
      browserAPI.tabs.captureVisibleTab(null, { format: "png" }, dataUri => {
        if (browserAPI.runtime.lastError) {
          reject(browserAPI.runtime.lastError);
        } else {
          resolve(dataUri);
        }
      });
    } catch {
      reject(ERRORS.UNEXPECTED);
    }
  });
}

/* Firefox only */
function copyImage(arrayBuffer) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!arrayBuffer) {
        resolve(false);
      }
      browserAPI.clipboard.setImageData(arrayBuffer, "png");
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
}

function sendNotification(message, title = i18n.EXT_NAME, name, type = "basic", callback) {
  browserAPI.notifications.create(
    name ?? `${i18n.EXT_NAME}-${generateNumUUID(5)}`,
    {
      type: type,
      iconUrl: "/icons/196.png",
      title: title,
      message: message,
    },
    async (notificationId) => {
      await delay(6000);
      browserAPI.notifications.clear(notificationId);
    }
  );
}

async function downloadSequentially(urls) {
  for (const url of urls) {
    if (!url) continue;
    const currentId = await new Promise(resolve => browserAPI.downloads.download({ url }, resolve));
    const noError = await onDownloadComplete(currentId);
    if (!noError) {
      /* If 1 download is cancelled, cancel remaining ones too */
      break;
    }
  }
}

function onDownloadComplete(itemId) {
  return new Promise(resolve => {
    browserAPI.downloads.onChanged.addListener(function onChanged({ id, state, error }) {
      if (id === itemId && state && state.current !== 'in_progress') {
        chrome.downloads.onChanged.removeListener(onChanged);
        resolve(state.current === 'complete');
      }
    });
  });
}

/******************************************************************************/

/* Create Context Menu Item */

browserAPI.contextMenus.create({
  id: CONTEXT_MENU_ITEM_ID,
  title: i18n.MENU_ITEM_TITLE,
  contexts: ["image"],
}, () => {
  if (browserAPI.runtime.lastError) {
    /* Ignore duplicate context menu item creation */
  }
});


/******************************************************************************/

/* Register Listeners */

/* Main message listener */
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case ACTIONS.OPEN_IMG_OPS:
      openImgOps(request.imgUrl);
      break;
    case ACTIONS.TAKE_SCREENSHOT:
      /* Take screenshot and send back dataURI */
      takeScreenshot().then(screenshot => {
        if (screenshot) {
          sendResponse(screenshot);
        } else {
          sendResponse({ error: true, message: ERRORS.UNEXPECTED });
        }
      });
      /* Keep open because of async */
      return true;
    case ACTIONS.NOTIFY:
      sendNotification(request.message, request.title, request.name, request.type, request.callback);
      break;
    case ACTIONS.INJECT_CSS:
      runInCurrenTab((tab) => {
        injectCSSFile(tab, request.path);
      });
      break;
    case ACTIONS.OPEN_SHORTCUTS:
      browserAPI.tabs.create({ url: SHORTCUT_URL });
      break;
    case ACTIONS.DOWNLOAD_IMGS:
      downloadSequentially(request.imgUrls);
      break;
    case ACTIONS.COPY_IMAGE:
      /* Firefox only! */
      copyImage(request.arrayBuffer).then(success => {
        if (success) {
          sendResponse({ error: false });
        } else {
          sendResponse({ error: true, message: ERRORS.UNEXPECTED });
        }
      });
      /* Keep open because of async */
      return true;
  }
});

/* Add context menu item */
browserAPI.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ITEM_ID) {
    openImgOps(info.srcUrl);
  }
});

/* Send to content script */
browserAPI.commands.onCommand.addListener((command) => {
  /* Commands defined in manifest.json */
  if (command === 'take-screenshot') {
    runInCurrenTab((tab) => {
      browserAPI.tabs.sendMessage(tab.id, { action: ACTIONS.INIT_SCREENSHOT }, res => {
        if (browserAPI.runtime.lastError) {
          /* Ignore, since content script might not be loaded yet */
        }
      });
    })
  }
});

/* Default settings */
browserAPI.runtime.onInstalled.addListener(() => {
  browserAPI.storage.sync.set({ loadImagesOnOpen: true });
});
