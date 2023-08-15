const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

let utils;
let constants;
let capture;
let captureCSSInjected = false;

/******************************************************************************/

async function importScripts() {
    constants = await import(browserAPI.runtime.getURL("shared/constants.js"));
    utils = await import(browserAPI.runtime.getURL("shared/utils.js"));
    capture = await import(browserAPI.runtime.getURL("content/capture.js"));
}

function scriptingNotSupported() {
    /* browserAPI not usable in this state (for content scripts) */
    console.log(`PicWiz \n------\nPopup not supported by: \n${window.location.href}`);
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
    const inputElement = document.querySelector(constants.FILE_UPLOAD_ID);
    if (img && inputElement && inputElement.type === 'file') {
        injectBase64Img(inputElement, img);
    } else {
        sendResponse({ error: true, message: constants.ERRORS.UNEXPECTED });
    }
}

function getAllImagesAction(sendResponse) {
    try {
        /* Check if loading all images is enabled in options */
        browserAPI.storage.sync.get([constants.OPTIONS.LOAD_IMAGES], (res) => {
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

function initScrenshotAction() {
    /* Only inject css once per tab & only when screenshot action is sent */
    if (!captureCSSInjected) {
        browserAPI.runtime.sendMessage({ action: constants.ACTIONS.INJECT_CSS, path: "content/capture.css" }); /* Path relative from service_worker.js */
        captureCSSInjected = true;
    }
    capture.initCapture();
}

/******************************************************************************/

/* Register Listeners */

if (!browserAPI.runtime) {
    scriptingNotSupported();
} else {
    (async () => {
        browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case constants.ACTIONS.UPLOAD_BASE_64:
                    uploadBase64Action(sendResponse, request.img);
                    break;
                case constants.ACTIONS.GET_ALL_IMG_URLS:
                    getAllImagesAction(sendResponse);
                    /* Keep open -> async */
                    return true;
                case constants.ACTIONS.INIT_SCREENSHOT:
                    initScrenshotAction();
                    break;
            }
        });

        await importScripts();
    })();
}
