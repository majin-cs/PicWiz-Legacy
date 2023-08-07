const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Error messages
const IMAGE_LOAD_ERR = browserAPI.i18n.getMessage("errorImageLoad");
const IMG_NOT_SUPPORTED = browserAPI.i18n.getMessage("errorimgNotSupported");
const UNEXPECTED_ERROR = browserAPI.i18n.getMessage("errorUnexpected");
const COULD_NOT_CREATE_BLOB = browserAPI.i18n.getMessage("errorBlob");
const FILE_ERR = browserAPI.i18n.getMessage("errorFiles");

// Other constants
const IMG_OPS_URL = "https://imgops.com/";
const FILE_UPLOAD_ID = '#photo';
const actions = {
    uploadBase64: 1,
    getAllImgUrls: 2,
}

// Check if URL ends with "valid" image extensions
// Does not account for images with no OR manipulated file extensions!
function isValidImgUrl(url) {
    const IMG_URL_REG = /^(https?:\/\/).+\.(jpg|jpeg|png|gif|bmp|svg|webp|ico|avif|apng|tif|tiff|jxl|heic|heif|ppm|pgm|pbm|pnm|raw|cr2|nef|orf|sr2)$/i;
    return IMG_URL_REG.test(url);
}

async function dataURLToBlob(dataURL) {
    try {
        const res = await fetch(dataURL);
        const blob = await res.blob();
        return blob;
    } catch {
        console.error(COULD_NOT_CREATE_BLOB);
        return false;
    }
}

function imgExtFromDataUrl(dataURL) {
    const BASE_64_REG = /^data:image\/([a-z]+);base64,/i;
    const match = dataURL.match(BASE_64_REG);
    if (match) {
        return match[1];
    }
    return 'png'; // Default to 'png' if extension cannot be determined
}

async function injectBase64Img(inputElement, base64Img) {
    const blob = await dataURLToBlob(base64Img);
    if (blob) {
        const imgExt = imgExtFromDataUrl(base64Img);
        const imgMime = `image/${imgExt}`;
        try {
            const file = new File([blob], `image.${imgExt}`, { type: imgMime });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            inputElement.files = dataTransfer.files;
            inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        } catch {
            console.error(FILE_ERR);
        }
    }
}

function sendErrorMessage(sendResponse, errorMessage) {
    console.error(errorMessage);
    sendResponse({ error: true, message: errorMessage });
}

/* Register Listeners */
browserAPI.runtime.onMessage.addListener(async ({ action, img }, sender, sendResponse) => {
    if (action === actions.uploadBase64 && img) {
        const inputElement = document.querySelector(FILE_UPLOAD_ID);
        if (inputElement && inputElement.type === 'file') {
            injectBase64Img(inputElement, img);
        } else {
            sendErrorMessage(sendResponse, UNEXPECTED_ERROR);
        }
    }
});
browserAPI.runtime.onMessage.addListener(({ action }, sender, sendResponse) => {
    if (action === actions.getAllImgUrls) {
        const sendImgUrls = () => {
            try {
                const imgElements = Array.from(document.querySelectorAll('img'));
                const imgUrls = imgElements
                    .filter(img => img.src && isValidImgUrl(img.src))
                    .map(img => ({
                        url: img.src,
                        imgOpsLink: `${IMG_OPS_URL}${img.src}`,
                    }));
                sendResponse({ imgUrls });
            } catch (error) {
                sendErrorMessage(sendResponse, IMAGE_LOAD_ERR);
            }
        };
        new Promise(resolve => {
            resolve(sendImgUrls());
        });
    }
});