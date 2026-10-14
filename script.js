// 1. Carousel Touch, Scroll & Auto-Play Logic
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.dot');
    
    let currentIndex = 0;
    const totalSlides = dots.length;
    const autoScrollDelay = 4500;
    let autoScrollInterval;

    function scrollToSlide(index) {
      const slideWidth = track.clientWidth;
      track.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      });
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % totalSlides;
      scrollToSlide(currentIndex);
    }

    function startAutoScroll() {
      stopAutoScroll();
      autoScrollInterval = setInterval(nextSlide, autoScrollDelay);
    }

    function stopAutoScroll() {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    }

    track.addEventListener('scroll', () => {
      const slideWidth = track.clientWidth;
      const activeIndex = Math.round(track.scrollLeft / slideWidth);
      
      if (currentIndex !== activeIndex) {
        currentIndex = activeIndex;
      }

      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeIndex);
      });
    });

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentIndex = index;
        scrollToSlide(index);
        startAutoScroll();
      });
    });

    track.addEventListener('touchstart', stopAutoScroll, { passive: true });
    track.addEventListener('touchend', startAutoScroll);
    track.addEventListener('mouseenter', stopAutoScroll);
    track.addEventListener('mouseleave', startAutoScroll);

    startAutoScroll();

    // 2. Load Airtable Carousel Data & Avatar
    async function loadDynamicCard() {
      try {
        const response = await fetch('/api/cards?t=' + Date.now());
        if (!response.ok) return;

        const cards = await response.json();
        if (!Array.isArray(cards)) return;

        if (cards.length > 0 && cards[0].imageUrl) {
          const hadithAvatar = document.getElementById('hadith-avatar');
          if (hadithAvatar) {
            hadithAvatar.src = cards[0].imageUrl;
            hadithAvatar.classList.remove('pulsing-placeholder');
          }
        }

        for (let i = 1; i <= 5; i++) {
          if (cards[i]) {
            const imgEl = document.getElementById(`caro${i}`);
            const titleEl = document.getElementById(`title${i}`);
            const linkEl = document.getElementById(`link${i}`);

            if (cards[i].imageUrl && imgEl) {
              imgEl.src = cards[i].imageUrl;
              imgEl.classList.remove('pulsing-placeholder');
            }
            if (cards[i].Title && titleEl) titleEl.textContent = `${i}. ${cards[i].Title}`;
            if (cards[i].url && linkEl) linkEl.href = cards[i].url;
          }
        }
      } catch (error) {
        console.error('Error loading Airtable card data:', error);
      }
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

    // 4. CATEGORY FILTER LOGIC FOR LOCAL BUSINESSES
    const filterButtons = document.querySelectorAll('#filterContainer .filter-btn');
    const businessCards = document.querySelectorAll('#businessGrid .grid-card');

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const selectedCat = button.getAttribute('data-cat');

        businessCards.forEach(card => {
          const cardCat = card.getAttribute('data-cat');
          if (selectedCat === 'all' || cardCat === selectedCat) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

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
