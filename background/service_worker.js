const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// ImgOps URLs
const IMG_OPS_URL = "https://imgops.com/";
const IMG_OPS_UPLOAD_URL = "https://imgops.com/upload";

const CONTEXT_MENU_ITEM_ID = 'pic-wiz-menu-item';
const CONTEXT_MENU_ITEM_TITLE = browserAPI.i18n.getMessage("contextMenuTitle");
const IMG_NOT_SUPPORTED = browserAPI.i18n.getMessage("errorimgNotSupported");

const actions = {
  uploadBase64: 1,
  getAllImgUrls: 2,
  openImgOps: 3,
}

// Check if URL ends with "valid" image extensions
// Does not account for images with no OR manipulated file extensions!
function isValidImgUrl(url) {
  const IMG_URL_REG = /^(https?:\/\/).+\.(jpg|jpeg|png|gif|bmp|svg|webp|ico|avif|apng|tif|tiff|jxl|heic|heif|ppm|pgm|pbm|pnm|raw|cr2|nef|orf|sr2)$/i;
  return IMG_URL_REG.test(url);
}

function isBase64Image(url) {
  const BASE_64_REG = /^data:image\/([a-z]+);base64,/i;
  return BASE_64_REG.test(url);
}

function createImgTab(imgUrl) {
  browserAPI.tabs.create({
    url: `${IMG_OPS_URL}${imgUrl}`
  });
}

function createImgUploadTab(imgUrl) {
  browserAPI.tabs.create({
    url: IMG_OPS_UPLOAD_URL,
  }, (createdTab) => {
    if (createdTab.active) {
      sendUploadAction(createdTab, imgUrl)
    }
  });
}

// Function to send upload action to content script
async function sendUploadAction(tab, imgUrl) {
  const uploadTabListener = async (tabId, info) => {
    if (info.status === 'complete' && tabId === tab.id) {
      const res = await browserAPI.tabs.sendMessage(tab.id, { action: actions.uploadBase64, img: imgUrl });
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
    console.error(IMG_NOT_SUPPORTED);
    // Try to open anyway, as there are cases where the image has no extension 
    // + the user will see the error from the site itself
    createImgTab(imgUrl);
  }
}

/* Create Context Menu Item */
browserAPI.contextMenus.create({
  id: CONTEXT_MENU_ITEM_ID,
  title: CONTEXT_MENU_ITEM_TITLE,
  contexts: ["image"],
});

/* Register Listeners */
browserAPI.contextMenus.onClicked.addListener(
  async (info, tab) => {
    if (info.menuItemId === CONTEXT_MENU_ITEM_ID) {
      openImgOps(info.srcUrl);
    }
  }
);

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === actions.openImgOps) {
    openImgOps(message.imgUrl);
  }
});
