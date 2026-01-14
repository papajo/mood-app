/**
 * Performance utilities for MoodMingle
 */

// Lazy load images
export const lazyLoadImage = (imgElement, src) => {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        imageObserver.observe(imgElement);
    } else {
        // Fallback for older browsers
        imgElement.src = src;
    }
};

// Debounce function for search/input
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Throttle function for scroll/resize
export const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
    if (import.meta.env.DEV) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }
    return fn();
};

// Preload critical resources
export const preloadResource = (href, as) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
};
