/**
 * Factory Dashboard JavaScript
 * Handles authentication, API integration, language switching, and user interactions
 */

// Application State
const DashboardApp = {
    currentUser: null,
    currentLanguage: 'en',
    isLoading: false,
    dashboardData: null,
    
    // Initialize the dashboard
    init() {
        this.checkAuthentication();
        this.setupLanguageSystem();
        this.setupUserInterface();
        this.loadDashboardData();
        this.setupEventListeners();
    },

    // Check if user is authenticated
    async checkAuthentication() {
        const token = this.getAuthToken();
        if (!token) {
            this.redirectToLogin();
            return;
        }

        try {
            const response = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.valid) {
                    this.currentUser = result.user;
                    this.updateUserInterface();
                    this.trackAnalytics('dashboard_loaded', { user_id: this.currentUser.id });
                } else {
                    this.redirectToLogin();
                }
            } else {
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.redirectToLogin();
        }
    },

    // Get authentication token
    getAuthToken() {
        // Check URL params first (for OAuth redirects)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
            localStorage.setItem('authToken', urlToken);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return urlToken;
        }

        // Check localStorage
        return localStorage.getItem('authToken');
    },

    // Redirect to login page
    redirectToLogin() {
        window.location.href = '/login.html';
    },

    // Setup language system
    setupLanguageSystem() {
        this.currentLanguage = localStorage.getItem('angkor-compliance-lang') || 'en';
        this.loadLanguage(this.currentLanguage);
    },

    // Load and apply language
    loadLanguage(lang) {
        this.currentLanguage = lang;
        document.body.setAttribute('data-lang', lang);
        document.documentElement.setAttribute('lang', lang === 'kh' ? 'km' : 'en');
        
        // Update page title
        const title = lang === 'kh' 
            ? 'ផ្ទាំងគ្រប់គ្រងរោងចក្រ - អង្គរ កំព្លាយ៉ង់'
            : 'Factory Dashboard - Angkor Compliance';
        document.title = title;
        
        // Save preference
        localStorage.setItem('angkor-compliance-lang', lang);
        
        // Update all text elements
        this.updateTextElements();
        
        // Update language toggle button
        const toggleBtn = document.getElementById('languageToggle');
        if (toggleBtn) {
            const toggleText = toggleBtn.querySelector('span');
            if (toggleText) {
                toggleText.textContent = lang === 'kh' ? 'English' : 'ភាសាខ្មែរ';
            }
        }
    },

    // Update all text elements with data-* attributes
    updateTextElements() {
        const elements = document.querySelectorAll('[data-en], [data-km]');
        elements.forEach(element => {
            const enText = element.getAttribute('data-en');
            const khText = element.getAttribute('data-km');
            
            if (this.currentLanguage === 'kh' && khText) {
                element.textContent = khText;
            } else if (this.currentLanguage === 'en' && enText) {
                element.textContent = enText;
            }
        });
    },

    // Setup user interface
    setupUserInterface() {
        this.updateUserInterface();
        this.setupUserDropdown();
    },

    // Update user interface with current user data
    updateUserInterface() {
        if (!this.currentUser) return;

        // Update user name displays
        const userNameElements = document.querySelectorAll('#userName, #userNameWelcome');
        userNameElements.forEach(element => {
            element.textContent = this.currentUser.full_name || this.currentUser.email;
        });

        // Update user avatar
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar && this.currentUser.full_name) {
            const initials = this.currentUser.full_name.split(' ').map(name => name[0]).join('').toUpperCase();
            userAvatar.textContent = initials;
        }
    },

    // Setup user dropdown functionality
    setupUserDropdown() {
        const userMenu = document.getElementById('userMenu');
        const userDropdown = document.getElementById('userDropdown');
        const logoutBtn = document.getElementById('logoutBtn');

        if (userMenu && userDropdown) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.classList.remove('active');
            });

            // Prevent dropdown from closing when clicking inside
            userDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Logout functionality
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    },

    // Logout user
    async logout() {
        try {
            const token = this.getAuthToken();
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Clear local storage
        localStorage.removeItem('authToken');
        
        // Track analytics
        this.trackAnalytics('user_logout', { user_id: this.currentUser?.id });
        
        // Redirect to login
        this.redirectToLogin();
    },

    // Load dashboard data
    async loadDashboardData() {
        this.isLoading = true;
        this.showLoadingState();

        try {
            const token = this.getAuthToken();
            const response = await fetch('/api/dashboard/overview', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.dashboardData = await response.json();
                this.updateDashboardStats();
                this.loadNotifications();
                this.loadRecentActivity();
            } else {
                this.showError('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Error loading dashboard data');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    },

    // Update dashboard statistics
    updateDashboardStats() {
        if (!this.dashboardData) return;

        const stats = this.dashboardData.stats || {};
        
        // Update welcome section stats
        this.updateElement('activePermitsCount', stats.activePermits || 0);
        this.updateElement('openCapsCount', stats.openCaps || 0);
        this.updateElement('upcomingDeadlines', stats.upcomingDeadlines || 0);
        
        // Update dashboard cards
        this.updateElement('permitsTotal', stats.totalPermits || 0);
        this.updateElement('capsTotal', stats.totalCaps || 0);
        this.updateElement('documentsTotal', stats.totalDocuments || 0);
        this.updateElement('remindersTotal', stats.totalReminders || 0);
    },

    // Load notifications
    async loadNotifications() {
        try {
            const token = this.getAuthToken();
            const response = await fetch('/api/dashboard/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const notifications = await response.json();
                this.renderNotifications(notifications);
            } else {
                this.showNotificationError();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.showNotificationError();
        }
    },

    // Render notifications
    renderNotifications(notifications) {
        const notificationsList = document.getElementById('notificationsList');
        if (!notificationsList) return;

        if (!notifications || notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="notification-item">
                    <div class="notification-icon info">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title" data-en="No new notifications" data-km="មិនមានការជូនដំណឹងថ្មី">No new notifications</div>
                        <div class="notification-text" data-en="You're all caught up!" data-km="អ្នកបានឆ្លើយតបទាំងអស់ហើយ!">You're all caught up!</div>
                    </div>
                </div>
            `;
            this.updateTextElements();
            return;
        }

        const notificationsHTML = notifications.map(notification => {
            const iconClass = this.getNotificationIconClass(notification.type);
            const timeAgo = this.formatTimeAgo(notification.created_at);
            
            return `
                <div class="notification-item" data-id="${notification.id}">
                    <div class="notification-icon ${iconClass}">
                        <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-text">${notification.message}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');

        notificationsList.innerHTML = notificationsHTML;
        
        // Add click handlers
        notificationsList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const notificationId = item.dataset.id;
                this.handleNotificationClick(notificationId);
            });
        });
    },

    // Load recent activity
    async loadRecentActivity() {
        try {
            const token = this.getAuthToken();
            const response = await fetch('/api/dashboard/activity', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const activities = await response.json();
                this.renderRecentActivity(activities);
            } else {
                this.showActivityError();
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
            this.showActivityError();
        }
    },

    // Render recent activity
    renderRecentActivity(activities) {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        if (!activities || activities.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title" data-en="No recent activity" data-km="មិនមានសកម្មភាពថ្មីៗ">No recent activity</div>
                        <div class="activity-description" data-en="Start using the system to see activity here" data-km="ចាប់ផ្តើមប្រើប្រាស់ប្រព័ន្ធដើម្បីមើលសកម្មភាពនៅទីនេះ">Start using the system to see activity here</div>
                    </div>
                </div>
            `;
            this.updateTextElements();
            return;
        }

        const activitiesHTML = activities.map(activity => {
            const timeAgo = this.formatTimeAgo(activity.created_at);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');

        activityList.innerHTML = activitiesHTML;
    },

    // Setup event listeners
    setupEventListeners() {
        // Language toggle
        const languageToggle = document.getElementById('languageToggle');
        if (languageToggle) {
            languageToggle.addEventListener('click', () => {
                const newLang = this.currentLanguage === 'en' ? 'kh' : 'en';
                this.loadLanguage(newLang);
                this.trackAnalytics('language_changed', { language: newLang });
            });
        }

        // Dashboard card clicks
        document.querySelectorAll('.dashboard-card.clickable').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const href = card.getAttribute('href');
                this.navigateToScreen(href);
            });
        });

        // Quick action clicks
        document.querySelectorAll('.quick-action').forEach(action => {
            action.addEventListener('click', (e) => {
                e.preventDefault();
                const href = action.getAttribute('href');
                this.navigateToScreen(href);
            });
        });

        // Page refresh
        window.addEventListener('beforeunload', () => {
            this.trackAnalytics('page_unload', { duration: Date.now() - this.startTime });
        });
    },

    // Navigate to different screens
    navigateToScreen(screen) {
        this.trackAnalytics('navigation_click', { screen: screen });
        
        switch (screen) {
            case '#upload':
                this.showComingSoon('Upload Document', 'ការបញ្ចូលឯកសារ');
                break;
            case '#new-cap':
                this.showComingSoon('New CAP Wizard', 'អ្នកជំនាញបង្កើត CAP ថ្មី');
                break;
            case '#calendar':
                this.showComingSoon('Reminders Calendar', 'ប្រតិទិនរំលឹក');
                break;
            case '#reports':
                this.showComingSoon('Analytics & Reports', 'ការវិភាគ និងរបាយការណ៍');
                break;
            case '#permits':
                this.showComingSoon('Permits & Certificates', 'លិខិតអនុញ្ញាត និងសម្បុត្រ');
                break;
            case '#caps':
                this.showComingSoon('CAP Management', 'ការគ្រប់គ្រង CAP');
                break;
            case '#documents':
                this.showComingSoon('Document History', 'ប្រវត្តិឯកសារ');
                break;
            case '#reminders':
                this.showComingSoon('Reminders Calendar', 'ប្រតិទិនរំលឹក');
                break;
            case '#profile':
                this.showComingSoon('Profile & Settings', 'ប្រវត្តិរូប និងការកំណត់');
                break;
            case '#notifications':
                this.showComingSoon('Notifications Center', 'មជ្ឈមណ្ឌលការជូនដំណឹង');
                break;
            default:
                this.showComingSoon('Feature', 'មុខងារ');
        }
    },

    // Show coming soon notification
    showComingSoon(titleEn, titleKh) {
        const title = this.currentLanguage === 'kh' ? titleKh : titleEn;
        const message = this.currentLanguage === 'kh' 
            ? 'មុខងារនេះនឹងមានដល់ក្នុងពេលឆាប់ៗនេះ'
            : 'This feature is coming soon';
        
        this.showNotification(`${title} - ${message}`, 'info');
    },

    // Handle notification click
    handleNotificationClick(notificationId) {
        this.trackAnalytics('notification_clicked', { notification_id: notificationId });
        // Mark as read and potentially navigate to relevant screen
        this.markNotificationAsRead(notificationId);
    },

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        try {
            const token = this.getAuthToken();
            await fetch(`/api/dashboard/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    // Utility functions
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    },

    showLoadingState() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
            element.style.display = 'flex';
        });
    },

    hideLoadingState() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
            element.style.display = 'none';
        });
    },

    showError(message) {
        this.showNotification(message, 'error');
    },

    showNotificationError() {
        const notificationsList = document.getElementById('notificationsList');
        if (notificationsList) {
            notificationsList.innerHTML = `
                <div class="notification-item">
                    <div class="notification-icon danger">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title" data-en="Error loading notifications" data-km="បរាជ័យក្នុងការផ្ទុកការជូនដំណឹង">Error loading notifications</div>
                        <div class="notification-text" data-en="Please try refreshing the page" data-km="សូមព្យាយាមផ្ទុកទំព័រឡើងវិញ">Please try refreshing the page</div>
                    </div>
                </div>
            `;
            this.updateTextElements();
        }
    },

    showActivityError() {
        const activityList = document.getElementById('activityList');
        if (activityList) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title" data-en="Error loading activity" data-km="បរាជ័យក្នុងការផ្ទុកសកម្មភាព">Error loading activity</div>
                        <div class="activity-description" data-en="Please try refreshing the page" data-km="សូមព្យាយាមផ្ទុកទំព័រឡើងវិញ">Please try refreshing the page</div>
                    </div>
                </div>
            `;
            this.updateTextElements();
        }
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add some basic styling
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? 'var(--danger-red)' : 'var(--primary-gold)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: var(--shadow-hover);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    },

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return this.currentLanguage === 'kh' ? 'ទើបតែ' : 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return this.currentLanguage === 'kh' ? `${minutes} នាទីមុន` : `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return this.currentLanguage === 'kh' ? `${hours} ម៉ោងមុន` : `${hours}h ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return this.currentLanguage === 'kh' ? `${days} ថ្ងៃមុន` : `${days}d ago`;
        }
    },

    getNotificationIconClass(type) {
        switch (type) {
            case 'warning': return 'warning';
            case 'error': return 'danger';
            case 'success': return 'info';
            default: return 'info';
        }
    },

    getNotificationIcon(type) {
        switch (type) {
            case 'warning': return 'fa-exclamation-triangle';
            case 'error': return 'fa-times-circle';
            case 'success': return 'fa-check-circle';
            case 'reminder': return 'fa-bell';
            case 'document': return 'fa-file-alt';
            case 'cap': return 'fa-clipboard-check';
            default: return 'fa-info-circle';
        }
    },

    getActivityIcon(type) {
        switch (type) {
            case 'document_upload': return 'fa-upload';
            case 'cap_created': return 'fa-plus-circle';
            case 'permit_renewed': return 'fa-certificate';
            case 'reminder_set': return 'fa-bell';
            case 'login': return 'fa-sign-in-alt';
            default: return 'fa-clock';
        }
    },

    // Analytics tracking
    trackAnalytics(event, data = {}) {
        try {
            // Track to console for development
            console.log('Analytics:', event, data);
            
            // In production, send to analytics service
            if (typeof gtag !== 'undefined') {
                gtag('event', event, data);
            }
            
            // Send to backend analytics
            if (navigator.sendBeacon) {
                const payload = JSON.stringify({
                    event: event,
                    data: data,
                    timestamp: new Date().toISOString(),
                    user_id: this.currentUser?.id,
                    session_id: this.getSessionId()
                });
                
                navigator.sendBeacon('/api/analytics', payload);
            }
        } catch (error) {
            console.error('Analytics error:', error);
        }
    },

    getSessionId() {
        let sessionId = sessionStorage.getItem('angkor-compliance-session');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('angkor-compliance-session', sessionId);
        }
        return sessionId;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    DashboardApp.startTime = Date.now();
    DashboardApp.init();
}); 