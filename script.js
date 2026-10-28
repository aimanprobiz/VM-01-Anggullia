// Dropdown Toggle & Header Logic
function initHeaderNav() {
  const dropdownBtn = document.getElementById('listingDropdownBtn');
  const navDropdown = dropdownBtn ? dropdownBtn.closest('.nav-dropdown') : null;
  const aboutBtn = document.getElementById('navAboutBtn');

  // 1. Toggle "My Listing" Dropdown Menu
  if (dropdownBtn && navDropdown) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!navDropdown.contains(event.target)) {
        navDropdown.classList.remove('open');
      }
    });
  }

  // 2. About Link Handler (Placeholder state)
  if (aboutBtn) {
    aboutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert("DailyBarakah SG is a community-first directory supporting local Muslim businesses and masjid activities in Singapore.\n\nFull About page coming soon!");
    });
  }
}

// Call on load
document.addEventListener('DOMContentLoaded', initHeaderNav);
// 1. Dynamic Carousel & Hadith Avatar Loader
let currentIndex = 0;
let autoScrollInterval = null;
const autoScrollDelay = 4500;

async function loadDynamicCard() {
  const carouselTrack = document.getElementById('carouselTrack');
  const carouselIndicators = document.getElementById('carouselIndicators');

  try {
    const response = await fetch('/api/cards?t=' + Date.now());
    if (!response.ok) return;

    const cards = await response.json();
    if (!Array.isArray(cards) || cards.length === 0) return;

    if (cards[0] && cards[0].imageUrl) {
      const hadithAvatar = document.getElementById('hadith-avatar');
      if (hadithAvatar) {
        hadithAvatar.src = cards[0].imageUrl;
        hadithAvatar.classList.remove('pulsing-placeholder');
      }
    }

    const carouselCards = cards.slice(1);

    if (carouselTrack && carouselIndicators && carouselCards.length > 0) {
      carouselTrack.innerHTML = '';
      carouselIndicators.innerHTML = '';

      carouselCards.forEach((card, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';

        const link = document.createElement('a');
        link.href = card.url || '#';
        if (card.url) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }

        const img = document.createElement('img');
        img.src = card.imageUrl || 'https://lh3.googleusercontent.com/d/1MBk6pIwDCG0NH9bh9lD7EY9kAp4IQiNM';
        img.alt = card.Title || `Slide ${index + 1}`;

        link.appendChild(img);
        slide.appendChild(link);

        if (card.Title) {
          const caption = document.createElement('div');
          caption.className = 'carousel-caption';
          caption.textContent = card.Title;
          slide.appendChild(caption);
        }

        carouselTrack.appendChild(slide);

        const dot = document.createElement('span');
        dot.className = `dot${index === 0 ? ' active' : ''}`;
        dot.addEventListener('click', () => {
          scrollToSlide(index);
          startAutoScroll(carouselCards.length);
        });
        carouselIndicators.appendChild(dot);
      });

      initCarouselControls(carouselCards.length);
    }

  } catch (error) {
    console.error('Error loading Airtable card data:', error);
  }
}

// 2. Carousel Mechanics
function scrollToSlide(index) {
  const track = document.getElementById('carouselTrack');
  if (!track) return;
  const slideWidth = track.clientWidth;
  track.scrollTo({
    left: slideWidth * index,
    behavior: 'smooth'
  });
  currentIndex = index;
  updateDots(index);
}

function updateDots(activeIndex) {
  const dots = document.querySelectorAll('#carouselIndicators .dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === activeIndex);
  });
}

function startAutoScroll(totalSlides) {
  stopAutoScroll();
  if (totalSlides <= 1) return;
  autoScrollInterval = setInterval(() => {
    const nextIndex = (currentIndex + 1) % totalSlides;
    scrollToSlide(nextIndex);
  }, autoScrollDelay);
}

function stopAutoScroll() {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
  }
}

function initCarouselControls(totalSlides) {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  track.addEventListener('scroll', () => {
    const slideWidth = track.clientWidth;
    if (slideWidth === 0) return;
    const activeIndex = Math.round(track.scrollLeft / slideWidth);
    if (currentIndex !== activeIndex) {
      currentIndex = activeIndex;
      updateDots(activeIndex);
    }
  });

  track.addEventListener('touchstart', stopAutoScroll, { passive: true });
  track.addEventListener('touchend', () => startAutoScroll(totalSlides));
  track.addEventListener('mouseenter', stopAutoScroll);
  track.addEventListener('mouseleave', () => startAutoScroll(totalSlides));

  startAutoScroll(totalSlides);
}

// 3. Load Local JSON Hadith of the Day
let globalHadithList = [];
let currentActiveHadith = null;

async function loadDailyHadith() {
  try {
    const response = await fetch('/hadiths.json?t=' + Date.now());
    if (!response.ok) throw new Error('Failed to load hadiths.json');

    globalHadithList = await response.json();
    if (!Array.isArray(globalHadithList) || globalHadithList.length === 0) return;

    const today = new Date();
    const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    const selectedHadith = globalHadithList[dayIndex % globalHadithList.length];

    displayHadith(selectedHadith);

    const updateStatusEl = document.getElementById('update-status');
    if (updateStatusEl) {
      updateStatusEl.addEventListener('click', () => {
        if (globalHadithList.length <= 1) return;

        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * globalHadithList.length);
        } while (globalHadithList[randomIndex] === selectedHadith);

        const randomHadith = globalHadithList[randomIndex];
        displayHadith(randomHadith);
        updateStatusEl.textContent = "New Hadith";
        updateStatusEl.style.color = "var(--text-muted)";
      });
    }

    const hadithTagEl = document.getElementById('hadith-tag');
    const hadithTextEl = document.getElementById('hadith-text');
    const hadithModal = document.getElementById('hadithModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalHadithText = document.getElementById('modalHadithText');
    const modalHadithTag = document.getElementById('modalHadithTag');
    const modalExternalLink = document.getElementById('modalExternalLink');

    function triggerModal() {
      if (currentActiveHadith) {
        modalHadithText.textContent = currentActiveHadith.text;
        modalHadithTag.textContent = currentActiveHadith.tag;
        modalExternalLink.href = currentActiveHadith.url || "https://sunnah.com";
      }
      hadithModal.showModal();
    }

    if (hadithTagEl && hadithModal) hadithTagEl.addEventListener('click', triggerModal);
    if (hadithTextEl && hadithModal) {
      hadithTextEl.style.cursor = 'pointer';
      hadithTextEl.title = "Click to view details";
      hadithTextEl.addEventListener('click', triggerModal);
    }

    if (closeModalBtn && hadithModal) {
      closeModalBtn.addEventListener('click', () => hadithModal.close());
    }

    hadithModal.addEventListener('click', (event) => {
      const rect = hadithModal.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        hadithModal.close();
      }
    });

  } catch (error) {
    console.error('Error loading Daily Hadith:', error);
  }
}

function displayHadith(hadith) {
  currentActiveHadith = hadith;
  document.getElementById('hadith-text').textContent = hadith.text;
  document.getElementById('hadith-narrator').textContent = hadith.narrator;
  document.getElementById('hadith-tag').textContent = hadith.tag;
}

// 4. Dynamic Category Swipe Engine & Business Loader
let allBusinesses = [];
let categories = ['all'];
let currentCategoryIndex = 0;
let visibleLimit = 10;

function initCategories() {
  const filterContainer = document.getElementById('filterContainer');
  if (!filterContainer) return;

  const searchBtn = document.getElementById('searchToggleBtn');

  if (!allBusinesses || allBusinesses.length === 0) return;

  const dynamicCategories = [...new Set(allBusinesses.map(biz => biz.Category || biz.category || '').filter(Boolean))];
  dynamicCategories.sort();

  categories = ['all', ...dynamicCategories];

  // Clear container and rebuild horizontal category pills
  filterContainer.innerHTML = '';
  if (searchBtn) filterContainer.appendChild(searchBtn);

  const allBtn = document.createElement('button');
  allBtn.className = `filter-btn ${currentCategoryIndex === 0 ? 'active' : ''}`;
  allBtn.setAttribute('data-cat', 'all');
  allBtn.textContent = 'All Deals';
  allBtn.addEventListener('click', () => switchCategory(0));
  filterContainer.appendChild(allBtn);

  dynamicCategories.forEach((cat, index) => {
    const catIndex = index + 1; 
    const btn = document.createElement('button');
    btn.className = `filter-btn ${currentCategoryIndex === catIndex ? 'active' : ''}`;
    btn.setAttribute('data-cat', cat);
    btn.textContent = cat;
    
    btn.addEventListener('click', () => {
      switchCategory(catIndex);
    });
    
    filterContainer.appendChild(btn);
  });

  // Populate Categories Grid inside Search Modal
  initSearchModalCategories();
}

function initSearchModalCategories() {
  const grid = document.getElementById('modalCategoriesGrid');
  const searchModal = document.getElementById('searchModal');
  const modalSearchInput = document.getElementById('modalSearchInput');
  const categoriesSection = document.getElementById('modalCategoriesSection');

  if (!grid) return;
  grid.innerHTML = '';

  categories.forEach((cat, index) => {
    const btn = document.createElement('button');
    const displayName = cat === 'all' ? 'All Deals' : cat;

    btn.className = 'action-btn modal-cat-card';
    btn.style.cssText = `
      padding: 18px 10px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      box-sizing: border-box;
      font-size: 0.85rem;
      font-weight: 700;
    `;
    
    btn.innerHTML = `<span style="white-space: normal; word-break: break-word; text-align: center;">${displayName}</span>`;

    btn.addEventListener('click', () => {
      switchCategory(index);
      if (searchModal) {
        searchModal.close();
        document.body.style.overflow = ''; // Restore background scroll
      }
      if (modalSearchInput) modalSearchInput.value = '';
      if (categoriesSection) categoriesSection.style.display = 'block';
    });

    grid.appendChild(btn);
  });
}
// Setup Search Modal Triggers, Auto-Scroll, Backdrop Closing & Keyboard Filtering
function setupSearchModal() {
  const searchBtn = document.getElementById('searchToggleBtn');
  const headerSearchBtn = document.getElementById('headerSearchBtn');
  const searchModal = document.getElementById('searchModal');
  const closeSearchModalBtn = document.getElementById('closeSearchModalBtn');
  const modalSearchInput = document.getElementById('modalSearchInput');
  const categoriesSection = document.getElementById('modalCategoriesSection');
  const businessSection = document.querySelector('.business-section');

  if (!searchModal) return;

  function openSearchModal() {
    // 1. Scroll main view directly to the "Support Local Muslim Businesses" section
    if (businessSection) {
      businessSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (modalSearchInput) modalSearchInput.value = '';
    if (categoriesSection) categoriesSection.style.display = 'block';
    
    // Lock main page scrolling while modal opens
    document.body.style.overflow = 'hidden';
    
    searchModal.show();

    // Attach click-outside listener after a short delay
    setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    }, 50);
  }

  function closeSearchModal() {
    searchModal.close();
    document.body.style.overflow = ''; // Restore main page scrolling
    window.removeEventListener('click', handleOutsideClick);
  }

  // Handle click outside modal container
  function handleOutsideClick(event) {
    if (!searchModal.open) return;
    const isClickInside = 
      searchModal.contains(event.target) || 
      (searchBtn && searchBtn.contains(event.target)) ||
      (headerSearchBtn && headerSearchBtn.contains(event.target));

    if (!isClickInside) {
      closeSearchModal();
    }
  }

  // Bind both category grid pill and right-aligned header search button
  if (searchBtn) searchBtn.addEventListener('click', openSearchModal);
  if (headerSearchBtn) headerSearchBtn.addEventListener('click', openSearchModal);

  if (closeSearchModalBtn) {
    closeSearchModalBtn.addEventListener('click', closeSearchModal);
  }

  if (modalSearchInput) {
    modalSearchInput.addEventListener('input', () => {
      const query = modalSearchInput.value.trim();

      if (categoriesSection) {
        categoriesSection.style.display = query !== '' ? 'none' : 'block';
      }

      visibleLimit = 10;
      
      const activeCat = categories[currentCategoryIndex];
      const prevCat = categories[(currentCategoryIndex - 1 + categories.length) % categories.length];
      const nextCat = categories[(currentCategoryIndex + 1) % categories.length];

      const prevPage = document.getElementById('prevCategoryPage');
      const activePage = document.getElementById('activeCategoryPage');
      const nextPage = document.getElementById('nextCategoryPage');

      if (prevPage) prevPage.innerHTML = `<div class="business-grid">${renderGridForCategory(prevCat, query)}</div>`;
      if (activePage) activePage.innerHTML = `<div class="business-grid" id="businessGrid">${renderGridForCategory(activeCat, query)}</div>`;
      if (nextPage) nextPage.innerHTML = `<div class="business-grid">${renderGridForCategory(nextCat, query)}</div>`;
    });

    // Dismiss soft keyboard & restore scrolling when user presses "Enter" / "Search"
    modalSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        modalSearchInput.blur();
        document.body.style.overflow = ''; // Allow users to scroll search results
      }
    });
  }
}
async function loadBusinesses() {
  const gridContainer = document.getElementById('businessGrid');
  if (gridContainer) {
    gridContainer.innerHTML = Array(6).fill(`
      <div class="grid-card skeleton-card">
        <div class="skeleton-img"></div>
        <div class="grid-card-body">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line sub"></div>
          <div class="skeleton-line badge"></div>
          <div class="skeleton-line btn"></div>
        </div>
      </div>
    `).join('');
  }

  try {
    const response = await fetch('/api/businesses?t=' + Date.now());
    if (!response.ok) throw new Error('Network response was not ok');

    allBusinesses = await response.json();
    if (!Array.isArray(allBusinesses)) allBusinesses = [];

    allBusinesses.sort((a, b) => {
      const aFeatured = a.IsFeatured ? 1 : 0;
      const bFeatured = b.IsFeatured ? 1 : 0;
      if (aFeatured !== bFeatured) return bFeatured - aFeatured;
      return (a.Name || '').localeCompare(b.Name || '');
    });

    initCategories();
    setupSearchModal();
    renderCurrentCategoryView();
    initSwipeGestures();

  } catch (error) {
    console.error('Error loading businesses:', error);
  }
}

function renderGridForCategory(catName, searchQuery = '') {
  const query = searchQuery.trim().toLowerCase();

  let targetDataset = [];

  if (query !== '') {
    targetDataset = allBusinesses.filter(biz => {
      const name = (biz.Name || '').toLowerCase();
      const sub = (biz.SubTitle || '').toLowerCase();
      const cat = (biz.Category || '').toLowerCase();
      const deal = (biz.Deal || biz.deal || '').toLowerCase();
      const desc = (biz.Description || biz.description || '').toLowerCase();

      return name.includes(query) || 
             sub.includes(query) || 
             cat.includes(query) || 
             deal.includes(query) || 
             desc.includes(query);
    });
  } else {
    targetDataset = catName === 'all' 
      ? allBusinesses 
      : allBusinesses.filter(biz => {
          const bizCat = (biz.Category || biz.category || '').trim();
          return bizCat.toLowerCase() === catName.toLowerCase();
        });
  }

  if (targetDataset.length === 0) {
    return `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">No listings found</p>
        <p style="font-size: 0.82rem; margin-top: 4px;">Try another search term or browse categories.</p>
      </div>
    `;
  }

  return targetDataset.slice(0, visibleLimit).map(biz => {
    const isFeatured = biz.IsFeatured;
    const rawDeal = biz.Deal || biz.deal || '';
    const dealText = rawDeal.trim() !== '' ? rawDeal : 'No offer';

    return `
      <div class="${isFeatured ? 'grid-card featured-card' : 'grid-card'}" 
           style="cursor: pointer;" 
           onclick="window.location.href='/business.html?slug=${biz.Slug}'">
        <div style="position: relative;">
          <img src="${biz.ImageURL || 'https://lh3.googleusercontent.com/d/1MBk6pIwDCG0NH9bh9lD7EY9kAp4IQiNM'}" alt="${biz.Name}" class="card-banner">
          ${isFeatured ? '<span class="grid-featured-badge" title="Featured Listing">★</span>' : ''}
        </div>
        <div class="grid-card-body">
          <div class="vendor-details">
            <div class="deal-badge"><span></span> ${dealText}</div>
            <h3 class="vendor-name">${biz.Name}</h3>
            <p class="vendor-sub">${biz.SubTitle || biz.Category || ''}</p>
          </div>
          <button class="action-btn" style="text-align: center;">View Details</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderCurrentCategoryView() {
  if (categories.length === 0) return;

  const modalSearchInput = document.getElementById('modalSearchInput');
  const currentQuery = modalSearchInput ? modalSearchInput.value : '';

  const prevIndex = (currentCategoryIndex - 1 + categories.length) % categories.length;
  const nextIndex = (currentCategoryIndex + 1) % categories.length;

  const activeCat = categories[currentCategoryIndex];
  const prevCat = categories[prevIndex];
  const nextCat = categories[nextIndex];

  document.getElementById('prevCategoryPage').innerHTML = `<div class="business-grid">${renderGridForCategory(prevCat, currentQuery)}</div>`;
  document.getElementById('activeCategoryPage').innerHTML = `<div class="business-grid" id="businessGrid">${renderGridForCategory(activeCat, currentQuery)}</div>`;
  document.getElementById('nextCategoryPage').innerHTML = `<div class="business-grid">${renderGridForCategory(nextCat, currentQuery)}</div>`;

  const filterButtons = document.querySelectorAll('#filterContainer .filter-btn:not(.search-pill)');
  filterButtons.forEach((btn, idx) => {
    const isActive = idx === currentCategoryIndex;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  });

  // Re-highlight active state in modal category grid if open
  initSearchModalCategories();
}

function switchCategory(newIndex) {
  if (newIndex === currentCategoryIndex) return;
  visibleLimit = 10; 
  currentCategoryIndex = newIndex;
  renderCurrentCategoryView();
}

function initSwipeGestures() {
  const viewport = document.getElementById('categorySwipeViewport');
  const track = document.getElementById('categorySwipeTrack');
  if (!viewport || !track) return;

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let currentDeltaX = 0;
  let isSwiping = false;
  let isHorizontalMove = null;

  viewport.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
    currentDeltaX = 0;
    isSwiping = true;
    isHorizontalMove = null;
    track.classList.remove('animating');
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (isHorizontalMove === null) {
      isHorizontalMove = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (!isHorizontalMove) return;

    currentDeltaX = deltaX;

    const viewportWidth = viewport.clientWidth;
    const baseOffsetPercent = -33.333;
    const dragOffsetPercent = ((currentDeltaX * 1.25) / viewportWidth) * 33.333;

    track.style.transform = `translateX(${baseOffsetPercent + dragOffsetPercent}%)`;
  }, { passive: true });

  viewport.addEventListener('touchend', () => {
    if (!isSwiping || isHorizontalMove === false) {
      isSwiping = false;
      return;
    }

    isSwiping = false;
    track.classList.add('animating');

    const viewportWidth = viewport.clientWidth;
    const elapsedTime = Date.now() - startTime;
    const velocity = Math.abs(currentDeltaX) / elapsedTime;

    const distanceThreshold = viewportWidth * 0.11;
    const isFastFlick = velocity > 0.35 && Math.abs(currentDeltaX) > 25;

    if (currentDeltaX < -distanceThreshold || isFastFlick && currentDeltaX < 0) {
      track.style.transform = `translateX(-66.666%)`;
      setTimeout(() => {
        track.classList.remove('animating');
        currentCategoryIndex = (currentCategoryIndex + 1) % categories.length;
        visibleLimit = 10;
        renderCurrentCategoryView();
        track.style.transform = `translateX(-33.333%)`;
      }, 250);

    } else if (currentDeltaX > distanceThreshold || isFastFlick && currentDeltaX > 0) {
      track.style.transform = `translateX(0%)`;
      setTimeout(() => {
        track.classList.remove('animating');
        currentCategoryIndex = (currentCategoryIndex - 1 + categories.length) % categories.length;
        visibleLimit = 10;
        renderCurrentCategoryView();
        track.style.transform = `translateX(-33.333%)`;
      }, 250);

    } else {
      track.style.transform = `translateX(-33.333%)`;
    }
  });
}

let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScroll = window.scrollY;
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const distanceToBottom = scrollableHeight - currentScroll;

  if (categories.length > 0) {
    const activeCat = categories[currentCategoryIndex];
    const modalSearchInput = document.getElementById('modalSearchInput');
    const query = modalSearchInput ? modalSearchInput.value.trim().toLowerCase() : '';

    let targetDataset = [];
    if (query !== '') {
      targetDataset = allBusinesses.filter(biz => {
        const name = (biz.Name || '').toLowerCase();
        const sub = (biz.SubTitle || '').toLowerCase();
        const cat = (biz.Category || '').toLowerCase();
        const deal = (biz.Deal || biz.deal || '').toLowerCase();
        const desc = (biz.Description || biz.description || '').toLowerCase();
        return name.includes(query) || sub.includes(query) || cat.includes(query) || deal.includes(query) || desc.includes(query);
      });
    } else {
      targetDataset = activeCat === 'all'
        ? allBusinesses
        : allBusinesses.filter(biz => (biz.Category || 'all').toLowerCase() === activeCat.toLowerCase());
    }

    if (distanceToBottom < 350 && visibleLimit < targetDataset.length) {
      visibleLimit += 10;
      renderCurrentCategoryView();
    }
  }

  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    const isScrollingUp = currentScroll < lastScrollY;
    const isPastThreshold = currentScroll > 300;

    if (isScrollingUp && isPastThreshold) {
      backToTopBtn.style.opacity = '1';
      backToTopBtn.style.pointerEvents = 'auto';
    } else {
      backToTopBtn.style.opacity = '0';
      backToTopBtn.style.pointerEvents = 'none';
    }
  }

  lastScrollY = currentScroll;
});

loadDynamicCard();
loadDailyHadith();
loadBusinesses();
