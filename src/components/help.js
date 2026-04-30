export function initHelp() {
  const helpBtn = document.getElementById('global-help-btn');
  const helpModal = document.getElementById('help-modal');
  const closeHelpBtn = document.getElementById('close-help-modal');
  
  const slides = document.querySelectorAll('.help-slide');
  const prevBtn = document.getElementById('help-prev-btn');
  const nextBtn = document.getElementById('help-next-btn');
  const dotsContainer = document.getElementById('help-dots-container');
  
  let currentSlideIndex = 0;
  const totalSlides = slides.length;

  // Initialize dots
  slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll('.help-slideshow-dots .dot');

  function updateSlides() {
    slides.forEach((slide, index) => {
      if (index === currentSlideIndex) {
        slide.classList.add('active');
        // Add a slight slide-in animation direction based on next/prev, but default CSS handles opacity & translate nicely
      } else {
        slide.classList.remove('active');
      }
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlideIndex);
    });

    prevBtn.disabled = currentSlideIndex === 0;
    
    // Next button icon
    nextBtn.innerHTML = '&gt;'; // Greater than sign
  }

  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    currentSlideIndex = index;
    updateSlides();
  }

  prevBtn.addEventListener('click', () => {
    goToSlide(currentSlideIndex - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (currentSlideIndex === totalSlides - 1) {
      closeModal();
    } else {
      goToSlide(currentSlideIndex + 1);
    }
  });

  function openModal() {
    helpModal.classList.add('open');
    currentSlideIndex = 0; // Reset to first slide
    updateSlides();
  }

  function closeModal() {
    helpModal.classList.remove('open');
  }

  helpBtn.addEventListener('click', openModal);
  closeHelpBtn.addEventListener('click', closeModal);
  
  // Close on overlay click
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      closeModal();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && helpModal.classList.contains('open')) {
      closeModal();
    }
    // Keyboard navigation for slideshow
    if (helpModal.classList.contains('open')) {
      if (e.key === 'ArrowRight') goToSlide(currentSlideIndex + 1);
      if (e.key === 'ArrowLeft') goToSlide(currentSlideIndex - 1);
    }
  });

  // Initial UI state
  updateSlides();
}
