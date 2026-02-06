const CONFIG = {
  minId: 3159,
  maxId: 5578,
  batchSize: 20,
  loadThreshold: 600
};

const gallery = document.getElementById('gallery');
const loader = document.getElementById('loader');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.getElementById('close-btn');

let isLoading = false;

let transform = {
  x: 0,
  y: 0,
  scale: 1,
  isDragging: false,
  startX: 0,
  startY: 0
};

let touchDist = 0;

function generateRandomUrl() {
  const id = Math.floor(Math.random() * (CONFIG.maxId - CONFIG.minId + 1)) + CONFIG.minId;
  const suffix = Math.floor(Math.random() * 10);
  return `https://assets.getkino.com/photos/EFTA0000${id}-${suffix}.png`;
}

function createCard() {
  const card = document.createElement('div');
  card.className = 'img-card';
  
  const skeleton = document.createElement('div');
  skeleton.className = 'skeleton';
  card.appendChild(skeleton);
  
  const img = document.createElement('img');
  img.loading = "lazy";
  
  const url = generateRandomUrl();
  const fileName = url.split('/').pop().replace('.png', '');
  
  const overlay = document.createElement('div');
  overlay.className = 'meta-overlay';
  overlay.innerHTML = `<span class="file-code">${fileName}</span>`;
  card.appendChild(overlay);
  
  img.onload = () => {
    img.classList.add('loaded');
    skeleton.style.display = 'none';
  };
  
  img.onerror = () => {
    card.remove();
    addSingleCard();
  };
  
  img.src = url;
  card.onclick = () => openLightbox(url);
  
  card.appendChild(img);
  return card;
}

function addSingleCard() {
  gallery.appendChild(createCard());
}

function loadBatch() {
  if (isLoading) return;
  isLoading = true;
  loader.classList.add('active');
  
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < CONFIG.batchSize; i++) {
    fragment.appendChild(createCard());
  }
  gallery.appendChild(fragment);
  
  setTimeout(() => {
    isLoading = false;
    loader.classList.remove('active');
  }, 600);
}

function updateView() {
  lightboxImg.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
}

function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.style.display = 'block';
  
  transform = { x: 0, y: 0, scale: 1, isDragging: false, startX: 0, startY: 0 };
  updateView();
  
  requestAnimationFrame(() => lightbox.classList.add('active'));
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  setTimeout(() => {
    if (!lightbox.classList.contains('active')) {
      lightbox.style.display = 'none';
      lightboxImg.src = '';
    }
  }, 300);
  document.body.style.overflow = '';
}

lightbox.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.85 : 1.15;
  transform.scale *= delta;
  if (transform.scale < 0.5) transform.scale = 0.5; // Minimal limit
  updateView();
}, { passive: false });

lightboxImg.addEventListener('mousedown', (e) => {
  e.preventDefault();
  transform.isDragging = true;
  transform.startX = e.clientX - transform.x;
  transform.startY = e.clientY - transform.y;
});

window.addEventListener('mousemove', (e) => {
  if (!transform.isDragging) return;
  transform.x = e.clientX - transform.startX;
  transform.y = e.clientY - transform.startY;
  updateView();
});

window.addEventListener('mouseup', () => {
  transform.isDragging = false;
});

lightbox.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    transform.isDragging = true;
    transform.startX = e.touches[0].clientX - transform.x;
    transform.startY = e.touches[0].clientY - transform.y;
  } else if (e.touches.length === 2) {
    touchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: false });

lightbox.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length === 1 && transform.isDragging) {
    transform.x = e.touches[0].clientX - transform.startX;
    transform.y = e.touches[0].clientY - transform.startY;
    updateView();
  } else if (e.touches.length === 2) {
    const newDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const delta = newDist / touchDist;
    transform.scale *= delta;
    touchDist = newDist;
    updateView();
  }
}, { passive: false });

lightbox.addEventListener('touchend', () => {
  transform.isDragging = false;
});

window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - CONFIG.loadThreshold) {
    loadBatch();
  }
});

closeBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox || e.target.classList.contains('lb-container')) closeLightbox();
});

lightboxImg.addEventListener('dblclick', () => {
  transform = { x: 0, y: 0, scale: 1, isDragging: false, startX: 0, startY: 0 };
  updateView();
});

loadBatch();