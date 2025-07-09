/**
 * Angkor Compliance Landing Page JavaScript
 * Handles language switching, user interactions, and analytics
 */

// Application state
const AppState = {
    currentLanguage: 'en',
    isLoading: false,
    userPreferences: {
        language: localStorage.getItem('angkor-compliance-lang') || 'en',
        theme: localStorage.getItem('angkor-compliance-theme') || 'light'
    }
};

// Language content and utilities
const LanguageManager = {
    // Initialize language system
    init() {
        this.loadLanguage(AppState.userPreferences.language);
        this.setupLanguageToggle();
        this.detectUserLanguage();
    },

    // Load and apply language
    loadLanguage(lang) {
        AppState.currentLanguage = lang;
        document.body.setAttribute('data-lang', lang);
        document.documentElement.setAttribute('lang', lang === 'kh' ? 'km' : 'en');
        
        // Update page title
        const title = lang === 'kh' 
            ? 'Angkor Compliance - ប្រព័ន្ធគ្រប់គ្រងការអនុលោមតាមច្បាប់សម្រាប់រោងចក្រកាត់ដេរ'
            : 'Angkor Compliance - Garment Factory Compliance Management';
        document.title = title;
        
        // Save preference
        localStorage.setItem('angkor-compliance-lang', lang);
        
        // Update all text elements
        this.updateTextElements();
        
        // Analytics
        Analytics.track('language_changed', { language: lang });
    },

    // Update all text elements with data-* attributes
    updateTextElements() {
        const elements = document.querySelectorAll('[data-en], [data-kh]');
        elements.forEach(element => {
            const enText = element.getAttribute('data-en');
            const khText = element.getAttribute('data-kh');
            
            if (AppState.currentLanguage === 'kh' && khText) {
                element.textContent = khText;
            } else if (AppState.currentLanguage === 'en' && enText) {
                element.textContent = enText;
            }
        });
    },

    // Setup language toggle button
    setupLanguageToggle() {
        const toggleBtn = document.getElementById('languageToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const newLang = AppState.currentLanguage === 'en' ? 'kh' : 'en';
                this.loadLanguage(newLang);
                
                // Add visual feedback
                this.showLanguageChangeNotification(newLang);
            });
        }
    },

    // Detect user's preferred language
    detectUserLanguage() {
        if (!localStorage.getItem('angkor-compliance-lang')) {
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang.includes('km') || browserLang.includes('kh')) {
                this.loadLanguage('kh');
            }
        }
    },

    // Show language change notification
    showLanguageChangeNotification(lang) {
        const notification = document.createElement('div');
        notification.className = 'language-notification';
        notification.textContent = lang === 'kh' 
            ? 'ភាសាត្រូវបានប្តូរទៅជាខ្មែរ' 
            : 'Language changed to English';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Navigation and scroll management
const NavigationManager = {
    init() {
        this.setupSmoothScrolling();
        this.setupScrollSpy();
        this.setupMobileNavigation();
    },

    // Setup smooth scrolling for anchor links
    setupSmoothScrolling() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerOffset = 80;
                    const elementPosition = targetElement.offsetTop;
                    const offsetPosition = elementPosition - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Analytics
                    Analytics.track('navigation_click', { section: targetId });
                }
            }
        });
    },

    // Setup scroll spy for navigation highlighting
    setupScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('a[href^="#"]');
        
        const observerOptions = {
            root: null,
            rootMargin: '-80px 0px -80px 0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const activeLink = document.querySelector(`a[href="#${entry.target.id}"]`);
                    if (activeLink) {
                        navLinks.forEach(link => link.classList.remove('active'));
                        activeLink.classList.add('active');
                    }
                }
            });
        }, observerOptions);
        
        sections.forEach(section => observer.observe(section));
    },

    // Setup mobile navigation
    setupMobileNavigation() {
        // Handle mobile menu toggle if needed
        const mobileToggle = document.querySelector('.mobile-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                document.body.classList.toggle('mobile-nav-open');
            });
        }
    }
};

// Form handling and validation
const FormManager = {
    init() {
        this.setupFormValidation();
        this.setupFormSubmission();
    },

    // Setup form validation
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    this.showFormErrors(form);
                }
            });
        });
    },

    // Validate form fields
    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        return isValid;
    },

    // Show form errors
    showFormErrors(form) {
        const errorFields = form.querySelectorAll('.error');
        if (errorFields.length > 0) {
            errorFields[0].focus();
            this.showNotification('Please fill in all required fields', 'error');
        }
    },

    // Setup form submission
    setupFormSubmission() {
        // Handle demo requests, contact forms, etc.
        const demoButtons = document.querySelectorAll('a[href="#demo"]');
        demoButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.requestDemo();
            });
        });
        
        const contactButtons = document.querySelectorAll('a[href="#contact"]');
        contactButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.showContactForm();
            });
        });
    },

    // Request demo
    requestDemo() {
        // In a real app, this would open a demo request form
        Analytics.track('demo_requested');
        this.showNotification(
            AppState.currentLanguage === 'kh' 
                ? 'សូមទាក់ទងយើងខ្ញុំសម្រាប់ការបង្ហាញប្រព័ន្ធ' 
                : 'Please contact us for a system demonstration'
        );
    },

    // Show contact form
    showContactForm() {
        // In a real app, this would open a contact form modal
        Analytics.track('contact_requested');
        this.showNotification(
            AppState.currentLanguage === 'kh' 
                ? 'សូមទាក់ទងយើងខ្ញុំតាមរយៈអុីមែល support@angkorcompliance.com' 
                : 'Please contact us at support@angkorcompliance.com'
        );
    },

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
};

// Performance and loading management
const PerformanceManager = {
    init() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.monitorPerformance();
    },

    // Setup lazy loading for images
    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    },

    // Setup image optimization
    setupImageOptimization() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
            
            img.addEventListener('error', () => {
                img.classList.add('error');
                // Fallback to placeholder
                img.src = this.getPlaceholderImage(img);
            });
        });
    },

    // Get placeholder image
    getPlaceholderImage(img) {
        const width = img.offsetWidth || 400;
        const height = img.offsetHeight || 300;
        return `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#64748b">Image</text></svg>`;
    },

    // Monitor performance
    monitorPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        Analytics.track('page_performance', {
                            loadTime: perfData.loadEventEnd - perfData.fetchStart,
                            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
                            firstPaint: performance.getEntriesByType('paint')[0]?.startTime
                        });
                    }
                }, 1000);
            });
        }
    }
};

// Analytics and tracking
const Analytics = {
    init() {
        this.setupPageTracking();
        this.setupClickTracking();
        this.setupScrollTracking();
    },

    // Track events
    track(eventName, data = {}) {
        try {
            // In a real app, this would send to Google Analytics, Mixpanel, etc.
            console.log('Analytics Event:', eventName, data);
            
            // Example: Send to Google Analytics
            if (typeof window.gtag !== 'undefined') {
                window.gtag('event', eventName, data);
            }
            
            // Example: Send to custom analytics endpoint
            this.sendToAnalytics(eventName, data);
        } catch (error) {
            console.error('Analytics error:', error);
        }
    },

    // Setup page tracking
    setupPageTracking() {
        this.track('page_view', {
            page: window.location.pathname,
            language: AppState.currentLanguage,
            userAgent: navigator.userAgent
        });
    },

    // Setup click tracking
    setupClickTracking() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.btn, button');
            if (button) {
                const buttonText = button.textContent.trim();
                const buttonClass = button.className;
                
                this.track('button_click', {
                    text: buttonText,
                    class: buttonClass,
                    page: window.location.pathname
                });
            }
        });
    },

    // Setup scroll tracking
    setupScrollTracking() {
        let scrollDepth = 0;
        const milestones = [25, 50, 75, 100];
        
        window.addEventListener('scroll', () => {
            const scrollPercentage = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            milestones.forEach(milestone => {
                if (scrollPercentage >= milestone && scrollDepth < milestone) {
                    scrollDepth = milestone;
                    this.track('scroll_depth', {
                        depth: milestone,
                        page: window.location.pathname
                    });
                }
            });
        });
    },

    // Send to analytics endpoint
    sendToAnalytics(eventName, data) {
        // In a real app, this would send to your analytics service
        if (navigator.sendBeacon) {
            const payload = JSON.stringify({
                event: eventName,
                data: data,
                timestamp: new Date().toISOString(),
                session: this.getSessionId()
            });
            
            navigator.sendBeacon('/api/analytics', payload);
        }
    },

    // Get or create session ID
    getSessionId() {
        let sessionId = sessionStorage.getItem('angkor-compliance-session');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('angkor-compliance-session', sessionId);
        }
        return sessionId;
    }
};

// Accessibility enhancements
const AccessibilityManager = {
    init() {
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
        this.setupFocusManagement();
    },

    // Setup keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Handle escape key
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    this.closeModal(activeModal);
                }
            }
            
            // Handle tab navigation
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
        });
    },

    // Setup screen reader support
    setupScreenReaderSupport() {
        // Add aria-live regions for dynamic content
        const announcements = document.createElement('div');
        announcements.setAttribute('aria-live', 'polite');
        announcements.setAttribute('aria-atomic', 'true');
        announcements.className = 'sr-only';
        announcements.id = 'announcements';
        document.body.appendChild(announcements);
    },

    // Setup focus management
    setupFocusManagement() {
        // Ensure focus is visible
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    },

    // Announce to screen readers
    announce(message) {
        const announcements = document.getElementById('announcements');
        if (announcements) {
            announcements.textContent = message;
        }
    },

    // Handle tab navigation
    handleTabNavigation(e) {
        const focusableElements = document.querySelectorAll(
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }
};

// Error handling and monitoring
const ErrorManager = {
    init() {
        this.setupErrorHandling();
        this.setupNetworkMonitoring();
    },

    // Setup error handling
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('JavaScript error:', e.error);
            Analytics.track('javascript_error', {
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                column: e.colno
            });
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            Analytics.track('promise_rejection', {
                reason: e.reason
            });
        });
    },

    // Setup network monitoring
    setupNetworkMonitoring() {
        if ('navigator' in window && 'onLine' in navigator) {
            window.addEventListener('online', () => {
                this.showNetworkStatus('online');
            });
            
            window.addEventListener('offline', () => {
                this.showNetworkStatus('offline');
            });
        }
    },

    // Show network status
    showNetworkStatus(status) {
        const message = status === 'online' 
            ? (AppState.currentLanguage === 'kh' ? 'ការតភ្ជាប់អុីនធឺណិតត្រូវបានស្តារ' : 'Internet connection restored')
            : (AppState.currentLanguage === 'kh' ? 'មិនមានការតភ្ជាប់អុីនធឺណិត' : 'No internet connection');
        
        FormManager.showNotification(message, status === 'online' ? 'success' : 'warning');
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize all managers
        LanguageManager.init();
        NavigationManager.init();
        FormManager.init();
        PerformanceManager.init();
        Analytics.init();
        AccessibilityManager.init();
        ErrorManager.init();
        
        // Add loading complete class
        document.body.classList.add('loaded');
        
        // Analytics
        Analytics.track('app_initialized');
        
        console.log('Angkor Compliance Landing Page initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        Analytics.track('initialization_error', { error: error.message });
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LanguageManager,
        NavigationManager,
        FormManager,
        PerformanceManager,
        Analytics,
        AccessibilityManager,
        ErrorManager
    };
} 