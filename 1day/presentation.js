document.addEventListener('DOMContentLoaded', () => {
    const slides = Array.from(document.querySelectorAll('.presentation-slide'));
    let currentSlide = 0;
    if (slides.length === 0) { console.warn('No slides found'); return; }

    let animatedElementsCache = new WeakMap();
    const getAnimatedElements = (slide) => {
        if (!animatedElementsCache.has(slide)) {
            animatedElementsCache.set(slide, slide.querySelectorAll('[data-animate]'));
        }
        return animatedElementsCache.get(slide);
    };

    const setSlideVisible = (slide, visible) => {
        if (!slide) return;
        if (visible) {
            slide.style.opacity = '1';
            slide.style.visibility = 'visible';
            slide.style.pointerEvents = 'auto';
            slide.style.zIndex = '2';
        } else {
            slide.style.opacity = '0';
            slide.style.visibility = 'hidden';
            slide.style.pointerEvents = 'none';
            slide.style.zIndex = '1';

            const elements = getAnimatedElements(slide);
            if (elements) {
                elements.forEach(el => {
                    gsap.set(el, { opacity: 0, y: 20 });
                });
            }
        }
    };

    const goToSlide = (slideIndex) => {
        if (slideIndex < 0 || slideIndex >= slides.length || (slideIndex === currentSlide && document.body.dataset.initialLoad !== 'true')) return false;

        const oldSlide = slides[currentSlide];
        const newSlide = slides[slideIndex];
        
        currentSlide = slideIndex;
        

        setSlideVisible(oldSlide, false);
        setSlideVisible(newSlide, true);


        const newElements = getAnimatedElements(newSlide);
        if (newElements.length > 0) {
            gsap.fromTo(newElements, 
                { opacity: 0, y: 20 }, 
                { 
                    opacity: 1, 
                    y: 0, 
                    duration: 0.6, 
                    stagger: 0.1, 
                    ease: 'power3.out',
                    delay: 0.2
                }
            );
        }
        
        updateUIElements();
        document.body.removeAttribute('data-initial-load');
        return true;
    };

    const nextSlide = () => goToSlide(currentSlide + 1);
    const prevSlide = () => goToSlide(currentSlide - 1);
    const firstSlide = () => goToSlide(0);
    const lastSlide = () => goToSlide(slides.length - 1);

    function updateUIElements() {
        const dotsContainer = document.getElementById('presentation-dots');
        const prevButton = document.getElementById('presentation-prev-slide');
        const nextButton = document.getElementById('presentation-next-slide');

        if (dotsContainer) {
            const pageIndicator = dotsContainer.querySelector('#presentation-current-page');
            if(pageIndicator) {
                pageIndicator.textContent = (currentSlide + 1).toString();
            }
        }
        if (prevButton) prevButton.disabled = currentSlide === 0;
        if (nextButton) nextButton.disabled = currentSlide === slides.length - 1;
    }
    
    function initializeUIElements() {
        const navContainer = document.getElementById('presentation-navigation');
        const dotsContainer = document.getElementById('presentation-dots');
        const prevButton = document.getElementById('presentation-prev-slide');
        const nextButton = document.getElementById('presentation-next-slide');

        const totalSlides = slides.length;
        if (totalSlides <= 1) {
            if (navContainer) navContainer.style.display = 'none';
            return;
        }

        if (navContainer) navContainer.style.display = 'flex';

        if (dotsContainer && totalSlides > 1) {
            dotsContainer.innerHTML = `
                <div class="flex items-center gap-1 text-white/80 text-sm font-medium">
                    <span id="presentation-current-page" class="min-w-[1.2em] text-center">${currentSlide + 1}</span>
                    <span class="text-white/50">/</span>
                    <span class="min-w-[1.2em] text-center">${totalSlides}</span>
                </div>
            `;
        }

        if (prevButton) prevButton.addEventListener('click', prevSlide);
        if (nextButton) nextButton.addEventListener('click', nextSlide);
    }

    const announceSlide = () => {
        const announcement = `Slide ${currentSlide + 1} of ${slides.length}`;
        let announcer = document.getElementById('presentation-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'presentation-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(announcer);
        }
        announcer.textContent = announcement;
    };

    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
        
        let handled = false;
        const keyMap = {
            'ArrowRight': nextSlide, 'Space': nextSlide, 'PageDown': nextSlide,
            'ArrowLeft': prevSlide, 'PageUp': prevSlide,
            'Home': firstSlide, 'End': lastSlide,
        };
        
        if (keyMap[e.key]) {
            e.preventDefault();
            keyMap[e.key]();
            handled = true;
        }
        
        if (handled) announceSlide();
    });

    let touchStartX = null, touchStartY = null;
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) [touchStartX, touchStartY] = [e.touches[0].clientX, e.touches[0].clientY];
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY || e.changedTouches.length !== 1) {
            touchStartX = touchStartY = null;
            return;
        }
        const [touchEndX, touchEndY] = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
        const [deltaX, deltaY] = [touchStartX - touchEndX, touchStartY - touchEndY];
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            e.preventDefault();
            deltaX > 0 ? nextSlide() : prevSlide();
        }
        touchStartX = touchStartY = null;
    });


    try {
        document.body.dataset.initialLoad = 'true';
        initializeUIElements();
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        

        slides.forEach((slide, index) => {
            setSlideVisible(slide, index === 0);
        });

        const firstSlideElements = getAnimatedElements(slides[0]);
        if (firstSlideElements.length > 0) {
            gsap.fromTo(firstSlideElements, 
                { opacity: 0, y: 20 }, 
                { 
                    opacity: 1, 
                    y: 0, 
                    duration: 0.6, 
                    stagger: 0.1, 
                    ease: 'power3.out',
                    delay: 0.2
                }
            );
        }
        
        updateUIElements();
        document.body.removeAttribute('data-initial-load');
    } catch (error) {
        console.error('Failed to initialize presentation:', error);
        if (slides.length > 0) setSlideVisible(slides[0], true);
    }
});
