const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

let utils;
let constants;
let capture;
let imported;

function importScripts() {
    return new Promise(async (resolve, reject) => {
        try {
            if (imported) {
                resolve(true);
            } else {
                const constantsPath = browserAPI.runtime.getURL("shared/constants.js");
                const utilsPath = browserAPI.runtime.getURL("shared/utils.js");
                const capturePath = browserAPI.runtime.getURL("content/capture.js");
                constants = await import(constantsPath);
                utils = await import(utilsPath);
                capture = await import(capturePath);
                imported = true;
                resolve(true);
            }
        } catch (error) {
            resolve(false);
        }
    });
}

function scriptingNotSupported() {
    // browserAPI not usable in this state (for content scripts)
    console.log(`PicWiz \n------\nPopup not supported by: \n${window.location.href}`);
}

function cssIsInjected(searchableVarName) {
    const computedStyles = getComputedStyle(document.body);
    return computedStyles.getPropertyValue(searchableVarName);
}

async function dataURLToBlob(dataURL) {
    try {
        const res = await fetch(dataURL);
        const blob = await res.blob();
        return blob;
    } catch (err) {
        console.error(err)
        return false;
    }
}

async function injectBase64Img(inputElement, imgUrl) {
    const blob = await dataURLToBlob(imgUrl);
    if (blob) {
        const imgExt = utils.imgExtFromDataUrl(imgUrl);
        const imgMimeType = `image/${imgExt}`;
        try {
            const filename = imgUrl.split('/').pop(); /* Should already include extension */
            const file = new File([blob], `${filename}`, { type: imgMimeType });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            inputElement.files = dataTransfer.files;
            inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        } catch {
            console.error(constants.ERRORS.FILES);
        }
    }
}

/* Grab all <img> el in the tab and map their src */
function scrapeImages() {
    const imgElements = Array.from(document.querySelectorAll('img'));
    const imgUrls = imgElements
        .filter(img => img.src)
        .map(img => img.src);
    return [...new Set(imgUrls)]; /* Eliminate duplicate imgUrls */
}

/******************************************************************************/

/* ACTIONS */

function uploadBase64Action(sendResponse, img) {
    uploading = true;
    const inputElement = document.querySelector(constants.FILE_UPLOAD_ID);
    if (img && inputElement && inputElement.type === 'file') {
        injectBase64Img(inputElement, img);
        sendResponse({ error: false });
    } else {
        sendResponse({ error: true, messsage: constants.ERRORS.UNEXPECTED });
    }
}

function getAllImagesAction(sendResponse) {
    try {
        /* Check if loading all images is enabled in options */
        browserAPI.storage.sync.get('loadImagesOnOpen', (res) => {
            if (res.loadImagesOnOpen === true) {
                const imgUrls = scrapeImages();
                sendResponse({ imgUrls });
            } else {
                sendResponse({ error: false });
            }
        });
    } catch (error) {
        sendResponse({ error: true, message: constants.ERRORS.IMAGE_LOAD });
    }
}

function initScrenshotAction(sendResponse) {
    /* Only inject css once per tab & only when screenshot action is sent */
    if (!cssIsInjected('--pic-wiz-css-injected')) {
        browserAPI.runtime.sendMessage({ action: constants.ACTIONS.INJECT_CSS, path: 'content/capture.css' });
    }
    capture.initCapture();
    sendResponse({ error: false });
}

/******************************************************************************/

/* Register Listeners */

if (!browserAPI.runtime) {
    scriptingNotSupported();
} else {
    browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
        importScripts().then(success => {
            if (success) {
                switch (request.action) {
                    case constants.ACTIONS.GET_ALL_IMG_URLS:
                        getAllImagesAction(sendResponse);
                        return true;
                    case constants.ACTIONS.UPLOAD_BASE_64:
                        uploadBase64Action(sendResponse, request.img);
                        break;
                    case constants.ACTIONS.INIT_SCREENSHOT:
                        initScrenshotAction(sendResponse);
                        break;
                }
            } else {
                scriptingNotSupported();
            }
        });
        /* Keep open */
        return true;
    });
}