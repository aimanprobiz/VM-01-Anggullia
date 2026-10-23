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

    // A. Use the first item's image as Hadith avatar if available
    if (cards[0] && cards[0].imageUrl) {
      const hadithAvatar = document.getElementById('hadith-avatar');
      if (hadithAvatar) {
        hadithAvatar.src = cards[0].imageUrl;
        hadithAvatar.classList.remove('pulsing-placeholder');
      }
    }

    // B. Build Carousel Slides & Dots dynamically, skipping the first item
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

        // Build dot indicator
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

// 4. Dynamic Business Directory Loader & Category Filter
let allBusinesses = [];
let visibleLimit = 10;

async function loadBusinesses() {
  const gridContainer = document.getElementById('businessGrid');
  if (!gridContainer) return;

  gridContainer.innerHTML = Array(10).fill(`
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
  
  try {
    const response = await fetch('/api/businesses?t=' + Date.now());
    if (!response.ok) throw new Error('Network response was not ok');

    allBusinesses = await response.json();
    if (!Array.isArray(allBusinesses)) {
      allBusinesses = [];
    }

    allBusinesses.sort((a, b) => {
      const aFeatured = a.IsFeatured ? 1 : 0;
      const bFeatured = b.IsFeatured ? 1 : 0;

      if (aFeatured !== bFeatured) {
        return bFeatured - aFeatured;
      }
      return (a.Name || '').localeCompare(b.Name || '');
    });

    renderBusinessBatch();
    setupCategoryFilters();

  } catch (error) {
    console.error('Error loading businesses from Airtable:', error);
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 0.9rem; color: #d9534f;">Unable to load business listings. Please refresh the page.</p>
      </div>
    `;
  }
}

// Unified Scroll Listener for Infinite Scroll & Back-to-Top
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const currentScroll = window.scrollY;
  const distanceToBottom = scrollableHeight - currentScroll;

  const activeFilter = document.querySelector('#filterContainer .filter-btn.active');
  const selectedCat = activeFilter ? activeFilter.getAttribute('data-cat') : 'all';
  const targetDataset = selectedCat === 'all' 
    ? allBusinesses 
    : allBusinesses.filter(biz => (biz.Category || 'all') === selectedCat);

  if (distanceToBottom < 300 && visibleLimit < targetDataset.length) {
    visibleLimit += 10;
    renderBusinessBatch();
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

function renderBusinessBatch(direction = '') {
  const gridContainer = document.getElementById('businessGrid');
  if (!gridContainer) return;

  // Clear previous animation classes and trigger reflow
  gridContainer.classList.remove('grid-slide-right', 'grid-slide-left');
  void gridContainer.offsetWidth; 

  if (direction === 'right') {
    gridContainer.classList.add('grid-slide-right');
  } else if (direction === 'left') {
    gridContainer.classList.add('grid-slide-left');
  }

  gridContainer.innerHTML = '';

  if (allBusinesses.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 1rem; font-weight: 600; color: var(--text-main);">No listings available yet</p>
        <p style="font-size: 0.85rem; margin-top: 5px;">Check back soon for new community deals!</p>
      </div>
    `;
    return;
  }

  const activeFilter = document.querySelector('#filterContainer .filter-btn.active');
  const selectedCat = activeFilter ? activeFilter.getAttribute('data-cat') : 'all';

  const targetDataset = selectedCat === 'all' 
    ? allBusinesses 
    : allBusinesses.filter(biz => (biz.Category || 'all') === selectedCat);

  const currentBatch = targetDataset.slice(0, visibleLimit);

  currentBatch.forEach((biz, index) => {
    const isFeatured = biz.IsFeatured;
    const card = document.createElement('div');
    
    card.className = (isFeatured ? 'grid-card featured-card' : 'grid-card') + ' grid-card-animate';
    card.style.animationDelay = `${index * 0.03}s`;
    card.setAttribute('data-cat', biz.Category || 'all');
    card.style.cursor = 'pointer';

    card.onclick = function() {
      window.location.href = `/business.html?slug=${biz.Slug}`;
    };

    const rawDeal = biz.Deal || biz.deal || '';
    const dealText = rawDeal.trim() !== '' ? rawDeal : 'No offer';

    card.innerHTML = `
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

        <button class="action-btn" style="text-align: center;">
          View Details
        </button>
      </div>
    `;
    gridContainer.appendChild(card);
  });

  const oldBtn = document.getElementById('loadMoreBtn');
  if (oldBtn) oldBtn.remove();
}

function setupCategoryFilters() {
  const filterButtons = document.querySelectorAll('#filterContainer .filter-btn');
  const gridContainer = document.getElementById('businessGrid');

  filterButtons.forEach(button => {
    button.replaceWith(button.cloneNode(true));
  });

  const freshFilterButtons = document.querySelectorAll('#filterContainer .filter-btn');

  freshFilterButtons.forEach((button, newIdx) => {
    button.addEventListener('click', () => {
      const oldActiveBtn = document.querySelector('#filterContainer .filter-btn.active');
      const filterButtonsArr = Array.from(freshFilterButtons);
      const oldIdx = filterButtonsArr.indexOf(oldActiveBtn);

      freshFilterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const slideDir = newIdx > oldIdx ? 'right' : 'left';

      visibleLimit = 10;
      renderBusinessBatch(slideDir);

      const selectedCat = button.getAttribute('data-cat');
      let visibleCount = 0;

      const businessCards = gridContainer.querySelectorAll('.grid-card');

      businessCards.forEach(card => {
        const cardCat = card.getAttribute('data-cat');
        
        if (selectedCat === 'all' || cardCat === selectedCat) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      let emptyMsg = document.getElementById('emptyCategoryMsg');
      let loadMoreBtn = document.getElementById('loadMoreBtn');

      if (visibleCount === 0) {
        if (!emptyMsg) {
          emptyMsg = document.createElement('div');
          emptyMsg.id = 'emptyCategoryMsg';
          emptyMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 30px 15px; color: var(--text-muted);';
          emptyMsg.innerHTML = '<p style="font-size: 0.9rem;">No listings found in this category.</p>';
          gridContainer.appendChild(emptyMsg);
        } else {
          emptyMsg.style.display = 'block';
        }
        if (loadMoreBtn) loadMoreBtn.style.setProperty('display', 'none', 'important');
      } else {
        if (emptyMsg) emptyMsg.style.display = 'none';
      }
    });
  });
}

// --- True Side-by-Side Real-Time Category Swiper ---
function enableCategorySwipe() {
  const wrapper = document.getElementById('gridWrapper');
  const activeGrid = document.getElementById('businessGrid');
  const filterContainer = document.getElementById('filterContainer');

  if (!wrapper || !activeGrid || !filterContainer) return;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let startTime = 0;
  let isDragging = false;
  let isHorizontalSwipe = null;
  let adjacentGrid = null;

  wrapper.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentX = startX;
    startTime = Date.now();
    isDragging = true;
    isHorizontalSwipe = null;
    adjacentGrid = null;
  }, { passive: true });

  wrapper.addEventListener('touchmove', (e) => {
    if (!isDragging) return;

    currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    const diffY = e.touches[0].clientY - startY;

    if (isHorizontalSwipe === null) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 4) {
        isHorizontalSwipe = true;
      } else if (Math.abs(diffY) > Math.abs(diffX)) {
        isHorizontalSwipe = false;
      }
    }

    if (isHorizontalSwipe) {
      const filterButtons = Array.from(filterContainer.querySelectorAll('.filter-btn'));
      const activeIndex = filterButtons.findIndex(btn => btn.classList.contains('active'));

      // 1. Dynamically render adjacent page on first movement
      if (!adjacentGrid && Math.abs(diffX) > 5) {
        const targetIndex = diffX < 0 ? activeIndex + 1 : activeIndex - 1;

        if (targetIndex >= 0 && targetIndex < filterButtons.length) {
          const targetCat = filterButtons[targetIndex].getAttribute('data-cat');
          
          adjacentGrid = document.createElement('div');
          adjacentGrid.className = 'business-grid';
          adjacentGrid.id = 'adjacentGrid';

          // Filter listings for adjacent category
          const targetDataset = targetCat === 'all' 
            ? allBusinesses 
            : allBusinesses.filter(biz => (biz.Category || 'all') === targetCat);

          const batch = targetDataset.slice(0, 10);
          adjacentGrid.innerHTML = batch.map(biz => `
            <div class="grid-card ${biz.IsFeatured ? 'featured-card' : ''}" onclick="window.location.href='/business.html?slug=${biz.Slug}'">
              <div style="position: relative;">
                <img src="${biz.ImageURL || 'https://lh3.googleusercontent.com/d/1MBk6pIwDCG0NH9bh9lD7EY9kAp4IQiNM'}" alt="${biz.Name}" class="card-banner">
                ${biz.IsFeatured ? '<span class="grid-featured-badge">★</span>' : ''}
              </div>
              <div class="grid-card-body">
                <div class="vendor-details">
                  <div class="deal-badge">${biz.Deal || 'No offer'}</div>
                  <h3 class="vendor-name">${biz.Name}</h3>
                  <p class="vendor-sub">${biz.SubTitle || biz.Category || ''}</p>
                </div>
                <button class="action-btn">View Details</button>
              </div>
            </div>
          `).join('');

          // Append to left or right based on drag direction
          if (diffX < 0) {
            wrapper.appendChild(adjacentGrid);
          } else {
            wrapper.insertBefore(adjacentGrid, activeGrid);
            wrapper.style.transform = `translateX(-100%)`;
          }
        }
      }

      // 2. Real-Time Finger Tracking
      wrapper.classList.add('dragging');
      if (diffX < 0) {
        wrapper.style.transform = `translateX(${diffX}px)`;
      } else if (adjacentGrid) {
        wrapper.style.transform = `translateX(calc(-100% + ${diffX}px))`;
      }
    }
  }, { passive: true });

  wrapper.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;

    wrapper.classList.remove('dragging');

    if (isHorizontalSwipe) {
      const diffX = currentX - startX;
      const duration = Date.now() - startTime;
      const distanceThreshold = window.innerWidth * 0.12; 
      const isFastFlick = duration < 250 && Math.abs(diffX) > 25;

      const filterButtons = Array.from(filterContainer.querySelectorAll('.filter-btn'));
      const activeIndex = filterButtons.findIndex(btn => btn.classList.contains('active'));

      let targetIndex = activeIndex;

      if ((diffX < -distanceThreshold || (isFastFlick && diffX < 0)) && activeIndex < filterButtons.length - 1) {
        targetIndex = activeIndex + 1;
      } else if ((diffX > distanceThreshold || (isFastFlick && diffX > 0)) && activeIndex > 0) {
        targetIndex = activeIndex - 1;
      }

      if (targetIndex !== activeIndex && adjacentGrid) {
        // Slide completely into adjacent page
        wrapper.style.transform = diffX < 0 ? `translateX(-100%)` : `translateX(0%)`;

        setTimeout(() => {
          const targetBtn = filterButtons[targetIndex];
          
          // Switch active filter pill
          filterButtons.forEach(btn => btn.classList.remove('active'));
          targetBtn.classList.add('active');

          // Clean up DOM and reset main grid to new category
          visibleLimit = 10;
          renderBusinessBatch();

          wrapper.classList.add('dragging');
          wrapper.style.transform = 'translateX(0)';
          if (adjacentGrid) adjacentGrid.remove();

          requestAnimationFrame(() => {
            wrapper.classList.remove('dragging');
          });

          targetBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 260);

      } else {
        // Snap back to current page
        wrapper.style.transform = adjacentGrid && diffX > 0 ? 'translateX(-100%)' : 'translateX(0)';
        setTimeout(() => {
          wrapper.style.transform = 'translateX(0)';
          if (adjacentGrid) adjacentGrid.remove();
        }, 260);
      }
    }
  });
}

// Enable Category Swiping on Page Initialization
enableCategorySwipe();

// 5. BUSINESS MODAL ACTION LOGIC
const bizModal = document.getElementById('businessModal');
const closeBizModalBtn = document.getElementById('closeBizModalBtn');
const bizModalTitle = document.getElementById('bizModalTitle');
const bizModalSub = document.getElementById('bizModalSub');
const bizModalDeal = document.getElementById('bizModalDeal');
const pinArea = document.getElementById('pinArea');
const whatsappBtn = document.getElementById('whatsappBtn');
const cashierPinInput = document.getElementById('cashierPin');
const verifyPinBtn = document.getElementById('verifyPinBtn');

function openBizModal(actionType, name, sub, deal, phone = '') {
  bizModalTitle.textContent = name;
  bizModalSub.textContent = sub;
  bizModalDeal.textContent = deal;
  cashierPinInput.value = '';

  if (actionType === 'claim') {
    pinArea.style.display = 'block';
    whatsappBtn.style.display = 'none';
  } else {
    pinArea.style.display = 'none';
    whatsappBtn.style.display = 'block';
    
    const encodedText = encodeURIComponent(`Assalaamualaikum! I saw your offer "${deal}" on the Masjid Angullia Companion App and would like to find out more.`);
    whatsappBtn.href = `https://wa.me/${phone}?text=${encodedText}`;
  }

  bizModal.showModal();
}

verifyPinBtn.addEventListener('click', () => {
  if (cashierPinInput.value.length === 4) {
    alert('Voucher successfully validated! Show this confirmation to the cashier.');
    bizModal.close();
  } else {
    alert('Please enter a valid 4-digit cashier PIN.');
  }
});

if (closeBizModalBtn) {
  closeBizModalBtn.addEventListener('click', () => bizModal.close());
}

bizModal.addEventListener('click', (event) => {
  const rect = bizModal.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    bizModal.close();
  }
});

// Run all dynamic data functions on page load
loadDynamicCard();
loadDailyHadith();
loadBusinesses();
