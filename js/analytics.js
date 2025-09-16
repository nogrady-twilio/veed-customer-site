// Comprehensive Segment Analytics Implementation for VEED.io replica
// Focuses on B2B SaaS metrics: retention, cross-sell/upsell, freemium conversion, onboarding optimization

class VeedAnalytics {
    constructor() {
        this.userId = this.getUserId();
        this.sessionId = this.generateSessionId();
        this.anonymousId = analytics.user().anonymousId();
        this.initializeTracking();
    }

    // Generate or retrieve persistent user ID (random 5-character string)
    getUserId() {
        let userId = localStorage.getItem('veed_user_id');
        if (!userId) {
            userId = this.generateRandomUserId();
            localStorage.setItem('veed_user_id', userId);
        }
        return userId;
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

    // Initialize tracking on page load
    initializeTracking() {
        this.trackPageView();
        this.trackUserSession();
        this.setupEventListeners();
    }

    // Enhanced page tracking with UTM parameters
    trackPageView() {
        const utmParams = this.generateUTMParameters();
        const pageProperties = {
            url: window.location.href,
            path: window.location.pathname,
            referrer: document.referrer,
            title: document.title,
            session_id: this.sessionId,
            user_agent: navigator.userAgent,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            ...utmParams,
            // B2B SaaS specific properties
            page_category: 'landing_page',
            user_journey_stage: this.getUserJourneyStage(),
            ab_test_variant: this.getABTestVariant(),
            feature_flags: this.getActiveFeatureFlags()
        };

        analytics.page('Homepage', pageProperties);
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

    // User signup tracking with comprehensive B2B properties
    trackSignup(userData) {
        const signupProperties = {
            user_id: userData.email,
            email: userData.email,
            name: userData.name,
            company: userData.company || null,
            signup_method: 'email',
            signup_source: this.getSignupSource(),
            account_type: userData.company ? 'business' : 'individual',
            plan_type: 'free',
            trial_start_date: new Date().toISOString(),
            onboarding_version: 'v2.1',
            feature_discovery_source: 'homepage_hero',
            session_id: this.sessionId,
            anonymous_id_before_signup: this.anonymousId,
            time_to_signup: this.getTimeToSignup(),
            page_views_before_signup: this.getPageViewsBeforeSignup(),
            // UTM attribution
            ...this.generateUTMParameters(),
            // B2B SaaS metrics
            company_size: this.estimateCompanySize(userData.company),
            industry: this.estimateIndustry(userData.email),
            job_title: this.estimateJobTitle(userData.name, userData.email),
            signup_completion_rate: 1.0,
            form_abandonment_step: null
        };

        analytics.identify(userData.email, {
            name: userData.name,
            email: userData.email,
            company: userData.company,
            created_at: new Date().toISOString(),
            plan: 'free',
            account_status: 'active',
            onboarding_completed: false,
            feature_adoption_score: 0,
            engagement_score: 0.1,
            churn_risk_score: 0.0
        });

        analytics.track('Account Created', signupProperties);

        // Update user ID for persistent tracking
        this.userId = userData.email;
        localStorage.setItem('veed_user_id', userData.email);
        localStorage.setItem('veed_user_data', JSON.stringify(userData));
    }

    // User login tracking
    trackLogin(email) {
        const loginProperties = {
            user_id: email,
            login_method: 'email',
            session_id: this.sessionId,
            login_timestamp: new Date().toISOString(),
            days_since_last_login: this.getDaysSinceLastLogin(email),
            login_streak: this.getLoginStreak(email),
            device_fingerprint: this.getDeviceFingerprint()
        };

        analytics.identify(email);
        analytics.track('User Logged In', loginProperties);

        this.userId = email;
        localStorage.setItem('veed_user_id', email);
        localStorage.setItem('last_login_date', new Date().toISOString());
    }

    // Feature usage tracking
    trackFeatureUsage(featureName, properties = {}) {
        const featureProperties = {
            feature_name: featureName,
            user_id: this.userId,
            session_id: this.sessionId,
            feature_category: this.getFeatureCategory(featureName),
            usage_timestamp: new Date().toISOString(),
            user_plan: this.getUserPlan(),
            feature_availability: this.getFeatureAvailability(featureName),
            is_power_user: this.isPowerUser(),
            feature_adoption_day: this.getFeatureAdoptionDay(featureName),
            usage_context: 'main_interface',
            previous_feature_usage: this.getPreviousFeatureUsage(),
            ...properties
        };

        analytics.track('Feature Used', featureProperties);
        
        // Update feature adoption tracking
        this.updateFeatureAdoption(featureName);
    }

    // Project creation tracking
    trackProjectCreated(projectData) {
        const projectProperties = {
            project_id: projectData.id || this.generateProjectId(),
            project_name: projectData.name,
            project_type: projectData.type || 'video_editing',
            user_id: this.userId,
            session_id: this.sessionId,
            creation_timestamp: new Date().toISOString(),
            template_used: projectData.template || null,
            collaboration_enabled: false,
            project_duration_estimate: projectData.duration || 0,
            user_plan: this.getUserPlan(),
            projects_created_today: this.getProjectsCreatedToday(),
            total_projects_created: this.getTotalProjectsCreated(),
            time_since_last_project: this.getTimeSinceLastProject(),
            creation_method: projectData.method || 'manual',
            initial_media_count: projectData.mediaCount || 0
        };

        analytics.track('Project Created', projectProperties);
        
        // Track onboarding progress
        if (this.getTotalProjectsCreated() === 1) {
            this.trackOnboardingMilestone('first_project_created');
        }
    }

    // Subscription upgrade tracking
    trackSubscriptionUpgrade(planData) {
        const upgradeProperties = {
            user_id: this.userId,
            session_id: this.sessionId,
            previous_plan: this.getUserPlan(),
            new_plan: planData.plan,
            upgrade_timestamp: new Date().toISOString(),
            upgrade_method: planData.method || 'pricing_page',
            billing_cycle: planData.billingCycle || 'monthly',
            discount_applied: planData.discount || null,
            upgrade_reason: planData.reason || 'feature_limitation',
            trial_to_paid: planData.fromTrial || false,
            days_since_signup: this.getDaysSinceSignup(),
            feature_usage_before_upgrade: this.getFeatureUsageStats(),
            conversion_funnel_step: 'payment_completed',
            annual_contract_value: this.calculateACV(planData),
            monthly_recurring_revenue: this.calculateMRR(planData),
            customer_lifetime_value: this.estimateCLV(planData),
            upgrade_trigger: this.getUpgradeTrigger(),
            price_sensitivity: this.getPriceSensitivity()
        };

        analytics.identify(this.userId, {
            plan: planData.plan,
            billing_cycle: planData.billingCycle,
            subscription_status: 'active',
            upgrade_date: new Date().toISOString(),
            monthly_recurring_revenue: upgradeProperties.monthly_recurring_revenue,
            customer_lifetime_value: upgradeProperties.customer_lifetime_value
        });

        analytics.track('Subscription Upgraded', upgradeProperties);

        // Update local plan storage
        localStorage.setItem('user_plan', planData.plan);
    }

    // Team invitation tracking
    trackUserInvited(inviteData) {
        const inviteProperties = {
            inviter_id: this.userId,
            invitee_email: inviteData.email,
            invite_id: this.generateInviteId(),
            session_id: this.sessionId,
            invite_timestamp: new Date().toISOString(),
            invite_method: 'email',
            team_size_before: this.getTeamSize(),
            invitee_role: inviteData.role || 'editor',
            project_context: inviteData.projectId || null,
            organization_plan: this.getUserPlan(),
            invitation_message_included: !!inviteData.message,
            viral_coefficient: this.calculateViralCoefficient(),
            referral_program_active: false,
            invite_channel: 'product_interface'
        };

        analytics.track('User Invited', inviteProperties);

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
        const exportProperties = {
            user_id: this.userId,
            project_id: exportData.projectId,
            session_id: this.sessionId,
            export_timestamp: new Date().toISOString(),
            video_duration: exportData.duration,
            export_quality: exportData.quality,
            file_size_mb: exportData.fileSize,
            export_format: exportData.format || 'mp4',
            processing_time_seconds: exportData.processingTime,
            user_plan: this.getUserPlan(),
            export_count_today: this.getExportCountToday(),
            total_exports: this.getTotalExports(),
            watermark_present: this.hasWatermark(),
            subtitle_enabled: exportData.hasSubtitles || false,
            effects_used: exportData.effectsCount || 0,
            collaboration_project: exportData.isCollaborative || false,
            export_success: true,
            bandwidth_usage_mb: exportData.fileSize
        };

        analytics.track('Video Exported', exportProperties);
        
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

        // Track scroll depth
        let maxScrollDepth = 0;
        window.addEventListener('scroll', () => {
            const scrollDepth = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
            if (scrollDepth > maxScrollDepth) {
                maxScrollDepth = scrollDepth;
                if (scrollDepth > 0.25 && scrollDepth <= 0.5) {
                    analytics.track('Page Scroll', { depth: '25%' });
                } else if (scrollDepth > 0.5 && scrollDepth <= 0.75) {
                    analytics.track('Page Scroll', { depth: '50%' });
                } else if (scrollDepth > 0.75) {
                    analytics.track('Page Scroll', { depth: '75%' });
                }
            }
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
    getDeviceFingerprint() { return 'fp_' + Math.random().toString(36).substr(2, 16); }
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