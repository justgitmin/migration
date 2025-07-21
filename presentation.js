document.addEventListener('DOMContentLoaded', () => {
    const slides = Array.from(document.querySelectorAll('.presentation-slide'));
        let currentSlide = 0;
    if (slides.length === 0) { console.warn('No slides found'); return; }

    let animatedElementsCache = new WeakMap();
    const getAnimatedElements = (slide) => {
        if (!animatedElementsCache.has(slide)) {
            animatedElementsCache.set(slide, slide.querySelectorAll('[data-animate], .animate-in, .animate-on-enter'));
        }
        return animatedElementsCache.get(slide);
    };
    const clearSlideCache = (slide) => slide && animatedElementsCache.has(slide) && animatedElementsCache.delete(slide);


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
        }
    };

    const goToSlide = (slideIndex, isInitial = false) => {
        if (slideIndex < 0 || slideIndex >= slides.length) return false;
        if (slideIndex === currentSlide && !isInitial) return true;

        const [oldSlide, newSlide] = [slides[currentSlide], slides[slideIndex]];
        if (typeof gsap !== 'undefined') gsap.killTweensOf('[data-animate]');
        
        const timeline = gsap.timeline({
            onComplete: () => {
                [oldSlide, newSlide].forEach(slide => {
                    if (slide) getAnimatedElements(slide).forEach(el => el.style.willChange = 'auto');
                });
            }
        });

        if (!isInitial && oldSlide && oldSlide !== newSlide) {
            const oldElements = getAnimatedElements(oldSlide);
            if (oldElements.length > 0) {
                oldElements.forEach(el => el.style.willChange = 'opacity, transform');
                timeline.to(oldElements, { opacity: 0, y: 20, stagger: 0.05, duration: 0.5, ease: 'power3.in' });
            }
        }

        timeline.call(() => {
            if(oldSlide && oldSlide !== newSlide) setSlideVisible(oldSlide, false);
            setSlideVisible(newSlide, true);
            currentSlide = slideIndex;
            updateUIElements();
        }, null, isInitial ? 0 : '+=0.2');

        const newElements = getAnimatedElements(newSlide);
        if (newElements.length > 0) {
            newElements.forEach(el => el.style.willChange = 'opacity, transform');
            timeline.fromTo(newElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out' });
        }
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
            const currentPageSpan = document.getElementById('presentation-current-page');
            const currentPageInput = document.getElementById('presentation-current-page-input');
            if (currentPageSpan) {
                currentPageSpan.textContent = (currentSlide + 1).toString();
            }
            if (currentPageInput) {
                currentPageInput.value = (currentSlide + 1).toString();
            }
        }


        if (prevButton) prevButton.disabled = currentSlide === 0;
        if (nextButton) nextButton.disabled = currentSlide === slides.length - 1;
    }


    let boundElements = new Set();
    

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
            dotsContainer.innerHTML = '';
            

            const pageIndicator = document.createElement('div');
            pageIndicator.className = 'flex items-center gap-1 text-white/80 text-sm font-medium';
            

            const currentPageContainer = document.createElement('div');
            currentPageContainer.className = 'inline-block';
            
            const currentPageSpan = document.createElement('span');
            currentPageSpan.id = 'presentation-current-page';
            currentPageSpan.className = 'cursor-pointer hover:text-white transition-colors duration-200 inline-block text-center min-w-[1.2em]';
            currentPageSpan.textContent = (currentSlide + 1).toString();
            currentPageSpan.setAttribute('aria-label', 'Click to jump to specific slide');
            
            const currentPageInput = document.createElement('input');
            currentPageInput.id = 'presentation-current-page-input';
            currentPageInput.type = 'number';
            currentPageInput.min = '1';
            currentPageInput.max = totalSlides.toString();
            currentPageInput.value = (currentSlide + 1).toString();
            currentPageInput.className = 'text-center bg-transparent text-white/80 hover:text-white border-none outline-none text-sm font-medium cursor-text min-w-[1.2em] appearance-none hidden';
            

            const style = document.createElement('style');
            style.textContent = `
                #presentation-current-page-input::-webkit-outer-spin-button,
                #presentation-current-page-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
            `;
            if (!document.querySelector('style[data-spinner-hide]')) {
                style.setAttribute('data-spinner-hide', 'true');
                document.head.appendChild(style);
            }
            

            currentPageSpan.addEventListener('click', () => {

                const spanWidth = currentPageSpan.offsetWidth;
                const spanHeight = currentPageSpan.offsetHeight;
                currentPageInput.style.width = spanWidth + 'px';
                currentPageInput.style.height = spanHeight + 'px';
                
                currentPageSpan.classList.add('hidden');
                currentPageInput.classList.remove('hidden');
                currentPageInput.focus();
                currentPageInput.select();
            });
            

            const handleInputComplete = () => {
                const newPage = parseInt(currentPageInput.value);
                if (newPage >= 1 && newPage <= totalSlides && newPage !== currentSlide + 1) {
                    goToSlide(newPage - 1);
                }
                currentPageInput.classList.add('hidden');
                currentPageSpan.classList.remove('hidden');
            };
            
            currentPageInput.addEventListener('blur', handleInputComplete);
            currentPageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInputComplete();
                } else if (e.key === 'Escape') {
                    currentPageInput.value = (currentSlide + 1).toString();
                    currentPageInput.classList.add('hidden');
                    currentPageSpan.classList.remove('hidden');
                }
            });
            
            currentPageContainer.appendChild(currentPageSpan);
            currentPageContainer.appendChild(currentPageInput);
            pageIndicator.appendChild(currentPageContainer);
            

            const separator = document.createElement('span');
            separator.className = 'text-white/50';
            separator.textContent = '/';
            pageIndicator.appendChild(separator);
            

            const totalPagesSpan = document.createElement('span');
            totalPagesSpan.className = 'text-white/80 inline-block text-center min-w-[1.2em]';
            totalPagesSpan.textContent = totalSlides.toString();
            pageIndicator.appendChild(totalPagesSpan);
            
            dotsContainer.appendChild(pageIndicator);
        }


        if (prevButton && !boundElements.has(prevButton)) {
            prevButton.addEventListener('click', prevSlide);
            prevButton.setAttribute('aria-label', 'Previous slide');
            boundElements.add(prevButton);
        }
        if (nextButton && !boundElements.has(nextButton)) {
            nextButton.addEventListener('click', nextSlide);
            nextButton.setAttribute('aria-label', 'Next slide');
            boundElements.add(nextButton);
        }
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
            'Home': firstSlide, 'End': lastSlide, 'Escape': firstSlide
        };
        
        if (keyMap[e.key]) handled = keyMap[e.key]();
        else if (/^[1-9]$/.test(e.key)) {
            const slideNum = parseInt(e.key) - 1;
            if (slideNum < slides.length) handled = goToSlide(slideNum);
        }
        
        if (handled) { e.preventDefault(); e.stopPropagation(); announceSlide(); }
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

    let wheelTimeout, isWheelActive = false;
    document.addEventListener('wheel', (e) => {
        if (isWheelActive) return;
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            if (Math.abs(e.deltaY) > 10) {
                isWheelActive = true;
                e.preventDefault();
                e.deltaY > 0 ? nextSlide() : prevSlide();
                setTimeout(() => isWheelActive = false, 800);
            }
        }, 100);
    }, { passive: false });


    window.presentationAPI = {
        goToSlide, nextSlide, prevSlide, firstSlide, lastSlide,
        getCurrentSlide: () => currentSlide,
        getTotalSlides: () => slides.length,
        refreshUI: updateUIElements,
        clearSlideCache,
        getCurrentSlideElement: () => slides[currentSlide],
        getAllSlides: () => [...slides],
        addLayoutClass: (className) => {
            if (slides[currentSlide]) {
                slides[currentSlide].classList.add(className);
                clearSlideCache(slides[currentSlide]);
            }
        },
        removeLayoutClass: (className) => {
            if (slides[currentSlide]) {
                slides[currentSlide].classList.remove(className);
                clearSlideCache(slides[currentSlide]);
            }
        },

        refreshSlides: () => {
            try {
                const newSlides = Array.from(document.querySelectorAll('.presentation-slide'));
                const [oldLength, newLength] = [slides.length, newSlides.length];
                animatedElementsCache = new WeakMap();
                slides.length = 0; slides.push(...newSlides);
                

                slides.forEach((slide, index) => {
                    setSlideVisible(slide, index === currentSlide);
                });
                
                if (newLength === 0) {
                    currentSlide = 0;
                } else if (currentSlide >= newLength) {
                    currentSlide = newLength - 1;
                } 

                if (slides[currentSlide]) {
                    setSlideVisible(slides[currentSlide], true);
                }
                
                boundElements.clear();
                initializeUIElements(); updateUIElements();
                return { slideCount: newLength, currentSlide, changed: oldLength !== newLength };
            } catch (error) {
                console.error('Error refreshing slides:', error);
                return { slideCount: slides.length, currentSlide, changed: false, error: error.message };
            }
        },

        restoreState: () => {
            try {
                slides.forEach((slide, index) => {
                    setSlideVisible(slide, index === currentSlide);
                });
                updateUIElements();
                return { success: true, currentSlide };
            } catch (error) {
                console.error('Error restoring state:', error);
                return { success: false, error: error.message };
            }
        }
    };


    try {

        currentSlide = 0;
        
        initializeUIElements();
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        

        if (slides.length > 0) {
            updateUIElements();

            slides.forEach((slide, index) => {
                setSlideVisible(slide, index === 0);
            });
            goToSlide(0, true);
        } else {
            console.warn('No slides found');
        }
        
        document.dispatchEvent(new CustomEvent('presentationReady', { detail: { slideCount: slides.length, currentSlide } }));
    } catch (error) {
        console.error('Failed to initialize:', error);
        if (slides.length > 0) setSlideVisible(slides[0], true);
    }
});
