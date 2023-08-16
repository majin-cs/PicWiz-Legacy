import { i18n, OPTIONS, ACTIONS } from '../shared/constants.js';

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/******************************************************************************/

const renderOptions = () => {

    /* Build all toggleable options */

    const body = document.body;
    const fragment = document.createDocumentFragment();
    OPTIONS.TOGGLEABLE.forEach(option => {
        const optionLabel = document.createElement('label');
        optionLabel.className = 'option';

        const optionCheck = document.createElement('input');
        optionCheck.type = 'checkbox';
        optionCheck.id = `${option.name}-checkbox`;

        browserAPI.storage.sync.get([option.name], (result) => {
            optionCheck.checked = result[option.name] || false;
        });

        optionCheck.onchange = () => {
            browserAPI.storage.sync.set({ [option.name]: optionCheck.checked });
        };

        const optionText = document.createElement('span');
        optionText.type = 'checkbox';
        optionText.id = `${option.name}-desc`;
        optionText.textContent = option.description;

        optionLabel.appendChild(optionCheck);
        optionLabel.appendChild(optionText);
        fragment.appendChild(optionLabel);
    });
    body.appendChild(fragment);

    /* Other option items */

    const shortcutBtn = document.getElementById('shortcut-btn');
    shortcutBtn.textContent = i18n.CHANGE_SHORTCUTS;
    shortcutBtn.onclick = () => {
        browserAPI.runtime.sendMessage({ action: ACTIONS.OPEN_SHORTCUTS });
    }
};

document.addEventListener('DOMContentLoaded', renderOptions);