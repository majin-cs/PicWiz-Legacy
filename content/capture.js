const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/* CSS related constants */

/* High z-Index too not underlap on any elements - max value (2147483647) could introduce issues on some browsers */
const bgZidx = 9999995;
const selectAreaZidx = 9999996;
const overlayZidx = 9999998;
const maxZIdx = 9999999;

const bgOpacity = 0.8;
const selectAreaMinDim = 1; /* Selected area must be 1x1 pixels */
const selectAreaOutline = `1px solid white`;
const selectAreaShadow = `0 0 0 99999px rgba(0,0,0,${bgOpacity})`;
const selectBg = `rgba(0, 0, 0, ${bgOpacity})`;

const bgClass = 'pic-wiz-bg'
const overlayClass = 'pic-wiz-overlay'
const optionsClass = 'pic-wiz-select-options';
const optionBtnClass = 'pic-wiz-btn pic-wiz-option-btn';
const cancelOptionBtnClass = 'pic-wiz-cancel-option-btn pic-wiz-btn';
const infoBtnClass = 'pic-wiz-btn pic-wiz-info-btn';
const infoClass = 'pic-wiz-capture-info';
const infoTitleClass = 'pic-wiz-title';
const kdbTitleClass = 'pic-wiz-title'
const kbdSectionClass = 'pic-wiz-kbd-section'
const kbdClass = 'pic-wiz-kbd';

/* Main variables */

let selectStarted = false;
let selecting = false;
let stopSelect = false;
let startX, startY;

let bg;
let overlay;
let selectArea;
let captureInfo;
let selectOptions;

const quitKeys = ['Escape', 'Delete', 'Q', 'q', 'F4', 'Pause'];

/******************************************************************************/

/* DOM related */

function renderCaptureInfo() {
    captureInfo = document.createElement('div');
    captureInfo.className = infoClass;
    captureInfo.style.zIndex = `${maxZIdx}`;

    const captureInfoTitle = document.createElement('div');
    captureInfoTitle.className = infoTitleClass;
    captureInfoTitle.textContent = constants.i18n.SCREENSHOT_INFO;

    const exitBtn = document.createElement('button');
    exitBtn.className = infoBtnClass;
    exitBtn.textContent = constants.i18n.EXIT;
    exitBtn.style.color = '#ff4747';
    exitBtn.addEventListener('click', quitCapture);

    const kbdTitle = document.createElement('div');
    kbdTitle.className = kdbTitleClass;
    kbdTitle.textContent = constants.i18n.KBD_EXIT;

    const kbdSection = document.createElement('div');
    kbdSection.className = kbdSectionClass;

    quitKeys.forEach(str => {
        const kbdElement = document.createElement('button');
        kbdElement.textContent = str;
        kbdElement.className = kbdClass;
        kbdElement.addEventListener('click', quitCapture);
        kbdSection.appendChild(kbdElement);
    });

    captureInfo.appendChild(captureInfoTitle);
    captureInfo.appendChild(exitBtn);
    captureInfo.appendChild(kbdTitle);
    captureInfo.appendChild(kbdSection);
    document.body.appendChild(captureInfo);

    exitBtn.focus({ preventScroll: true });
}

function renderOverlay() {
    overlay = document.createElement('div');
    overlay.className = overlayClass;
    overlay.style.zIndex = `${overlayZidx}`;

    bg = document.createElement('div');
    bg.className = bgClass;
    bg.style.background = selectBg;
    bg.style.zIndex = `${bgZidx}`;

    document.body.appendChild(bg);
    document.body.appendChild(overlay);
}

function renderSelectArea() {
    selectArea = document.createElement('div');
    selectArea.style.position = 'fixed';
    selectArea.style.left = `${startX}px`;
    selectArea.style.top = `${startY}px`;
    selectArea.style.outline = `${selectAreaOutline}`;
    selectArea.style.boxShadow = `${selectAreaShadow}`;
    selectArea.style.zIndex = `${selectAreaZidx}`;
    selectArea.style.pointerEvents = 'none';
    document.body.appendChild(selectArea);

    utils.hide(bg);
    utils.hide(captureInfo);
}

function renderSelectOptions(coords) {
    if (!selectArea) return;

    selectOptions = document.createElement('div');
    selectOptions.className = optionsClass;
    selectOptions.style.zIndex = `${maxZIdx}`;

    const imgOpsBtn = document.createElement('button');
    imgOpsBtn.className = optionBtnClass;
    imgOpsBtn.style.color = '#2997ff';
    imgOpsBtn.textContent = constants.i18n.GO_TO_IMG_OPS;
    imgOpsBtn.addEventListener('click', openImgOps);

    const copyBtn = document.createElement('button');
    copyBtn.className = optionBtnClass;
    copyBtn.textContent = constants.i18n.COPY;
    copyBtn.addEventListener('click', copySelectArea);

    const saveBtn = document.createElement('button');
    saveBtn.className = optionBtnClass;
    saveBtn.textContent = constants.i18n.SAVE;
    saveBtn.addEventListener('click', saveSelectArea);

    const cancelBtn = document.createElement('button');
    cancelBtn.className = cancelOptionBtnClass;
    cancelBtn.textContent = constants.i18n.CANCEL;
    cancelBtn.addEventListener('click', quitCapture);


    selectOptions.appendChild(cancelBtn);
    selectOptions.appendChild(copyBtn);
    selectOptions.appendChild(saveBtn);
    selectOptions.appendChild(imgOpsBtn);
    document.body.appendChild(selectOptions);

    /* Calculate select options positon */

    const { width, height } = selectOptions.getBoundingClientRect();

    let top = coords.y;
    let left = coords.x;

    /* Check if there is enough space below to position the options outside */
    if (top + height >= window.innerHeight) {
        top -= height;
    }
    if (left + width >= window.innerWidth) {
        left -= width;
    }
    selectOptions.style.top = `${top}px`;
    selectOptions.style.left = `${left}px`;

    /* Display options underneath eachother when display/window is small */
    if (!utils.elementIsVisible(selectOptions)) {
        selectOptions.style.display = 'block'
        selectOptions.style.transform = `translateX(-50%)`;
        selectOptions.style.left = `50%`;
        selectOptions.style.top = `${top}px`;
    }
}

/******************************************************************************/

/* Mouse / Keyboard Handlers */

function handleMouseDown(event) {
    /* Right Click */
    if (event.button === 0) {
        if (!stopSelect && !selecting) {
            selecting = true;

            if (selectArea) {
                utils.removeElementWithChildren(selectArea);
                utils.removeElementWithChildren(selectOptions);
            }

            let mouse = utils.mouseCoords(event);
            startX = mouse.x;
            startY = mouse.y;
            renderSelectArea();

            event.preventDefault();
        }
    }
}

/* Update the select area dimensions as the user drags */
function handleMouseMove(event) {
    if (selecting && !stopSelect) {
        let mouse = utils.mouseCoords(event);
        const width = mouse.x - startX;
        const height = mouse.y - startY;

        selectArea.style.width = Math.abs(width) + 'px';
        selectArea.style.height = Math.abs(height) + 'px';
        selectArea.style.left = (width > 0 ? startX : mouse.x) + 'px';
        selectArea.style.top = (height > 0 ? startY : mouse.y) + 'px';
    }
}

function handleMouseUp(event) {
    if (selecting && !stopSelect) {
        selecting = false;
        let coords = utils.mouseCoords(event);

        if (selectArea.offsetWidth > selectAreaMinDim && selectArea.offsetHeight > selectAreaMinDim) {
            renderSelectOptions(coords);
            utils.show(selectArea);
            utils.hide(bg);
        } else {
            utils.show(captureInfo);
            utils.hide(selectArea);
            utils.show(bg);
        }
    }
}

function handleKeyDown(event) {
    if (quitKeys.includes(event.key)) {
        quitCapture();
    }
}

/* Either activates or removes all relevant listeners for capture.js */
function toggleEventListeners(activate) {
    const action = activate ? 'addEventListener' : 'removeEventListener';
    overlay[action]('mousedown', handleMouseDown);
    overlay[action]('mousemove', handleMouseMove);
    overlay[action]('mouseup', handleMouseUp);
    document[action]('keydown', handleKeyDown);
}

/******************************************************************************/

/* Screenshot Actions / Options */

async function sendScreenshotAction() {
    return new Promise((resolve, reject) => {
        browserAPI.runtime.sendMessage({ action: constants.ACTIONS.TAKE_SCREENSHOT }, async (response) => {
            if (browserAPI.runtime.lastError) {
                reject(browserAPI.runtime.lastError);
            } else {
                if (response.error) {
                    reject(response.message);
                }
                /* Cut down screenshot to fit select area */
                const { x, y, width, height } = selectArea.getBoundingClientRect();
                const screenshot = new Image;
                screenshot.src = response;

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext('2d');

                const selectedAreaDataUrl = await new Promise((resolve) => {
                    screenshot.onload = async () => {
                        context.drawImage(screenshot, x, y, width, height, 0, 0, width, height);
                        const dataURL = canvas.toDataURL('image/png');
                        resolve(dataURL);
                    };
                });
                resolve(selectedAreaDataUrl);
            }
        });
    });
}

async function sendCopyAction(blobBuffer) {
    return new Promise((resolve, reject) => {
        browserAPI.runtime.sendMessage({ action: constants.ACTIONS.COPY_IMAGE, arrayBuffer: blobBuffer }, async (response) => {
            if (browserAPI.runtime.lastError) {
                reject(browserAPI.runtime.lastError);
            } else {
                resolve(response.error);
            }
        });
    });
}


/* Automatically hides elements that shouldn't 
appear on the screenshot and stops regular selection */
async function runScreenshotOption(func) {
    utils.hide(selectOptions);
    stopSelect = true;
    await utils.delay(200); /* Wait until options are fully hidden */
    const screenshotURL = await sendScreenshotAction();
    let successful;
    if (screenshotURL) {
        successful = await func(screenshotURL);
    } else {
        browserAPI.runtime.sendMessage({ action: constants.ACTIONS.NOTIFY, message: constants.ERRORS.UNEXPECTED });
    }
    if (successful) {
        quitCapture();
    } else {
        utils.show(selectOptions);
    }
    stopSelect = false;
}

async function openImgOps() {
    runScreenshotOption(async (screenshotURL) => {
        browserAPI.runtime.sendMessage({ action: constants.ACTIONS.OPEN_IMG_OPS, imgUrl: screenshotURL });
        return true;
    });
}

async function copySelectArea() {
    runScreenshotOption(async (screenshotURL) => {
        try {
            let screenshotBlob = utils.dataURLToBlob(screenshotURL);

            if ('ClipboardItem' in window) {
                /* Chrome only */
                await navigator.clipboard.write([new ClipboardItem({ [screenshotBlob.type]: screenshotBlob })]);
            } else {
                /* Firefox */
                const blobBuffer = await screenshotBlob.arrayBuffer();
                const success = await sendCopyAction(blobBuffer);
                if (success) {
                    throw new Error(constants.ERRORS.UNEXPECTED);
                }
            }
            browserAPI.runtime.sendMessage({ action: constants.ACTIONS.NOTIFY, message: constants.i18n.COPIED });
            return true;
        } catch (err) {
            console.error(err);
            browserAPI.runtime.sendMessage({ action: constants.ACTIONS.NOTIFY, message: constants.ERRORS.UNEXPECTED });
            return false;
        }
    });
}

async function saveSelectArea() {
    runScreenshotOption(async (screenshotURL) => {
        utils.downloadUrl(screenshotURL, `${utils.generateNumUUID(13)}.png`)
        return true;
    });
}

/******************************************************************************/

function quitCapture() {
    selecting = false;
    selectStarted = false;
    toggleEventListeners(false);
    const elementsToDestroy = [bg, overlay, selectArea, captureInfo, selectOptions];
    elementsToDestroy.forEach(el => {
        utils.removeElementWithChildren(el);
    });
}

export function initCapture() {
    if (selectStarted) {
        quitCapture(); /* Quit first if already started, to not initiate everything on top */
    }
    renderCaptureInfo();
    renderOverlay();
    toggleEventListeners(true);
    selectStarted = true;
}