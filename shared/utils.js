const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const BASE_64_REG = /^data:image\/([a-z]+);base64,/i;

/******************************************************************************/

/* Wait for _ milliseconds */
export function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

/* Check if URL ends with 'valid' image extensions
Does not account for images with no OR manipulated file extensions! */
export function isValidImgUrl(url) {
    const IMG_URL_REG = /^(https?:\/\/).+\.(jpg|jpeg|png|gif|bmp|svg|webp|ico|avif|apng|tif|tiff|jxl|heic|heif|ppm|pgm|pbm|pnm|raw|cr2|nef|orf|sr2)$/i;
    return IMG_URL_REG.test(url);
}

export function isBase64Image(url) {
    return BASE_64_REG.test(url);
}

export function generateNumUUID(digits = 8) {
    if (typeof digits != 'number' || digits <= 0) {
        console.error('generateNumUUID failed with digits = ' + digits);
        digits = 8;
    }
    const maxRandomPart = Math.pow(10, digits);
    const randomPart = Math.floor(Math.random() * maxRandomPart);
    const numericUUID = randomPart.toString();
    return numericUUID;
}

export function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, '_'); /* Replace non-alphanumeric characters with underscores */
}

export function imgExtFromDataUrl(dataURL) {
    const match = dataURL.match(BASE_64_REG);
    if (match) {
        return match[1];
    }
    return 'png'; /* Default to 'png' if extension cannot be determined */
}

/* Promise (-> await needed!) */
export function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = event => {
                resolve(event.target.result);
            };
            reader.onerror = error => {
                reject(error);
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error(err);
        }
    });
}

export function dataURLToBlob(dataURI) {
    if (!dataURI || typeof dataURI != 'string') return null;
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

/* browserAPI and callback needed, CAN ONLY BE RUN IN BACKGROUND / POPUP! */
export async function runInCurrenTab(callback) {
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        callback(activeTab);
    });
}

/******************************************************************************/

/* Global DOM funcs */

export function hide(element) {
    if (element) {
        element.style.visibility = 'hidden';
    }
}

export function show(element) {
    if (element) {
        element.style.visibility = 'visible';
    }
}

export function mouseCoords(mouseEvent) {
    if (!mouseEvent) return null;
    return {
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
        /* account for existing scroll
        x: mouseEvent.clientX + window.scrollX,
        y: mouseEvent.clientY + window.scrollY, 
        */
    }
}

/* Check if element is fully visible in viewport (window) */
export function elementIsVisible(element) {
    if (element) {
        var rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    return false;
}

export function removeElementWithChildren(element) {
    if (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
        element = null;
    }
}

/* For scripts that do not need to use the browser.downloads API */
/* Create fake element and add url as a 'file' */
export function downloadUrl(url, filename) {
    if (!url || !filename) return false;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
}
