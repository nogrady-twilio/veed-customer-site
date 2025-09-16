// Comprehensive Segment Analytics Implementation for VEED.io replica
// Focuses on B2B SaaS metrics: retention, cross-sell/upsell, freemium conversion, onboarding optimization

class VeedAnalytics {
    constructor() {
        this.userId = this.getUserId(); // Will be null for anonymous users
        this.sessionId = this.generateSessionId();
        this.anonymousId = null;
        this.isInitialized = false;
        
        // Initialize tracking when Segment is ready
        if (typeof analytics !== 'undefined') {
            analytics.ready(() => {
                this.anonymousId = analytics.user().anonymousId();
                this.initializeTracking();
                console.log('📊 Segment Analytics initialized');
                console.log('   Anonymous ID:', this.anonymousId);
                console.log('   User ID:', this.userId || 'none (anonymous)');
            });
        } else {
            // Fallback if analytics not available
            this.anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.initializeTracking();
        }
    }

    // Get existing user ID (only if user has signed up)
    getUserId() {
        // Only return userId if user has actually signed up (has user data)
        const userId = localStorage.getItem('veed_user_id');
        const userData = localStorage.getItem('veed_user_data');
        
        if (userId && userData) {
            return userId;
        }
        
        // Return null for anonymous users - no user ID assigned yet
        return null;
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

    // Generate session ID for session-based tracking
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Generate random UTM parameters for demo purposes
    generateUTMParameters() {
        const sources = ['google', 'facebook', 'twitter', 'linkedin', 'youtube', 'direct', 'email'];
        const mediums = ['cpc', 'social', 'organic', 'email', 'referral', 'display'];
        const campaigns = ['brand_awareness', 'conversion', 'retargeting', 'video_tools', 'free_trial'];
        const contents = ['hero_cta', 'pricing_page', 'feature_demo', 'blog_post', 'case_study'];

        return {
            utm_source: sources[Math.floor(Math.random() * sources.length)],
            utm_medium: mediums[Math.floor(Math.random() * mediums.length)],
            utm_campaign: campaigns[Math.floor(Math.random() * campaigns.length)],
            utm_content: contents[Math.floor(Math.random() * contents.length)],
            utm_term: 'video editor online free'
        };
    }

    // Initialize tracking on page load - follow proper call order
    initializeTracking() {
        this.isInitialized = true;
        
        // STEP 1: Always call page() first
        this.trackPageView();
        
        // STEP 2: If user is authenticated (has stored user data), identify them
        const storedUserId = localStorage.getItem('veed_user_id');
        const storedUserData = localStorage.getItem('veed_user_data');
        
        if (storedUserId && storedUserData) {
            // Only identify if we have actual user data (means they signed up before)
            this.identifyExistingUser(storedUserId);
        } else {
            // Anonymous user - no identify call, just track as anonymous
            console.log('👤 Anonymous user - no identify call');
        }
        
        // STEP 3: Setup event listeners
        this.setupEventListeners();
    }
    
    // Re-identify existing authenticated user on page load (returning user only)
    identifyExistingUser(userId) {
        const storedUserData = JSON.parse(localStorage.getItem('veed_user_data') || '{}');
        const currentPlan = localStorage.getItem('user_plan') || 'free';
        
        analytics.identify(userId, {
            name: storedUserData.name,
            email: storedUserData.email || localStorage.getItem('veed_user_email'),
            company: storedUserData.company || null,
            plan: currentPlan,
            createdAt: storedUserData.createdAt || storedUserData.signupDate,
            role: storedUserData.role || 'user',
            isTrial: this.isTrialUser()
        });
        
        this.userId = userId;
        console.log('👤 Returning user identified:', userId);
    }

    // Page tracking following Segment best practices
    trackPageView() {
        const utmParams = this.generateUTMParameters();
        
        // Clean page properties (no user_id here - it's top-level)
        const pageProperties = {
            // Page context
            url: window.location.href,
            path: window.location.pathname,
            referrer: document.referrer,
            title: document.title,
            
            // UTM parameters (belong on page calls)
            ...utmParams,
            
            // Technical context
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            
            // User journey context
            userJourneyStage: this.getUserJourneyStage(),
            isAuthenticated: !!localStorage.getItem('veed_user_id')
        };

        // Call page with stable name, variables in properties
        analytics.page('VEED Homepage', pageProperties);
        
        console.log('📄 Page tracked:', {
            userId: this.userId || 'anonymous',
            page: 'VEED Homepage',
            isAnonymous: !this.userId
        });
    }

    // Track user session start
    trackUserSession() {
        const sessionProperties = {
            session_id: this.sessionId,
            user_id: this.userId,
            anonymous_id: this.anonymousId,
            session_start_time: new Date().toISOString(),
            device_type: this.getDeviceType(),
            browser: this.getBrowser(),
            operating_system: this.getOperatingSystem(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            is_mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            is_returning_visitor: this.isReturningVisitor(),
            previous_session_count: this.getPreviousSessionCount(),
            days_since_first_visit: this.getDaysSinceFirstVisit()
        };

        analytics.track('Session Started', sessionProperties);
    }

    // User signup tracking - FIRST TIME identify call links anonymous to user
    trackSignup(userData) {
        // Generate the 5-character user ID (FIRST TIME)
        const generatedUserId = this.generateRandomUserId();
        const signupTimestamp = new Date().toISOString();
        
        console.log('🎯 Anonymous to Identified User Flow:');
        console.log('   📝 Previous state: Anonymous user with ID', this.anonymousId);
        console.log('   🆔 Generated user ID:', generatedUserId);
        
        // STEP 1: FIRST IDENTIFY CALL - Links all previous anonymous behavior to this user ID
        analytics.identify(generatedUserId, {
            name: userData.name,
            email: userData.email,
            company: userData.company || null,
            plan: 'free',
            createdAt: signupTimestamp,
            accountType: userData.company ? 'business' : 'individual',
            marketingOptIn: true,
            isTrial: false,
            role: 'user'
        });

        // STEP 2: TRACK the signup event
        analytics.track('Signed Up', {
            plan: 'free',
            method: 'email',
            source: 'homepage',
            accountType: userData.company ? 'business' : 'individual',
            companySize: this.estimateCompanySize(userData.company),
            industry: this.estimateIndustry(userData.email)
        });

        // STEP 3: Update application state to reflect identified user
        this.userId = generatedUserId;
        localStorage.setItem('veed_user_id', generatedUserId);
        localStorage.setItem('veed_user_email', userData.email);
        localStorage.setItem('veed_user_data', JSON.stringify({
            ...userData,
            userId: generatedUserId,
            createdAt: signupTimestamp
        }));

        console.log('   ✅ User now identified - all future events will use userId:', generatedUserId);
        console.log('   📊 Previous anonymous events now attributed to user');
    }

    // User login tracking
    trackLogin(email, existingUserId = null) {
        // Get the stored user ID - should exist for returning users
        const storedUserId = localStorage.getItem('veed_user_id') || existingUserId;
        const userId = storedUserId || this.generateRandomUserId();
        
        // Get stored user data if available
        const storedUserData = JSON.parse(localStorage.getItem('veed_user_data') || '{}');
        const currentPlan = localStorage.getItem('user_plan') || 'free';
        const loginCount = this.getLoginCount() + 1;
        const loginTimestamp = new Date().toISOString();
        
        // STEP 1: IDENTIFY the user with updated traits (user facts only)
        analytics.identify(userId, {
            name: storedUserData.name || email.split('@')[0],
            email: email,
            company: storedUserData.company || null,
            plan: currentPlan,
            createdAt: storedUserData.createdAt || storedUserData.signupDate,
            lastLogin: loginTimestamp,
            loginCount: loginCount,
            role: storedUserData.role || 'user',
            isTrial: currentPlan === 'free' ? false : this.isTrialUser()
        });

        // STEP 2: TRACK the login event
        analytics.track('Logged In', {
            method: 'email',
            plan: currentPlan,
            loginCount: loginCount,
            daysSinceLastLogin: this.getDaysSinceLastLogin(email),
            loginStreak: this.getLoginStreak(email)
        });

        // Update stored user information
        this.userId = userId;
        localStorage.setItem('veed_user_id', userId);
        localStorage.setItem('veed_user_email', email);
        localStorage.setItem('last_login_date', loginTimestamp);
        localStorage.setItem('login_count', loginCount.toString());

        console.log('🎯 Segment tracking - Login:');
        console.log('   👤 Identify call: user', userId);
        console.log('   📊 Track call: Logged In');
        console.log('   📧 Email:', email);
        console.log('   📅 Login count:', loginCount);
    }

    // Feature usage tracking (works for both anonymous and identified users)
    trackFeatureUsage(featureName, properties = {}) {
        analytics.track('Feature Used', {
            featureName: featureName,
            featureCategory: this.getFeatureCategory(featureName),
            plan: this.userId ? this.getUserPlan() : 'anonymous',
            featureAvailability: this.getFeatureAvailability(featureName),
            usageContext: properties.context || 'main_interface',
            isAnonymous: !this.userId,
            ...properties
        });
        
        // Update feature adoption tracking only for identified users
        if (this.userId) {
            this.updateFeatureAdoption(featureName);
        }
    }

    // Project creation tracking
    trackProjectCreated(projectData) {
        analytics.track('Project Created', {
            projectId: projectData.id || this.generateProjectId(),
            projectName: projectData.name,
            projectType: projectData.type || 'video_editing',
            templateUsed: projectData.template || null,
            creationMethod: projectData.method || 'manual',
            plan: this.getUserPlan(),
            projectsCreatedToday: this.getProjectsCreatedToday(),
            totalProjectsCreated: this.getTotalProjectsCreated()
        });
        
        // Track onboarding progress
        if (this.getTotalProjectsCreated() === 1) {
            this.trackOnboardingMilestone('first_project_created');
        }
    }

    // Subscription upgrade tracking
    trackSubscriptionUpgrade(planData) {
        const previousPlan = this.getUserPlan();
        const mrr = this.calculateMRR(planData);
        const upgradeTimestamp = new Date().toISOString();
        
        // Update user traits
        analytics.identify(this.userId, {
            plan: planData.plan,
            billingInterval: planData.billingCycle || 'monthly',
            subscriptionStatus: 'active',
            mrr: mrr,
            isTrial: planData.fromTrial === true ? false : this.isTrialUser()
        });

        // Track subscription upgrade event
        analytics.track('Subscription Upgraded', {
            previousPlan: previousPlan,
            newPlan: planData.plan,
            billingInterval: planData.billingCycle || 'monthly',
            mrr: mrr,
            arr: mrr * 12,
            revenue: mrr,
            currency: 'USD',
            method: planData.method || 'credit_card',
            trial: planData.fromTrial || false,
            upgradeReason: planData.reason || 'feature_limitation',
            daysSinceSignup: this.getDaysSinceSignup()
        });

        // Update local plan storage
        localStorage.setItem('user_plan', planData.plan);
    }

    // Team invitation tracking
    trackUserInvited(inviteData) {
        analytics.track('Invite Sent', {
            inviteId: this.generateInviteId(),
            inviteeEmail: inviteData.email,
            inviteeRole: inviteData.role || 'editor',
            method: 'email',
            teamSizeBefore: this.getTeamSize(),
            projectId: inviteData.projectId || null,
            plan: this.getUserPlan(),
            messageIncluded: !!inviteData.message
        });

        // Track viral growth metrics
        this.updateViralMetrics(inviteData);
    }

    // Onboarding milestone tracking
    trackOnboardingMilestone(milestone) {
        const milestoneProperties = {
            user_id: this.userId,
            milestone: milestone,
            session_id: this.sessionId,
            milestone_timestamp: new Date().toISOString(),
            days_since_signup: this.getDaysSinceSignup(),
            onboarding_version: 'v2.1',
            previous_milestones: this.getCompletedMilestones(),
            milestone_completion_time: this.getMilestoneCompletionTime(milestone),
            drop_off_risk: this.calculateDropOffRisk(),
            engagement_score: this.calculateEngagementScore(),
            feature_discovery_rate: this.getFeatureDiscoveryRate()
        };

        analytics.track('Onboarding Milestone Completed', milestoneProperties);
        
        // Update onboarding progress
        this.updateOnboardingProgress(milestone);
    }

    // Video export tracking
    trackVideoExport(exportData) {
        analytics.track('Video Exported', {
            projectId: exportData.projectId,
            videoDuration: exportData.duration,
            exportQuality: exportData.quality,
            fileSizeMb: exportData.fileSize,
            exportFormat: exportData.format || 'mp4',
            processingTimeSeconds: exportData.processingTime,
            plan: this.getUserPlan(),
            exportCountToday: this.getExportCountToday(),
            totalExports: this.getTotalExports(),
            watermarkPresent: this.hasWatermark(),
            subtitlesEnabled: exportData.hasSubtitles || false,
            effectsUsed: exportData.effectsCount || 0,
            collaborationProject: exportData.isCollaborative || false
        });
        
        // Track plan usage limits
        this.updateUsageLimits('exports', 1);
    }

    // Churn risk tracking
    trackChurnRisk() {
        const churnProperties = {
            user_id: this.userId,
            churn_risk_score: this.calculateChurnRiskScore(),
            last_activity_date: this.getLastActivityDate(),
            days_since_last_login: this.getDaysSinceLastLogin(),
            feature_usage_decline: this.getFeatureUsageDecline(),
            support_tickets_count: this.getSupportTicketsCount(),
            plan_downgrade_risk: this.getPlanDowngradeRisk(),
            engagement_trend: this.getEngagementTrend(),
            usage_frequency: this.getUsageFrequency(),
            session_duration_trend: this.getSessionDurationTrend()
        };

        if (churnProperties.churn_risk_score > 0.7) {
            analytics.track('High Churn Risk Detected', churnProperties);
        }
    }

    // Setup event listeners for automatic tracking
    setupEventListeners() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackSessionEnd();
            } else {
                this.trackSessionResume();
            }
        });

        // Track beforeunload for session duration
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // Track scroll depth milestones (only once per milestone)
        let maxScrollDepth = 0;
        let scrollMilestones = {
            '25%': false,
            '50%': false,
            '75%': false,
            '100%': false
        };
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            // Debounce scroll events to reduce frequency
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollDepth = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
                
                if (scrollDepth > maxScrollDepth) {
                    maxScrollDepth = scrollDepth;
                    
                    // Track each milestone only once
                    if (scrollDepth >= 0.25 && !scrollMilestones['25%']) {
                        scrollMilestones['25%'] = true;
                        analytics.track('Page Scrolled', { 
                            depth: '25%',
                            page: 'VEED Homepage'
                        });
                    } else if (scrollDepth >= 0.50 && !scrollMilestones['50%']) {
                        scrollMilestones['50%'] = true;
                        analytics.track('Page Scrolled', { 
                            depth: '50%',
                            page: 'VEED Homepage'
                        });
                    } else if (scrollDepth >= 0.75 && !scrollMilestones['75%']) {
                        scrollMilestones['75%'] = true;
                        analytics.track('Page Scrolled', { 
                            depth: '75%',
                            page: 'VEED Homepage'
                        });
                    } else if (scrollDepth >= 0.95 && !scrollMilestones['100%']) {
                        scrollMilestones['100%'] = true;
                        analytics.track('Page Scrolled', { 
                            depth: '100%',
                            page: 'VEED Homepage'
                        });
                    }
                }
            }, 150); // 150ms debounce
        });
    }

    // Helper methods for calculating B2B SaaS metrics
    getUserJourneyStage() {
        const userData = JSON.parse(localStorage.getItem('veed_user_data') || '{}');
        if (!userData.email) return 'anonymous';
        if (!this.getCompletedMilestones().includes('first_project_created')) return 'onboarding';
        if (this.getUserPlan() === 'free') return 'freemium';
        return 'paid_user';
    }

    getABTestVariant() {
        return ['control', 'variant_a', 'variant_b'][Math.floor(Math.random() * 3)];
    }

    getActiveFeatureFlags() {
        return ['new_editor_ui', 'ai_avatars_beta', 'collaboration_v2'];
    }

    getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
        return 'desktop';
    }

    getBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Other';
    }

    getOperatingSystem() {
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac')) return 'macOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS')) return 'iOS';
        return 'Other';
    }

    isReturningVisitor() {
        return localStorage.getItem('veed_first_visit') !== null;
    }

    getPreviousSessionCount() {
        return parseInt(localStorage.getItem('veed_session_count') || '0');
    }

    getDaysSinceFirstVisit() {
        const firstVisit = localStorage.getItem('veed_first_visit');
        if (!firstVisit) return 0;
        return Math.floor((Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24));
    }

    getUserPlan() {
        return localStorage.getItem('user_plan') || 'free';
    }

    calculateACV(planData) {
        const monthlyPrices = { free: 0, pro: 24, business: 59 };
        return (monthlyPrices[planData.plan] || 0) * 12;
    }

    calculateMRR(planData) {
        const monthlyPrices = { free: 0, pro: 24, business: 59 };
        return monthlyPrices[planData.plan] || 0;
    }

    estimateCLV(planData) {
        const mrr = this.calculateMRR(planData);
        const avgLifetimeMonths = 24; // Average customer lifetime
        return mrr * avgLifetimeMonths;
    }

    generateProjectId() {
        return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateInviteId() {
        return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Initialize first visit tracking
    initFirstVisit() {
        if (!localStorage.getItem('veed_first_visit')) {
            localStorage.setItem('veed_first_visit', new Date().toISOString());
        }
        
        const sessionCount = this.getPreviousSessionCount();
        localStorage.setItem('veed_session_count', (sessionCount + 1).toString());
    }

    // Additional helper methods would be implemented here
    // (Simplified for demo purposes)
    getSignupSource() { return 'homepage'; }
    getTimeToSignup() { return Math.floor(Math.random() * 300); }
    getPageViewsBeforeSignup() { return Math.floor(Math.random() * 10) + 1; }
    estimateCompanySize() { return ['1-10', '11-50', '51-200', '201-1000', '1000+'][Math.floor(Math.random() * 5)]; }
    estimateIndustry() { return ['Technology', 'Marketing', 'Education', 'Healthcare', 'Other'][Math.floor(Math.random() * 5)]; }
    estimateJobTitle() { return ['Manager', 'Director', 'VP', 'C-Level', 'Individual Contributor'][Math.floor(Math.random() * 5)]; }
    getDaysSinceLastLogin() { return Math.floor(Math.random() * 7); }
    getLoginStreak() { return Math.floor(Math.random() * 30); }
    getLoginCount() { return parseInt(localStorage.getItem('login_count') || '0'); }
    getDeviceFingerprint() { return 'fp_' + Math.random().toString(36).substr(2, 16); }
    isTrialUser() { return Math.random() > 0.7; }
    getFeatureCategory(feature) { 
        const categories = { 'subtitles': 'ai_tools', 'screen-record': 'recording', 'collaboration': 'team_features' };
        return categories[feature] || 'editing_tools';
    }
    getFeatureAvailability() { return this.getUserPlan() === 'free' ? 'limited' : 'full'; }
    isPowerUser() { return Math.random() > 0.7; }
    getFeatureAdoptionDay() { return Math.floor(Math.random() * 30); }
    getPreviousFeatureUsage() { return Math.floor(Math.random() * 10); }
    updateFeatureAdoption() { /* Implementation */ }
    getDaysSinceSignup() { return Math.floor(Math.random() * 30); }
    getProjectsCreatedToday() { return Math.floor(Math.random() * 5); }
    getTotalProjectsCreated() { return parseInt(localStorage.getItem('total_projects') || '0'); }
    getTimeSinceLastProject() { return Math.floor(Math.random() * 24); }
    getFeatureUsageStats() { return { subtitles: 5, exports: 3, collaboration: 1 }; }
    getUpgradeTrigger() { return ['export_limit', 'watermark_removal', 'advanced_features'][Math.floor(Math.random() * 3)]; }
    getPriceSensitivity() { return Math.random(); }
    getTeamSize() { return Math.floor(Math.random() * 20) + 1; }
    calculateViralCoefficient() { return Math.random() * 0.5; }
    updateViralMetrics() { /* Implementation */ }
    getCompletedMilestones() { return JSON.parse(localStorage.getItem('onboarding_milestones') || '[]'); }
    getMilestoneCompletionTime() { return Math.floor(Math.random() * 300); }
    calculateDropOffRisk() { return Math.random(); }
    calculateEngagementScore() { return Math.random(); }
    getFeatureDiscoveryRate() { return Math.random(); }
    updateOnboardingProgress(milestone) { 
        const milestones = this.getCompletedMilestones();
        if (!milestones.includes(milestone)) {
            milestones.push(milestone);
            localStorage.setItem('onboarding_milestones', JSON.stringify(milestones));
        }
    }
    getExportCountToday() { return Math.floor(Math.random() * 5); }
    getTotalExports() { return parseInt(localStorage.getItem('total_exports') || '0'); }
    hasWatermark() { return this.getUserPlan() === 'free'; }
    updateUsageLimits() { /* Implementation */ }
    calculateChurnRiskScore() { return Math.random(); }
    getLastActivityDate() { return new Date().toISOString(); }
    getFeatureUsageDecline() { return Math.random() * 0.3; }
    getSupportTicketsCount() { return Math.floor(Math.random() * 5); }
    getPlanDowngradeRisk() { return Math.random() * 0.2; }
    getEngagementTrend() { return ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)]; }
    getUsageFrequency() { return ['daily', 'weekly', 'monthly'][Math.floor(Math.random() * 3)]; }
    getSessionDurationTrend() { return ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)]; }
    
    trackSessionEnd() {
        analytics.track('Session Ended', {
            session_id: this.sessionId,
            session_duration: Date.now() - this.sessionStartTime,
            user_id: this.userId
        });
    }

    trackSessionResume() {
        analytics.track('Session Resumed', {
            session_id: this.sessionId,
            user_id: this.userId
        });
    }
}

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.veedAnalytics = new VeedAnalytics();
    window.veedAnalytics.initFirstVisit();
});

// Global tracking functions for use in HTML
window.trackFeatureClick = function(feature) {
    if (window.veedAnalytics) {
        window.veedAnalytics.trackFeatureUsage(feature, {
            click_source: 'feature_grid',
            user_intent: 'feature_discovery'
        });
    }
};

window.trackPlanSelection = function(plan) {
    if (window.veedAnalytics) {
        analytics.track('Plan Selected', {
            plan_name: plan,
            selection_source: 'pricing_page',
            user_id: window.veedAnalytics.userId,
            session_id: window.veedAnalytics.sessionId
        });
    }
};