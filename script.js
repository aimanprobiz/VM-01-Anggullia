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

    // B. Build Carousel Slides & Dots dynamically, skipping the first item ()
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

// Pagination state variables
let allBusinesses = [];
let visibleLimit = 10; // Shows 10 cards initially

async function loadBusinesses() {
  const gridContainer = document.getElementById('businessGrid');
  if (!gridContainer) return;

  // 1. Show a loading state before fetch completes
  gridContainer.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
      <p style="font-size: 0.95rem; font-weight: 500;">Loading community listings...</p>
    </div>
  `;

  try {
    const response = await fetch('/api/businesses?t=' + Date.now());
    if (!response.ok) throw new Error('Network response was not ok');

    allBusinesses = await response.json();

    // 2. Handle empty dataset from Airtable
    if (!Array.isArray(allBusinesses) || allBusinesses.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <p style="font-size: 1rem; font-weight: 600; color: var(--text-main);">No listings available yet</p>
          <p style="font-size: 0.85rem; margin-top: 5px;">Check back soon for new community deals!</p>
        </div>
      `;
      return;
    }

    // 3. SORT: Featured listings first, then alphabetical by name
    allBusinesses.sort((a, b) => {
      const aFeatured = a.IsFeatured ? 1 : 0;
      const bFeatured = b.IsFeatured ? 1 : 0;

      if (aFeatured !== bFeatured) {
        return bFeatured - aFeatured; // Featured ones come first
      }
      return (a.Name || '').localeCompare(b.Name || '');
    });

    // Render the first batch of cards
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

// Helper function to render batches based on visibleLimit
function renderBusinessBatch() {
  const gridContainer = document.getElementById('businessGrid');
  if (!gridContainer) return;

  gridContainer.innerHTML = '';

  // Slice the array to only show up to the current visibleLimit
  const currentBatch = allBusinesses.slice(0, visibleLimit);

  currentBatch.forEach(biz => {
    const isFeatured = biz.IsFeatured;
    const card = document.createElement('div');
    
    card.className = isFeatured ? 'grid-card featured-card' : 'grid-card';
    card.setAttribute('data-cat', biz.Category || 'all');
    card.style.cursor = 'pointer';

    if (isFeatured) {
      card.style.border = '2px solid #eab308';
      card.style.background = 'linear-gradient(to bottom, #fffdf0, #ffffff)';
      card.style.position = 'relative';
    }

    card.onclick = function() {
      window.location.href = `/business.html?slug=${biz.Slug}`;
    };

    card.innerHTML = `
      ${isFeatured ? '<span style="position: absolute; top: 10px; right: 10px; background: #eab308; color: #000; font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; z-index: 2;">⭐ Featured</span>' : ''}
      <img src="${biz.ImageURL || 'https://lh3.googleusercontent.com/d/1MBk6pIwDCG0NH9bh9lD7EY9kAp4IQiNM'}" alt="${biz.Name}" class="card-banner">
      <div class="grid-card-body">
        <div class="vendor-details">
          <h3 class="vendor-name">${biz.Name}</h3>
          <p class="vendor-sub">${biz.SubTitle || ''}</p>
          <span class="deal-badge">${biz.Deal || ''}</span>
        </div>
        <a href="/business.html?slug=${biz.Slug}" class="action-btn" style="text-align: center; text-decoration: none;">
          ${biz.ActionType || 'View Details'}
        </a>
      </div>
    `;

    gridContainer.appendChild(card);
  });

  // Handle "Load More" button visibility
  let loadMoreBtn = document.getElementById('loadMoreBtn');
  
  if (visibleLimit < allBusinesses.length) {
    if (!loadMoreBtn) {
      loadMoreBtn = document.createElement('button');
      loadMoreBtn.id = 'loadMoreBtn';
      loadMoreBtn.className = 'action-btn';
      loadMoreBtn.style.cssText = 'width: 100%; margin: 24px 0; background: var(--card-bg); color: var(--primary-color); border: 1.5px solid var(--primary-color); font-weight: 600; cursor: pointer;';
      loadMoreBtn.textContent = 'Load More Businesses ↓';
      
      loadMoreBtn.addEventListener('click', () => {
        visibleLimit += 10; // Increase limit by 10
        renderBusinessBatch();
      });
      
      gridContainer.parentNode.appendChild(loadMoreBtn);
    } else {
      loadMoreBtn.style.display = 'block';
    }
  } else if (loadMoreBtn) {
    loadMoreBtn.style.display = 'none'; // Hide when all cards are shown
  }
}
function setupCategoryFilters() {
  const filterButtons = document.querySelectorAll('#filterContainer .filter-btn');
  const gridContainer = document.getElementById('businessGrid');

  filterButtons.forEach(button => {
    // Prevent duplicate event listeners if Load More re-runs things
    button.replaceWith(button.cloneNode(true));
  });

  // Re-select fresh buttons after cloning
  const freshFilterButtons = document.querySelectorAll('#filterContainer .filter-btn');

  freshFilterButtons.forEach(button => {
    button.addEventListener('click', () => {
      freshFilterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const selectedCat = button.getAttribute('data-cat');
      let visibleCount = 0;

      // 🔍 Dynamically grab all current cards in the grid right now
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

      // Show an empty state message if a specific filter pill has 0 results
      let emptyMsg = document.getElementById('emptyCategoryMsg');
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
      } else if (emptyMsg) {
        emptyMsg.style.display = 'none';
      }
    });
  });
}

// Initialize on page load
loadBusinesses();
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

    // Run dynamic data functions on page load
    loadDynamicCard();
    loadDailyHadith();
loadBusinesses();

