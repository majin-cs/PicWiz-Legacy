const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const GO_TO_IMG_OPS = browserAPI.i18n.getMessage("goToImgOps");
const FOUND_IMAGES = browserAPI.i18n.getMessage("foundImages");
const NO_IMAGES = browserAPI.i18n.getMessage("noImages");

const actions = {
  uploadBase64: 1,
  getAllImgUrls: 2,
}

document.title = browserAPI.i18n.getMessage("errorImageLoad");

function renderImages(imgs) {
  const imgContainerTitle = document.getElementById('container-title');
  if (imgs.length === 0) {
    imgContainerTitle.textContent = NO_IMAGES;
    // Stop rendering if no images are found
    return;
  }

  /* When Images are found */
  imgContainerTitle.textContent = FOUND_IMAGES;
  const imgContainer = document.createElement('div');
  imgContainer.className = 'img-container';

  const fragment = document.createDocumentFragment();

  imgs.forEach(img => {
    /* Outer img element (card) */
    const imgDiv = document.createElement('div');
    imgDiv.className = 'image-card';

    /* <img/> element */
    const imgElement = document.createElement('img');
    imgElement.src = img.url;
    imgElement.className = 'image-preview';
    imgElement.loading = 'lazy';
    imgElement.addEventListener('click', () => {
      browserAPI.tabs.create({ url: img.url });
    });

    /* <a/> ImgOps Link */
    const imgLink = document.createElement('a');
    imgLink.href = img.imgOpsLink;
    imgLink.target = '_blank';
    imgLink.textContent = GO_TO_IMG_OPS;
    imgLink.className = 'imgops-link link-card';

    /* Append to html */
    imgDiv.appendChild(imgElement);
    imgDiv.appendChild(imgLink);
    fragment.appendChild(imgDiv);
  });
  const hr = document.createElement('hr');
  document.body.appendChild(hr);
  imgContainer.appendChild(fragment);
  document.body.appendChild(imgContainer);
}

/* Queries */
browserAPI.tabs.query({ active: true, currentWindow: true }, async tabs => {
  const activeTab = tabs[0];
  const res = await new Promise(resolve => {
    browserAPI.tabs.sendMessage(activeTab.id, { action: actions.getAllImgUrls }, resolve);
  });
  if (res && res.imgUrls) {
    renderImages(res.imgUrls);
  } else {
    if (res && res.error) {
      console.error(res.error.message);
    }
    renderImages([]);
  }
});