import { i18n, OPTIONS, ACTIONS } from "../shared/constants.js";

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/******************************************************************************/

/* TODO: If more options are added -> Create Factory for creating option elements */

const renderOptions = () => {
    const loadImagesDesc = document.getElementById('load-images-desc');
    loadImagesDesc.textContent = OPTIONS.LOAD_IMAGES_DESC;

    const loadImagesCheckbox = document.getElementById('load-images-checkbox');
    browserAPI.storage.sync.get([OPTIONS.LOAD_IMAGES], (result) => {
        loadImagesCheckbox.checked = result.loadImagesOnOpen || false;
    });

    loadImagesCheckbox.addEventListener('change', () => {
        browserAPI.storage.sync.set({ loadImagesOnOpen: loadImagesCheckbox.checked });
    });

    const shortcutBtn = document.getElementById('shortcut-btn');
    shortcutBtn.textContent = i18n.CHANGE_SHORTCUTS;
    shortcutBtn.onclick = () => {
        browserAPI.runtime.sendMessage({ action: ACTIONS.OPEN_SHORTCUTS });
    }
};

document.addEventListener('DOMContentLoaded', renderOptions);