import { ACTIONS, ERRORS, i18n } from '../shared/constants.js';
import { runInCurrenTab, removeElementWithChildren } from '../shared/utils.js';

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/******************************************************************************/

let selectedImgsObvservable = [];
const selectedImgsHandler = {
  get(target, prop, receiver) {
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    const result = Reflect.set(target, prop, value, receiver);

    const downloadBtn = document.getElementById('download-btn');
    const downloadTitle = document.getElementById('download-title');

    /* Observe length and set download disabled if no imgs are selected  */
    if (target.length <= 0) {
      downloadBtn.disabled = true;
      downloadTitle.textContent = i18n.DOWNLOAD_IMGS;
    } else {
      downloadBtn.disabled = false;
      downloadTitle.textContent = `${i18n.DOWNLOAD_IMGS} (${target.length})`;
    }
    return result;
  },
};
const selectedImgs = new Proxy(selectedImgsObvservable, selectedImgsHandler);

function changeTitle(text) {
  const imgContainerTitle = document.getElementById('container-title');
  if (imgContainerTitle) {
    imgContainerTitle.textContent = text;
  }
}

function disableAll() {
  disableImageActions();
  const captureBtn = document.getElementById('capture-btn');
  captureBtn.disabled = true;

  const reloadBtn = document.getElementById('reload-btn');
  const reloadTitle = document.getElementById('reload-title');
  reloadTitle.textContent = i18n.RELOAD;
  reloadBtn.style.display = 'flex';
  reloadBtn.onclick = () => {
    window.location.reload();
  }
}

function disableImageActions() {
  const selectAllCheck = document.getElementById('select-all-checkbox');
  const selectAllBtn = document.getElementById('select-all-btn');
  selectAllCheck.disabled = true;
  selectAllBtn.disabled = true;
}

/* Mainly register Event listeners */
function displayScrapingDisabled() {
  disableImageActions();
  const imgContainerTitle = document.getElementById('container-title');
  imgContainerTitle.textContent = i18n.LOAD_IMAGES_DISABLED;
}

function setupPopup() {
  const captureBtn = document.getElementById('capture-btn');
  captureBtn.onclick = () => {
    runInCurrenTab((tab) => {
      browserAPI.tabs.sendMessage(tab.id, { action: ACTIONS.INIT_SCREENSHOT });
      window.close();
    });
  }
  const captureBtnTitle = document.getElementById('capture-title');
  captureBtnTitle.textContent = i18n.CAPTURE;

  const downloadBtn = document.getElementById('download-btn');
  downloadBtn.disabled = true;
  downloadBtn.onclick = () => {
    browserAPI.runtime.sendMessage({ action: ACTIONS.DOWNLOAD_IMGS, imgUrls: [...selectedImgs] });
  }
  const downloadTitle = document.getElementById('download-title');
  downloadTitle.textContent = i18n.DOWNLOAD_IMGS;

  const selectAllCheck = document.getElementById('select-all-checkbox');
  selectAllCheck.onclick = (event) => {
    if (event) {
      event.stopPropagation();
    }
  }
  selectAllCheck.onchange = (event) => {
    if (event) {
      event.stopPropagation();
    }
    const imgContainer = document.getElementById('img-container');
    if (!imgContainer) return;
    const imgCardElements = Array.from(imgContainer.getElementsByClassName('image-card'));
    imgCardElements.forEach(imgCard => {
      let checkbox = imgCard.getElementsByClassName('img-select-checkbox')[0];
      if (checkbox.checked != selectAllCheck.checked) {
        checkbox.checked = selectAllCheck.checked;
        checkbox.onchange();
      }
    });
  }

  const selectAllBtn = document.getElementById('select-all-btn');
  selectAllBtn.onclick = () => {
    selectAllCheck.checked = !selectAllCheck.checked;
    selectAllCheck.onchange();
  }

  const selectAllTitle = document.getElementById('select-all-title');
  selectAllTitle.textContent = i18n.SELECT_ALL;

  const shortcutBtn = document.getElementById('shortcut-btn');
  const shortcutTitle = document.getElementById('shortcut-title');
  shortcutBtn.onclick = () => {
    browserAPI.runtime.sendMessage({ action: ACTIONS.OPEN_SHORTCUTS });
  }
  shortcutTitle.textContent = i18n.CHANGE_SHORTCUTS;

  const optionBtn = document.getElementById('options-btn');
  const optionTitle = document.getElementById('options-title');
  optionTitle.textContent = i18n.OPTIONS;
  optionBtn.onclick = () => {
    browserAPI.runtime.openOptionsPage();
  }
}

function renderImages(imgUrls) {
  if (imgUrls.length === 0) {
    changeTitle(ERRORS.NO_IMAGES);
    disableImageActions();
    /* Stop rendering if no images are found */
    return;
  }

  removeElementWithChildren(document.getElementById('container-title'));

  const imgContainer = document.createElement('div');
  imgContainer.id = 'img-container';
  const fragment = document.createDocumentFragment();

  imgUrls.forEach(imgUrl => {
    const imgCard = document.createElement('div');
    imgCard.className = 'image-card';

    /* <img/> element */
    const imgElement = document.createElement('img');
    imgElement.src = imgUrl;
    imgElement.className = 'image-preview';
    imgElement.loading = 'lazy';

    /* Register img select */
    const imgSelectCheck = document.createElement('input');
    imgSelectCheck.type = 'checkbox';
    imgSelectCheck.className = 'img-select-checkbox';
    imgSelectCheck.onclick = (event) => {
      if (event) {
        event.stopPropagation();
      }
    };
    imgSelectCheck.onchange = (event) => {
      if (event) {
        event.stopPropagation();
      }
      if (imgSelectCheck.checked) {
        imgCard.setAttribute('selected', true)
        selectedImgs.push(imgUrl);
      } else {
        const selectAllCheck = document.getElementById('select-all-checkbox');
        selectAllCheck.checked = false;
        imgCard.removeAttribute('selected');
        selectedImgs.splice(selectedImgs.indexOf(imgUrl), 1);
      }
    };
    imgCard.onclick = () => {
      imgSelectCheck.checked = !imgSelectCheck.checked;
      imgSelectCheck.onchange();
    }

    /* ImgOps Link Button*/
    const imgLinkBtn = document.createElement('button');
    imgLinkBtn.textContent = i18n.GO_TO_IMG_OPS;
    imgLinkBtn.className = 'imgops-link-btn';
    imgLinkBtn.onclick = (event) => {
      event.stopPropagation();
      browserAPI.runtime.sendMessage({ action: ACTIONS.OPEN_IMG_OPS, imgUrl: imgUrl });
      window.close();
    };

    /* Append to html */
    imgCard.appendChild(imgSelectCheck);
    imgCard.appendChild(imgElement);
    imgCard.appendChild(imgLinkBtn);
    fragment.appendChild(imgCard);
  });
  imgContainer.appendChild(fragment);
  document.body.appendChild(imgContainer);
}

/******************************************************************************/

setupPopup();

/* Try to load images */

runInCurrenTab(async (tab) => {
  browserAPI.tabs.sendMessage(tab.id, { action: ACTIONS.GET_ALL_IMG_URLS }, res => {
    if (browserAPI.runtime.lastError) {
      disableAll();
      changeTitle(ERRORS.NOT_SUPPORTED);
      return;
    } else {
      if (res && res.imgUrls) {
        renderImages(res.imgUrls);
      } else {
        if (res.error) {
          console.error(res.error.message);
          renderImages([]);
        } else {
          displayScrapingDisabled();
        }
      }
    }
  });
});