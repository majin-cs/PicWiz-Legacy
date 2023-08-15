const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/******************************************************************************/

/* HTML related */

export const FILE_UPLOAD_ID = '#photo';
export const CONTEXT_MENU_ITEM_ID = 'pic-wiz-menu-item';

/* Actions for messaging between senders / listeners */

export const ACTIONS = {
    GET_ALL_IMG_URLS: 1,
    OPEN_IMG_OPS: 2,
    UPLOAD_BASE_64: 3,
    INIT_SCREENSHOT: 4,
    TAKE_SCREENSHOT: 5,
    OPEN_SHORTCUTS: 6,
    DOWNLOAD_IMGS: 7,
    NOTIFY: 8,
    COPY_IMAGE: 9,
}

export const SCREENSHOT_FORMAT = "png";

/* URLs */

export const SHORTCUT_URL =  typeof browser !== 'undefined' ?  'https://support.mozilla.org/kb/manage-extension-shortcuts-firefox' : 'chrome://extensions/shortcuts';
export const IMG_OPS_URLs = {
    ROOT: "https://imgops.com/",
    UPLOAD: "https://imgops.com/upload",
}

/* i18n Constants */

export const i18n = {
    EXT_NAME: browserAPI.i18n.getMessage("extensionName"),
    MENU_ITEM_TITLE: browserAPI.i18n.getMessage("contextMenuTitle"),
    GO_TO_IMG_OPS: browserAPI.i18n.getMessage("goToImgOps"),
    FOUND_IMAGES: browserAPI.i18n.getMessage("foundImages"),
    CAPTURE: browserAPI.i18n.getMessage("capture"),
    COPY: browserAPI.i18n.getMessage("copy"),
    COPIED: browserAPI.i18n.getMessage("copied"),
    SAVE: browserAPI.i18n.getMessage("save"),
    CANCEL: browserAPI.i18n.getMessage("cancel"),
    EXIT: browserAPI.i18n.getMessage("exit"),
    KBD_EXIT: browserAPI.i18n.getMessage("kbdExit"),
    SCREENSHOT_INFO: browserAPI.i18n.getMessage("screenshotInfo"),
    CHANGE_SHORTCUTS: browserAPI.i18n.getMessage("changeShortcuts"),
    OPTIONS: browserAPI.i18n.getMessage("options"),
    LOAD_IMAGES_DISABLED: browserAPI.i18n.getMessage("loadImagesDisabled"),
    DOWNLOAD_IMGS: browserAPI.i18n.getMessage("downloadImgs"),
    SELECT_ALL: browserAPI.i18n.getMessage("selectAll"),
    RELOAD: browserAPI.i18n.getMessage("reload"),
}

export const ERRORS = {
    IMG_NOT_SUPPORTED: browserAPI.i18n.getMessage("errorimgNotSupported"),
    IMAGE_LOAD: browserAPI.i18n.getMessage("errorImageLoad"),
    UNEXPECTED: browserAPI.i18n.getMessage("errorUnexpected"),
    BLOB: browserAPI.i18n.getMessage("errorBlob"),
    FILES: browserAPI.i18n.getMessage("errorFiles"),
    NO_IMAGES: browserAPI.i18n.getMessage("noImages"),
    NOT_SUPPORTED: browserAPI.i18n.getMessage("notSupported"),
}

export const OPTIONS = {
    LOAD_IMAGES: 'loadImagesOnOpen',
    LOAD_IMAGES_DESC: browserAPI.i18n.getMessage("loadImagesOnOpen"),
}