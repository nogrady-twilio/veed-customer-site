// Main JavaScript for VEED.io replica with comprehensive Segment tracking
// Handles authentication, user interactions, and B2B SaaS analytics

class VeedApp {
    constructor() {
        this.currentUser = null;
        this.currentPlan = 'free';
        this.projectCount = 0;
        this.sessionStartTime = Date.now();
        
        this.init();
    }

    init() {
        this.loadUserState();
        this.setupEventListeners();
        this.updateUIBasedOnAuth();
        
        // Track initial page load
        if (window.veedAnalytics) {
            window.veedAnalytics.trackPageView();
        }
    }

    // Load user state from localStorage
    loadUserState() {
        const userData = localStorage.getItem('veed_user_data');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.currentPlan = localStorage.getItem('user_plan') || 'free';
                this.projectCount = parseInt(localStorage.getItem('total_projects') || '0');
            } catch (e) {
                console.error('Error loading user state:', e);
            }
        }
    }

    // Setup event listeners for various interactions
    setupEventListeners() {
        // Modal event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Pricing toggle
        const annualToggle = document.getElementById('annual-toggle');
        if (annualToggle) {
            annualToggle.addEventListener('change', (e) => {
                this.trackPricingToggle(e.target.checked);
            });
        }

        // Form submissions
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup(e);
            });
        }

        // Track engagement metrics
        this.setupEngagementTracking();
    }

    // Setup engagement tracking (scroll, time on page, clicks)
    setupEngagementTracking() {
        let engagementScore = 0;
        let interactionCount = 0;
        let highEngagementTracked = false;

        // Track meaningful interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.feature-card')) {
                interactionCount++;
                engagementScore += 1;

                // Track high engagement threshold only once
                if (interactionCount === 5 && !highEngagementTracked) {
                    this.trackHighEngagement();
                    highEngagementTracked = true;
                }
            }
        });

        // Track meaningful time-on-page milestones only
        setTimeout(() => this.trackTimeOnPage('1_minute'), 60000);
        setTimeout(() => this.trackTimeOnPage('3_minutes'), 180000);
        setTimeout(() => this.trackTimeOnPage('5_minutes'), 300000);

        // Track before leaving
        window.addEventListener('beforeunload', () => {
            this.trackSessionMetrics();
        });
    }

    // Authentication Methods
    handleLogin(event) {
        const form = event.target;
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;

        if (this.validateLoginForm(email, password)) {
            this.performLogin(email);
        }
    }

    handleSignup(event) {
        const form = event.target;
        const userData = {
            name: form.querySelector('#signup-name').value,
            email: form.querySelector('#signup-email').value,
            password: form.querySelector('#signup-password').value,
            company: form.querySelector('#signup-company').value
        };

        if (this.validateSignupForm(userData)) {
            this.performSignup(userData);
        }
    }

    validateLoginForm(email, password) {
        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }

        return true;
    }

    validateSignupForm(userData) {
        if (!userData.name || !userData.email || !userData.password) {
            this.showNotification('Please fill in all required fields', 'error');
            return false;
        }

        if (!this.isValidEmail(userData.email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }

        if (userData.password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return false;
        }

        return true;
    }

    performLogin(email) {
        // Simulate login process
        this.showLoading('Logging in...');
        
        setTimeout(() => {
            // Get existing user ID if user has logged in before, otherwise generate new one
            const existingUserData = JSON.parse(localStorage.getItem('veed_user_data') || '{}');
            const userId = existingUserData.userId || (window.veedAnalytics ? window.veedAnalytics.generateRandomUserId() : this.generateRandomUserId());
            
            this.currentUser = { 
                email: email, 
                name: existingUserData.name || email.split('@')[0],
                loginDate: new Date().toISOString(),
                userId: userId,
                company: existingUserData.company || null
            };
            
            localStorage.setItem('veed_user_data', JSON.stringify(this.currentUser));
            
            // Track login with Segment - pass the userId
            if (window.veedAnalytics) {
                window.veedAnalytics.trackLogin(email, userId);
            }

            this.updateUIBasedOnAuth();
            this.closeModal('login-modal');
            this.hideLoading();
            this.showNotification('Welcome back!', 'success');
        }, 1500);
    }

    performSignup(userData) {
        // Simulate signup process
        this.showLoading('Creating your account...');
        
        setTimeout(() => {
            // Generate a unique 5-character user ID
            const userId = window.veedAnalytics ? window.veedAnalytics.generateRandomUserId() : this.generateRandomUserId();
            
            // Add the generated user ID to the user data
            const userDataWithId = {
                ...userData,
                signupDate: new Date().toISOString(),
                plan: 'free',
                userId: userId
            };
            
            this.currentUser = userDataWithId;
            
            localStorage.setItem('veed_user_data', JSON.stringify(this.currentUser));
            localStorage.setItem('user_plan', 'free');
            
            // Track signup with Segment - pass the complete user data with ID
            if (window.veedAnalytics) {
                window.veedAnalytics.trackSignup(userDataWithId);
            }

            this.updateUIBasedOnAuth();
            this.closeModal('signup-modal');
            this.hideLoading();
            this.showNotification('Account created successfully!', 'success');
            
            // Start onboarding flow
            this.startOnboardingFlow();
        }, 2000);
    }

    // Onboarding Flow
    startOnboardingFlow() {
        setTimeout(() => {
            if (window.veedAnalytics) {
                window.veedAnalytics.trackOnboardingMilestone('account_created');
            }
            
            this.showOnboardingTooltip();
        }, 1000);
    }

    showOnboardingTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'onboarding-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <h3>Welcome to VEED! 🎉</h3>
                <p>Let's get started by creating your first video project.</p>
                <button onclick="startVideoEditor(); this.closest('.onboarding-tooltip').remove();" class="btn-primary">
                    Create First Project
                </button>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Track onboarding tooltip shown
        if (window.veedAnalytics) {
            analytics.track('Onboarding Tooltip Shown', {
                user_id: this.currentUser?.email,
                tooltip_type: 'welcome_message',
                step: 1
            });
        }
    }

    // Plan Selection and Upgrade
    selectPlan(planType) {
        if (window.veedAnalytics) {
            window.trackPlanSelection(planType);
        }

        if (planType === 'free') {
            this.showNotification('You\'re already on the free plan!', 'info');
            return;
        }

        // Track upgrade intent
        analytics.track('Upgrade Intent', {
            user_id: this.currentUser?.email,
            target_plan: planType,
            current_plan: this.currentPlan,
            upgrade_source: 'pricing_page'
        });

        if (!this.currentUser) {
            this.showSignupModal();
            // Track conversion funnel
            analytics.track('Signup Prompted', {
                trigger: 'plan_selection',
                target_plan: planType
            });
            return;
        }

        this.showUpgradeModal(planType);
    }

    showUpgradeModal(planType) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'upgrade-modal';
        
        const plans = {
            pro: { name: 'Pro', price: 24, features: ['2 hours/month', '4K export', 'No watermark'] },
            business: { name: 'Business', price: 59, features: ['10 hours/month', 'Team collaboration', 'Brand kit'] }
        };
        
        const plan = plans[planType];
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeModal('upgrade-modal')">&times;</span>
                <h2>Upgrade to ${plan.name}</h2>
                <div class="upgrade-details">
                    <div class="price">$${plan.price}/month</div>
                    <ul class="features">
                        ${plan.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                    </ul>
                    <div class="billing-options">
                        <label>
                            <input type="radio" name="billing" value="monthly" checked>
                            Monthly billing
                        </label>
                        <label>
                            <input type="radio" name="billing" value="annual">
                            Annual billing (Save 40%)
                        </label>
                    </div>
                    <button class="btn-primary" onclick="processUpgrade('${planType}')">
                        Start Free Trial
                    </button>
                </div>
                <p>14-day free trial, then $${plan.price}/month. Cancel anytime.</p>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    processUpgrade(planType) {
        this.showLoading('Processing upgrade...');
        
        // Simulate upgrade process
        setTimeout(() => {
            const billingCycle = document.querySelector('input[name="billing"]:checked').value;
            
            const upgradeData = {
                plan: planType,
                billingCycle: billingCycle,
                method: 'upgrade_modal',
                fromTrial: false
            };

            // Update user plan
            this.currentPlan = planType;
            localStorage.setItem('user_plan', planType);

            // Track with Segment
            if (window.veedAnalytics) {
                window.veedAnalytics.trackSubscriptionUpgrade(upgradeData);
            }

            this.closeModal('upgrade-modal');
            this.hideLoading();
            this.showNotification(`Successfully upgraded to ${planType}!`, 'success');
            this.updateUIBasedOnAuth();
            
            // Track successful conversion
            analytics.track('Conversion Completed', {
                user_id: this.currentUser?.email,
                plan: planType,
                billing_cycle: billingCycle,
                conversion_value: planType === 'pro' ? 24 : 59,
                conversion_type: 'freemium_to_paid'
            });
        }, 2000);
    }

    // Video Editor Functions
    startVideoEditor() {
        // Track feature usage
        if (window.veedAnalytics) {
            window.veedAnalytics.trackFeatureUsage('video_editor', {
                entry_point: 'hero_cta',
                user_plan: this.currentPlan
            });
        }

        if (!this.currentUser) {
            this.showSignupModal();
            analytics.track('Signup Prompted', {
                trigger: 'editor_access',
                feature: 'video_editor'
            });
            return;
        }

        this.openEditor();
    }

    openEditor() {
        const modal = document.getElementById('editor-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // Track editor opened
            analytics.track('Editor Opened', {
                user_id: this.currentUser?.email,
                session_id: window.veedAnalytics?.sessionId,
                user_plan: this.currentPlan,
                projects_created: this.projectCount
            });
        }
    }

    closeEditor() {
        const modal = document.getElementById('editor-modal');
        if (modal) {
            modal.style.display = 'none';
            
            // Track editor closed
            analytics.track('Editor Closed', {
                user_id: this.currentUser?.email,
                session_duration: Date.now() - this.sessionStartTime
            });
        }
    }

    saveProject() {
        if (!this.currentUser) return;

        const projectName = document.getElementById('project-name').value;
        const projectId = 'proj_' + Date.now();
        
        this.projectCount++;
        localStorage.setItem('total_projects', this.projectCount.toString());

        // Track project creation
        if (window.veedAnalytics) {
            window.veedAnalytics.trackProjectCreated({
                id: projectId,
                name: projectName,
                type: 'video_editing',
                method: 'manual'
            });
        }

        this.showNotification('Project saved successfully!', 'success');
        
        // Check for onboarding milestones
        if (this.projectCount === 1) {
            if (window.veedAnalytics) {
                window.veedAnalytics.trackOnboardingMilestone('first_project_created');
            }
        }
    }

    uploadVideo() {
        // Track upload intent
        analytics.track('Upload Intent', {
            user_id: this.currentUser?.email,
            source: 'hero_button',
            user_plan: this.currentPlan
        });

        if (!this.currentUser) {
            this.showSignupModal();
            return;
        }

        // Simulate file upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processVideoUpload(file);
            }
        };
        input.click();
    }

    processVideoUpload(file) {
        // Track actual upload
        analytics.track('Video Uploaded', {
            user_id: this.currentUser?.email,
            file_size_mb: Math.round(file.size / (1024 * 1024)),
            file_type: file.type,
            user_plan: this.currentPlan
        });

        this.showNotification('Video uploaded successfully!', 'success');
        this.openEditor();
    }

    exportVideo() {
        if (!this.currentUser) return;

        // Check plan limits
        const exportLimits = { free: 1, pro: 50, business: 200 };
        const todayExports = parseInt(localStorage.getItem('exports_today') || '0');
        
        if (todayExports >= exportLimits[this.currentPlan] && this.currentPlan === 'free') {
            this.showUpgradePrompt('export_limit');
            return;
        }

        // Simulate export process
        this.showLoading('Exporting video...');
        
        setTimeout(() => {
            const exportData = {
                projectId: 'proj_current',
                duration: 120,
                quality: this.currentPlan === 'free' ? '720p' : '4K',
                format: 'mp4',
                fileSize: 45,
                processingTime: 30,
                hasSubtitles: true,
                effectsCount: 3,
                isCollaborative: false
            };

            if (window.veedAnalytics) {
                window.veedAnalytics.trackVideoExport(exportData);
            }

            // Update export count
            localStorage.setItem('exports_today', (todayExports + 1).toString());
            
            this.hideLoading();
            this.showNotification('Video exported successfully!', 'success');
        }, 3000);
    }

    // Team Collaboration
    inviteCollaborator() {
        if (this.currentPlan === 'free') {
            this.showUpgradePrompt('collaboration');
            return;
        }

        const email = prompt('Enter collaborator\'s email:');
        if (email && this.isValidEmail(email)) {
            this.sendInvite(email);
        }
    }

    sendInvite(email) {
        const inviteData = {
            email: email,
            role: 'editor',
            projectId: 'proj_current'
        };

        if (window.veedAnalytics) {
            window.veedAnalytics.trackUserInvited(inviteData);
        }

        this.showNotification(`Invitation sent to ${email}!`, 'success');
    }

    // UI Helper Methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    switchModal(from, to) {
        this.closeModal(from);
        this.showModal(to);
    }

    showLoginModal() {
        this.showModal('login-modal');
        analytics.track('Login Modal Opened', {
            source: 'header_button'
        });
    }

    showSignupModal() {
        this.showModal('signup-modal');
        analytics.track('Signup Modal Opened', {
            source: 'conversion_prompt'
        });
    }

    showUpgradePrompt(reason) {
        analytics.track('Upgrade Prompt Shown', {
            user_id: this.currentUser?.email,
            reason: reason,
            current_plan: this.currentPlan
        });

        const message = {
            export_limit: 'Upgrade to Pro for unlimited exports!',
            collaboration: 'Upgrade to Business for team collaboration!',
            watermark: 'Upgrade to Pro to remove watermarks!'
        };

        if (confirm(message[reason] + ' Upgrade now?')) {
            const targetPlan = reason === 'collaboration' ? 'business' : 'pro';
            this.selectPlan(targetPlan);
        }
    }

    updateUIBasedOnAuth() {
        const navActions = document.querySelector('.nav-actions');
        
        if (this.currentUser && navActions) {
            navActions.innerHTML = `
                <div class="user-menu">
                    <span class="user-name">Hi, ${this.currentUser.name}!</span>
                    <span class="user-id">ID: ${this.currentUser.userId}</span>
                    <span class="user-plan">${this.currentPlan}</span>
                    <button class="btn-secondary" onclick="app.logout()">Logout</button>
                </div>
            `;
        }
    }

    logout() {
        // Track logout event before resetting
        analytics.track('Logged Out', {
            sessionDuration: Date.now() - this.sessionStartTime,
            plan: this.currentPlan
        });

        // Reset analytics to clear user context
        analytics.reset();

        // Clear application state
        this.currentUser = null;
        this.currentPlan = 'free';
        localStorage.removeItem('veed_user_data');
        localStorage.removeItem('veed_user_id');
        localStorage.removeItem('veed_user_email');
        localStorage.removeItem('user_plan');
        
        this.updateUIBasedOnAuth();
        this.showNotification('Logged out successfully', 'success');

        console.log('🎯 Segment tracking - Logout:');
        console.log('   📊 Track call: Logged Out');
        console.log('   🔄 Analytics reset');
    }

    // Utility Methods
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Generate a random 5-character alphanumeric user ID
    generateRandomUserId() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showLoading(message = 'Loading...') {
        const loading = document.createElement('div');
        loading.id = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        
        Object.assign(loading.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10000',
            color: 'white',
            fontSize: '18px',
            textAlign: 'center'
        });

        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.remove();
        }
    }

    // Analytics Helper Methods
    trackPricingToggle(isAnnual) {
        analytics.track('Pricing Toggle Changed', {
            billing_type: isAnnual ? 'annual' : 'monthly',
            user_id: this.currentUser?.email,
            page: 'pricing_section'
        });
    }

    trackHighEngagement() {
        analytics.track('High Engagement', {
            engagementType: 'multiple_interactions',
            interactionCount: 5,
            page: 'VEED Homepage'
        });
    }

    trackTimeOnPage(milestone) {
        analytics.track('Page Engaged', {
            milestone: milestone,
            page: 'VEED Homepage',
            engagementLevel: milestone === '5_minutes' ? 'high' : 'medium'
        });
    }

    trackSessionMetrics() {
        const sessionDuration = Date.now() - this.sessionStartTime;
        analytics.track('Session Metrics', {
            user_id: this.currentUser?.email,
            session_duration_ms: sessionDuration,
            session_duration_minutes: Math.round(sessionDuration / 60000),
            page_views: 1,
            interactions: document.querySelectorAll('.clicked').length
        });
    }
}

// Video Editor Specific Functions
function switchTool(toolName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tool-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Track tool usage
    analytics.track('Editor Tool Selected', {
        tool_name: toolName,
        user_id: window.app?.currentUser?.email,
        user_plan: window.app?.currentPlan
    });
    
    // Update tool content (simplified for demo)
    const toolContent = document.getElementById('tool-content');
    if (toolContent) {
        toolContent.innerHTML = `<div class="tool-placeholder">
            <h3>${toolName.charAt(0).toUpperCase() + toolName.slice(1)} Tools</h3>
            <p>Tool interface for ${toolName} would be here.</p>
        </div>`;
    }
}

function addElement(elementType) {
    analytics.track('Editor Element Added', {
        element_type: elementType,
        user_id: window.app?.currentUser?.email,
        user_plan: window.app?.currentPlan
    });
    
    window.app?.showNotification(`${elementType} added to timeline`, 'success');
}

function playVideo() {
    analytics.track('Video Playback', {
        action: 'play',
        user_id: window.app?.currentUser?.email
    });
}

function uploadVideoFile() {
    if (window.app) {
        window.app.uploadVideo();
    }
}

// Global functions for HTML onclick handlers
function showLoginModal() {
    if (window.app) {
        window.app.showLoginModal();
    }
}

function showSignupModal() {
    if (window.app) {
        window.app.showSignupModal();
    }
}

function closeModal(modalId) {
    if (window.app) {
        window.app.closeModal(modalId);
    }
}

function switchModal(from, to) {
    if (window.app) {
        window.app.switchModal(from, to);
    }
}

function startVideoEditor() {
    if (window.app) {
        window.app.startVideoEditor();
    }
}

function uploadVideo() {
    if (window.app) {
        window.app.uploadVideo();
    }
}

function selectPlan(planType) {
    if (window.app) {
        window.app.selectPlan(planType);
    }
}

function processUpgrade(planType) {
    if (window.app) {
        window.app.processUpgrade(planType);
    }
}

function saveProject() {
    if (window.app) {
        window.app.saveProject();
    }
}

function exportVideo() {
    if (window.app) {
        window.app.exportVideo();
    }
}

function inviteCollaborator() {
    if (window.app) {
        window.app.inviteCollaborator();
    }
}

function closeEditor() {
    if (window.app) {
        window.app.closeEditor();
    }
}

// New page-specific functions
function filterTemplates(category) {
    // Track template filter usage
    analytics.track('Template Filtered', {
        category: category,
        pageSection: 'templates'
    });

    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter template cards (simplified for demo)
    const cards = document.querySelectorAll('.template-card');
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    if (window.app) {
        window.app.showNotification(`Showing ${category === 'all' ? 'all' : category} templates`, 'info');
    }
}

function selectTemplate(templateId) {
    // Track template selection
    analytics.track('Template Selected', {
        templateId: templateId,
        selectionContext: 'template_grid'
    });

    if (!window.app?.currentUser) {
        window.app?.showSignupModal();
        analytics.track('Signup Prompted', {
            trigger: 'template_selection',
            template_id: templateId
        });
        return;
    }

    // Simulate template usage
    analytics.track('Template Usage Started', {
        template_id: templateId,
        user_id: window.app?.currentUser?.email,
        user_plan: window.app?.currentPlan
    });

    if (window.app) {
        window.app.showNotification(`Loading ${templateId} template...`, 'success');
        setTimeout(() => {
            window.app.startVideoEditor();
        }, 1000);
    }
}

function viewAllTemplates() {
    analytics.track('Browse All Templates Clicked', {
        user_id: window.app?.currentUser?.email,
        current_filters: 'all'
    });

    if (window.app) {
        window.app.showNotification('Loading template library...', 'info');
    }
}

function createBrandKit() {
    analytics.track('Brand Kit Creation Started', {
        user_id: window.app?.currentUser?.email,
        user_plan: window.app?.currentPlan,
        entry_point: 'brand_kit_section'
    });

    if (!window.app?.currentUser) {
        window.app?.showSignupModal();
        return;
    }

    if (window.app?.currentPlan === 'free') {
        analytics.track('Brand Kit Feature Blocked', {
            user_id: window.app?.currentUser?.email,
            current_plan: 'free',
            upgrade_opportunity: true
        });

        if (confirm('Brand Kits are available with Pro and Business plans. Upgrade now?')) {
            window.app.selectPlan('pro');
        }
        return;
    }

    if (window.app) {
        window.app.showNotification('Opening Brand Kit creator...', 'success');
    }
}

function previewBrandKit(kitType) {
    analytics.track('Brand Kit Preview', {
        kit_type: kitType,
        user_id: window.app?.currentUser?.email,
        interaction_type: 'example_preview'
    });

    if (window.app) {
        window.app.showNotification(`Previewing ${kitType} brand kit`, 'info');
    }
}

function accessTeamSpace() {
    analytics.track('Team Space Access Attempted', {
        user_id: window.app?.currentUser?.email,
        user_plan: window.app?.currentPlan,
        entry_point: 'team_space_section'
    });

    if (!window.app?.currentUser) {
        window.app?.showSignupModal();
        analytics.track('Signup Prompted', {
            trigger: 'team_space_access'
        });
        return;
    }

    if (window.app?.currentPlan !== 'business') {
        analytics.track('Team Space Feature Blocked', {
            user_id: window.app?.currentUser?.email,
            current_plan: window.app?.currentPlan,
            upgrade_opportunity: true
        });

        if (confirm('Team Space is available with Business plan. Upgrade now?')) {
            window.app.selectPlan('business');
        }
        return;
    }

    analytics.track('Team Space Accessed', {
        user_id: window.app?.currentUser?.email,
        user_plan: window.app?.currentPlan
    });

    if (window.app) {
        window.app.showNotification('Opening Team Space...', 'success');
    }
}

function trackResourceAccess(resourceType, resourceId) {
    analytics.track('Resource Accessed', {
        resource_type: resourceType,
        resource_id: resourceId,
        user_id: window.app?.currentUser?.email,
        section: 'resources'
    });

    analytics.track('Learning Engagement', {
        content_type: resourceType,
        content_id: resourceId,
        user_id: window.app?.currentUser?.email,
        engagement_level: 'content_access'
    });

    if (window.app) {
        window.app.showNotification(`Opening ${resourceType}: ${resourceId}`, 'info');
    }
}

function openSupportChat() {
    analytics.track('Support Chat Opened', {
        user_id: window.app?.currentUser?.email,
        user_plan: window.app?.currentPlan,
        entry_point: 'resources_section'
    });

    if (window.app) {
        window.app.showNotification('Connecting to support chat...', 'success');
    }
}

function viewHelpCenter() {
    analytics.track('Help Center Accessed', {
        user_id: window.app?.currentUser?.email,
        entry_point: 'resources_section'
    });

    if (window.app) {
        window.app.showNotification('Opening help center...', 'info');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.app = new VeedApp();
    
    // Add some CSS for notifications and loading
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            font-family: var(--font-family);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
        }
        
        .user-menu {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .user-name {
            font-weight: 600;
            color: var(--gray-700);
        }
        
        .user-id {
            font-size: 0.75rem;
            color: var(--gray-500);
            background: var(--gray-100);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
        
        .user-plan {
            background: var(--primary-purple);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .onboarding-tooltip {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            max-width: 400px;
            text-align: center;
        }
        
        .tooltip-content h3 {
            margin-bottom: 12px;
            color: var(--gray-900);
        }
        
        .tooltip-content p {
            margin-bottom: 20px;
            color: var(--gray-600);
        }
        
        .upgrade-details {
            text-align: center;
            padding: 20px 0;
        }
        
        .upgrade-details .price {
            font-size: 2rem;
            font-weight: bold;
            color: var(--primary-purple);
            margin-bottom: 20px;
        }
        
        .upgrade-details .features {
            list-style: none;
            margin-bottom: 20px;
        }
        
        .upgrade-details .features li {
            padding: 8px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .billing-options {
            margin: 20px 0;
        }
        
        .billing-options label {
            display: block;
            margin: 8px 0;
            cursor: pointer;
        }
        
        .tool-placeholder {
            padding: 40px 20px;
            text-align: center;
            color: var(--gray-500);
        }
    `;
    document.head.appendChild(style);
});