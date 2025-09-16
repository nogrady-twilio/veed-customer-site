// Video Editor Interface with Advanced Segment Tracking
// Handles video editing functionality and detailed user interaction analytics

class VideoEditor {
    constructor() {
        this.currentProject = null;
        this.timeline = [];
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.editorStartTime = null;
        this.interactions = [];
        this.toolUsage = {};
        
        this.init();
    }

    init() {
        this.setupEditorEventListeners();
        this.initializeTools();
    }

    setupEditorEventListeners() {
        // Track when editor is opened
        const editorModal = document.getElementById('editor-modal');
        if (editorModal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        if (editorModal.style.display === 'block') {
                            this.onEditorOpened();
                        } else if (editorModal.style.display === 'none') {
                            this.onEditorClosed();
                        }
                    }
                });
            });
            
            observer.observe(editorModal, { attributes: true });
        }

        // Track timeline scrubber interactions
        const scrubber = document.querySelector('.timeline-scrubber');
        if (scrubber) {
            scrubber.addEventListener('input', (e) => this.onScrubberChange(e));
            scrubber.addEventListener('mousedown', () => this.trackInteraction('timeline_scrub_start'));
            scrubber.addEventListener('mouseup', () => this.trackInteraction('timeline_scrub_end'));
        }

        // Track tool panel interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.tool-tab')) {
                this.trackToolUsage(e.target.textContent.toLowerCase());
            }
            
            if (e.target.closest('.tool-item')) {
                this.trackElementAdd(e.target.textContent);
            }
        });

        // Track keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('editor-modal').style.display === 'block') {
                this.handleKeyboardShortcuts(e);
            }
        });
    }

    onEditorOpened() {
        this.editorStartTime = Date.now();
        this.interactions = [];
        this.toolUsage = {};
        
        // Track editor session start
        analytics.track('Editor Session Started', {
            user_id: window.app?.currentUser?.email,
            session_id: window.veedAnalytics?.sessionId,
            user_plan: window.app?.currentPlan,
            project_count: window.app?.projectCount || 0,
            editor_version: '2.1.0',
            device_type: this.getDeviceType(),
            browser: this.getBrowser(),
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`
        });

        // Track feature discovery opportunities
        this.trackFeatureDiscovery();
    }

    onEditorClosed() {
        if (!this.editorStartTime) return;
        
        const sessionDuration = Date.now() - this.editorStartTime;
        
        // Track detailed editor session metrics
        analytics.track('Editor Session Ended', {
            user_id: window.app?.currentUser?.email,
            session_duration_ms: sessionDuration,
            session_duration_minutes: Math.round(sessionDuration / 60000),
            interactions_count: this.interactions.length,
            tools_used: Object.keys(this.toolUsage),
            most_used_tool: this.getMostUsedTool(),
            total_tool_switches: Object.values(this.toolUsage).reduce((a, b) => a + b, 0),
            project_saved: this.currentProject ? true : false,
            elements_added: this.getElementsAddedCount(),
            timeline_interactions: this.getTimelineInteractions(),
            engagement_score: this.calculateEngagementScore(),
            drop_off_point: this.getDropOffPoint(),
            completion_rate: this.calculateCompletionRate()
        });

        // Track potential churn signals
        if (sessionDuration < 30000) { // Less than 30 seconds
            this.trackChurnSignal('quick_exit', { session_duration: sessionDuration });
        }

        if (this.interactions.length === 0) {
            this.trackChurnSignal('no_interaction', { session_duration: sessionDuration });
        }
    }

    trackInteraction(interactionType, properties = {}) {
        const interaction = {
            type: interactionType,
            timestamp: Date.now(),
            ...properties
        };
        
        this.interactions.push(interaction);

        // Track specific interaction
        analytics.track('Editor Interaction', {
            user_id: window.app?.currentUser?.email,
            interaction_type: interactionType,
            interaction_index: this.interactions.length,
            time_since_editor_open: Date.now() - this.editorStartTime,
            user_plan: window.app?.currentPlan,
            ...properties
        });

        // Check for engagement milestones
        this.checkEngagementMilestones();
    }

    trackToolUsage(toolName) {
        this.toolUsage[toolName] = (this.toolUsage[toolName] || 0) + 1;
        
        analytics.track('Editor Tool Used', {
            user_id: window.app?.currentUser?.email,
            tool_name: toolName,
            usage_count: this.toolUsage[toolName],
            session_tool_switches: Object.values(this.toolUsage).reduce((a, b) => a + b, 0),
            time_since_editor_open: Date.now() - this.editorStartTime,
            user_plan: window.app?.currentPlan,
            feature_availability: this.getFeatureAvailability(toolName)
        });

        // Track tool adoption patterns
        if (this.toolUsage[toolName] === 1) {
            analytics.track('New Tool Discovery', {
                user_id: window.app?.currentUser?.email,
                tool_name: toolName,
                discovery_method: 'manual_click',
                time_to_discovery: Date.now() - this.editorStartTime
            });
        }

        // Check for advanced feature usage
        if (['effects', 'subtitles', 'audio'].includes(toolName)) {
            this.trackAdvancedFeatureUsage(toolName);
        }
    }

    trackElementAdd(elementType) {
        const elementData = {
            element_type: elementType.toLowerCase(),
            timeline_position: this.currentTime,
            user_plan: window.app?.currentPlan
        };

        // Check plan limitations
        if (window.app?.currentPlan === 'free' && this.getElementCount() >= 3) {
            analytics.track('Plan Limitation Hit', {
                user_id: window.app?.currentUser?.email,
                limitation_type: 'element_limit',
                current_plan: 'free',
                attempted_action: 'add_element',
                upgrade_opportunity: true
            });
            
            // Show upgrade prompt
            this.showUpgradePrompt('element_limit');
            return false;
        }

        analytics.track('Timeline Element Added', {
            user_id: window.app?.currentUser?.email,
            ...elementData,
            total_elements: this.getElementCount() + 1,
            timeline_complexity: this.calculateTimelineComplexity(),
            creation_method: 'tool_panel'
        });

        this.trackInteraction('element_add', elementData);
        return true;
    }

    onScrubberChange(event) {
        const newTime = parseFloat(event.target.value);
        this.currentTime = newTime;
        
        analytics.track('Timeline Scrub', {
            user_id: window.app?.currentUser?.email,
            new_position: newTime,
            previous_position: this.currentTime,
            scrub_distance: Math.abs(newTime - this.currentTime),
            video_duration: this.duration
        });
    }

    handleKeyboardShortcuts(event) {
        const shortcuts = {
            'Space': 'play_pause',
            'ArrowLeft': 'seek_backward',
            'ArrowRight': 'seek_forward',
            'Delete': 'delete_element',
            'Enter': 'split_clip',
            'KeyC': 'copy',
            'KeyV': 'paste',
            'KeyZ': 'undo',
            'KeyY': 'redo'
        };

        const shortcut = shortcuts[event.code];
        if (shortcut) {
            event.preventDefault();
            
            analytics.track('Keyboard Shortcut Used', {
                user_id: window.app?.currentUser?.email,
                shortcut_key: event.code,
                shortcut_action: shortcut,
                modifier_keys: {
                    ctrl: event.ctrlKey,
                    shift: event.shiftKey,
                    alt: event.altKey
                },
                user_efficiency_score: this.calculateEfficiencyScore()
            });

            this.trackInteraction('keyboard_shortcut', { 
                shortcut: shortcut,
                key: event.code 
            });
        }
    }

    // Advanced Feature Tracking
    trackAdvancedFeatureUsage(featureName) {
        analytics.track('Advanced Feature Used', {
            user_id: window.app?.currentUser?.email,
            feature_name: featureName,
            user_plan: window.app?.currentPlan,
            feature_tier: this.getFeatureTier(featureName),
            onboarding_day: this.getOnboardingDay(),
            feature_adoption_funnel: this.getFeatureAdoptionFunnel(),
            power_user_indicator: this.isPowerUserBehavior()
        });

        // Track feature onboarding
        if (!this.hasUsedFeatureBefore(featureName)) {
            analytics.track('Feature Onboarding Started', {
                user_id: window.app?.currentUser?.email,
                feature_name: featureName,
                discovery_source: 'editor_interface',
                time_to_feature_discovery: this.getTimeToFeatureDiscovery()
            });
        }
    }

    trackFeatureDiscovery() {
        const availableFeatures = this.getAvailableFeaturesForPlan();
        const undiscoveredFeatures = availableFeatures.filter(f => !this.hasUsedFeatureBefore(f));

        if (undiscoveredFeatures.length > 0) {
            analytics.track('Feature Discovery Opportunity', {
                user_id: window.app?.currentUser?.email,
                available_features: availableFeatures,
                undiscovered_features: undiscoveredFeatures,
                discovery_rate: (availableFeatures.length - undiscoveredFeatures.length) / availableFeatures.length,
                user_plan: window.app?.currentPlan
            });
        }
    }

    trackChurnSignal(signalType, properties = {}) {
        analytics.track('Churn Signal Detected', {
            user_id: window.app?.currentUser?.email,
            signal_type: signalType,
            risk_level: this.calculateChurnRisk(signalType),
            intervention_needed: true,
            user_plan: window.app?.currentPlan,
            days_since_signup: this.getDaysSinceSignup(),
            ...properties
        });

        // Trigger retention intervention
        this.triggerRetentionIntervention(signalType);
    }

    // Project Management
    createNewProject(projectData = {}) {
        const project = {
            id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: projectData.name || 'Untitled Project',
            created_at: new Date().toISOString(),
            duration: 0,
            elements: [],
            settings: {
                resolution: '1080p',
                framerate: 30,
                quality: window.app?.currentPlan === 'free' ? 'standard' : 'high'
            }
        };

        this.currentProject = project;

        // Track project creation with enhanced properties
        analytics.track('Project Created', {
            user_id: window.app?.currentUser?.email,
            project_id: project.id,
            project_name: project.name,
            project_type: 'video_editing',
            creation_method: projectData.method || 'new_project_button',
            template_used: projectData.template || null,
            user_plan: window.app?.currentPlan,
            projects_created_today: this.getProjectsCreatedToday(),
            total_projects_created: this.getTotalProjectsCreated() + 1,
            collaboration_enabled: false,
            default_settings: project.settings,
            creation_source: 'editor_interface'
        });

        // Check for onboarding milestones
        if (this.getTotalProjectsCreated() === 0) {
            if (window.veedAnalytics) {
                window.veedAnalytics.trackOnboardingMilestone('first_project_created');
            }
        }

        return project;
    }

    saveProject() {
        if (!this.currentProject) {
            this.currentProject = this.createNewProject();
        }

        const saveData = {
            project_id: this.currentProject.id,
            elements_count: this.getElementCount(),
            timeline_duration: this.duration,
            complexity_score: this.calculateTimelineComplexity(),
            tools_used: Object.keys(this.toolUsage),
            save_trigger: 'manual'
        };

        analytics.track('Project Saved', {
            user_id: window.app?.currentUser?.email,
            ...saveData,
            session_duration: Date.now() - this.editorStartTime,
            auto_save: false,
            save_count: this.getSaveCount(),
            data_size_kb: this.estimateProjectSize()
        });

        // Simulate save process
        localStorage.setItem(`project_${this.currentProject.id}`, JSON.stringify(this.currentProject));
        
        // Update project counter
        const totalProjects = this.getTotalProjectsCreated() + 1;
        localStorage.setItem('total_projects', totalProjects.toString());
        
        if (window.app) {
            window.app.projectCount = totalProjects;
        }

        return true;
    }

    // Export functionality with detailed tracking
    exportProject(exportSettings = {}) {
        if (!this.currentProject) {
            analytics.track('Export Attempt Failed', {
                user_id: window.app?.currentUser?.email,
                failure_reason: 'no_project',
                user_plan: window.app?.currentPlan
            });
            return false;
        }

        const exportData = {
            project_id: this.currentProject.id,
            export_format: exportSettings.format || 'mp4',
            export_quality: exportSettings.quality || (window.app?.currentPlan === 'free' ? '720p' : '1080p'),
            export_resolution: exportSettings.resolution || '1920x1080',
            estimated_file_size_mb: this.estimateExportSize(exportSettings),
            processing_time_estimate: this.estimateProcessingTime(),
            watermark_included: window.app?.currentPlan === 'free',
            subtitle_tracks: this.getSubtitleTracks(),
            audio_tracks: this.getAudioTracks(),
            effects_applied: this.getAppliedEffects(),
            export_trigger: exportSettings.trigger || 'export_button'
        };

        // Check export limits for free users
        const dailyExports = this.getDailyExportCount();
        const exportLimits = { free: 1, pro: 50, business: 200 };
        const userLimit = exportLimits[window.app?.currentPlan] || 0;

        if (dailyExports >= userLimit && window.app?.currentPlan === 'free') {
            analytics.track('Export Limit Reached', {
                user_id: window.app?.currentUser?.email,
                daily_exports: dailyExports,
                plan_limit: userLimit,
                current_plan: window.app?.currentPlan,
                upgrade_opportunity: true
            });

            this.showUpgradePrompt('export_limit');
            return false;
        }

        analytics.track('Video Export Started', {
            user_id: window.app?.currentUser?.email,
            ...exportData,
            user_plan: window.app?.currentPlan,
            daily_exports: dailyExports + 1,
            total_exports: this.getTotalExports() + 1,
            project_complexity: this.calculateTimelineComplexity(),
            collaboration_project: this.isCollaborationProject()
        });

        // Simulate export process
        return this.processExport(exportData);
    }

    processExport(exportData) {
        // Simulate processing time
        const processingTime = Math.random() * 30000 + 10000; // 10-40 seconds
        
        setTimeout(() => {
            analytics.track('Video Export Completed', {
                user_id: window.app?.currentUser?.email,
                project_id: exportData.project_id,
                actual_processing_time_ms: processingTime,
                export_success: true,
                file_size_mb: exportData.estimated_file_size_mb * (0.8 + Math.random() * 0.4), // Some variance
                export_quality: exportData.export_quality,
                bandwidth_usage_mb: exportData.estimated_file_size_mb
            });

            // Update daily export count
            this.incrementDailyExports();
            
            if (window.app) {
                window.app.showNotification('Video exported successfully!', 'success');
            }
        }, processingTime);

        return true;
    }

    // Collaboration Features
    enableCollaboration() {
        if (window.app?.currentPlan === 'free') {
            analytics.track('Collaboration Feature Blocked', {
                user_id: window.app?.currentUser?.email,
                current_plan: 'free',
                feature: 'collaboration',
                upgrade_opportunity: true
            });
            
            this.showUpgradePrompt('collaboration');
            return false;
        }

        analytics.track('Collaboration Enabled', {
            user_id: window.app?.currentUser?.email,
            project_id: this.currentProject?.id,
            user_plan: window.app?.currentPlan,
            team_size: this.getTeamSize(),
            collaboration_method: 'project_sharing'
        });

        return true;
    }

    inviteCollaborator(email, role = 'editor') {
        if (!this.enableCollaboration()) return false;

        const inviteData = {
            invitee_email: email,
            role: role,
            project_id: this.currentProject?.id,
            invite_method: 'email',
            team_size_before: this.getTeamSize()
        };

        if (window.veedAnalytics) {
            window.veedAnalytics.trackUserInvited(inviteData);
        }

        analytics.track('Collaborator Invited', {
            user_id: window.app?.currentUser?.email,
            ...inviteData,
            invitation_context: 'editor_interface',
            project_complexity: this.calculateTimelineComplexity()
        });

        return true;
    }

    // Helper Methods for Analytics
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

    getMostUsedTool() {
        const tools = Object.entries(this.toolUsage);
        if (tools.length === 0) return null;
        return tools.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }

    getElementsAddedCount() {
        return this.interactions.filter(i => i.type === 'element_add').length;
    }

    getTimelineInteractions() {
        return this.interactions.filter(i => i.type.includes('timeline')).length;
    }

    calculateEngagementScore() {
        const factors = {
            interactions: Math.min(this.interactions.length / 10, 1) * 0.3,
            toolUsage: Math.min(Object.keys(this.toolUsage).length / 5, 1) * 0.2,
            sessionDuration: Math.min((Date.now() - this.editorStartTime) / 300000, 1) * 0.3, // 5 min max
            elementsAdded: Math.min(this.getElementsAddedCount() / 5, 1) * 0.2
        };
        
        return Object.values(factors).reduce((a, b) => a + b, 0);
    }

    getDropOffPoint() {
        if (this.interactions.length === 0) return 'initial_load';
        
        const lastInteraction = this.interactions[this.interactions.length - 1];
        const timeSinceLastInteraction = Date.now() - lastInteraction.timestamp;
        
        if (timeSinceLastInteraction > 60000) { // 1 minute
            return lastInteraction.type;
        }
        
        return null;
    }

    calculateCompletionRate() {
        const expectedActions = ['tool_used', 'element_add', 'project_save'];
        const completedActions = expectedActions.filter(action => 
            this.interactions.some(i => i.type.includes(action.split('_')[0]))
        );
        
        return completedActions.length / expectedActions.length;
    }

    checkEngagementMilestones() {
        const milestones = [5, 10, 20, 50];
        const currentCount = this.interactions.length;
        
        milestones.forEach(milestone => {
            if (currentCount === milestone) {
                analytics.track('Editor Engagement Milestone', {
                    user_id: window.app?.currentUser?.email,
                    milestone: `${milestone}_interactions`,
                    session_duration: Date.now() - this.editorStartTime,
                    engagement_level: milestone <= 10 ? 'low' : milestone <= 30 ? 'medium' : 'high'
                });
            }
        });
    }

    // Feature availability and limitations
    getFeatureAvailability(featureName) {
        const planFeatures = {
            free: ['media', 'text', 'basic_effects'],
            pro: ['media', 'text', 'effects', 'subtitles', 'audio', 'templates'],
            business: ['media', 'text', 'effects', 'subtitles', 'audio', 'templates', 'collaboration', 'brand_kit']
        };
        
        const userPlan = window.app?.currentPlan || 'free';
        return planFeatures[userPlan].includes(featureName) ? 'available' : 'upgrade_required';
    }

    getFeatureTier(featureName) {
        const tiers = {
            media: 'basic',
            text: 'basic',
            audio: 'intermediate',
            effects: 'intermediate',
            subtitles: 'advanced',
            collaboration: 'advanced',
            brand_kit: 'advanced'
        };
        
        return tiers[featureName] || 'basic';
    }

    showUpgradePrompt(reason) {
        const messages = {
            element_limit: 'Upgrade to Pro for unlimited elements!',
            export_limit: 'Upgrade to Pro for unlimited exports!',
            collaboration: 'Upgrade to Business for team collaboration!'
        };

        analytics.track('Upgrade Prompt Shown', {
            user_id: window.app?.currentUser?.email,
            prompt_reason: reason,
            context: 'editor_interface',
            current_plan: window.app?.currentPlan
        });

        if (window.app && confirm(messages[reason] + ' Upgrade now?')) {
            const targetPlan = reason === 'collaboration' ? 'business' : 'pro';
            window.app.selectPlan(targetPlan);
        }
    }

    // Utility methods (simplified implementations for demo)
    getElementCount() { return Math.floor(Math.random() * 10); }
    calculateTimelineComplexity() { return Math.random(); }
    getOnboardingDay() { return Math.floor(Math.random() * 30); }
    getFeatureAdoptionFunnel() { return ['discovery', 'trial', 'adoption'][Math.floor(Math.random() * 3)]; }
    isPowerUserBehavior() { return Math.random() > 0.7; }
    hasUsedFeatureBefore(feature) { return Math.random() > 0.5; }
    getTimeToFeatureDiscovery() { return Math.floor(Math.random() * 300000); }
    getAvailableFeaturesForPlan() { return ['media', 'text', 'effects']; }
    calculateChurnRisk(signal) { return Math.random(); }
    getDaysSinceSignup() { return Math.floor(Math.random() * 30); }
    getProjectsCreatedToday() { return Math.floor(Math.random() * 3); }
    getTotalProjectsCreated() { return parseInt(localStorage.getItem('total_projects') || '0'); }
    getSaveCount() { return Math.floor(Math.random() * 10); }
    estimateProjectSize() { return Math.floor(Math.random() * 1000); }
    estimateExportSize(settings) { return Math.floor(Math.random() * 100) + 50; }
    estimateProcessingTime() { return Math.floor(Math.random() * 120) + 30; }
    getSubtitleTracks() { return Math.floor(Math.random() * 3); }
    getAudioTracks() { return Math.floor(Math.random() * 3) + 1; }
    getAppliedEffects() { return Math.floor(Math.random() * 5); }
    getDailyExportCount() { return parseInt(localStorage.getItem('daily_exports') || '0'); }
    getTotalExports() { return parseInt(localStorage.getItem('total_exports') || '0'); }
    isCollaborationProject() { return Math.random() > 0.8; }
    getTeamSize() { return Math.floor(Math.random() * 10) + 1; }
    calculateEfficiencyScore() { return Math.random(); }
    
    incrementDailyExports() {
        const current = this.getDailyExportCount();
        localStorage.setItem('daily_exports', (current + 1).toString());
        
        const totalExports = this.getTotalExports();
        localStorage.setItem('total_exports', (totalExports + 1).toString());
    }

    triggerRetentionIntervention(signalType) {
        // Implement retention strategies based on churn signals
        const interventions = {
            quick_exit: 'show_onboarding_help',
            no_interaction: 'highlight_key_features',
            export_limit: 'offer_upgrade_discount'
        };

        const intervention = interventions[signalType];
        if (intervention) {
            analytics.track('Retention Intervention Triggered', {
                user_id: window.app?.currentUser?.email,
                intervention_type: intervention,
                trigger_signal: signalType,
                user_plan: window.app?.currentPlan
            });
        }
    }

    initializeTools() {
        // Initialize tool-specific functionality
        const tools = ['media', 'text', 'audio', 'effects', 'subtitles'];
        tools.forEach(tool => {
            // Set up tool-specific event listeners and functionality
            // This would contain the actual tool implementation
        });
    }
}

// Initialize video editor when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.videoEditor = new VideoEditor();
});

// Global editor functions for HTML onclick handlers
window.switchTool = function(toolName) {
    if (window.videoEditor) {
        window.videoEditor.trackToolUsage(toolName);
    }
    
    // Update UI
    document.querySelectorAll('.tool-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const toolContent = document.getElementById('tool-content');
    if (toolContent) {
        toolContent.innerHTML = `
            <div class="tool-placeholder">
                <h3>${toolName.charAt(0).toUpperCase() + toolName.slice(1)} Tools</h3>
                <p>Advanced ${toolName} tools would be available here.</p>
                <div class="tool-grid">
                    <button class="tool-item" onclick="addElement('${toolName}')">
                        <i class="fas fa-plus"></i>
                        Add ${toolName}
                    </button>
                </div>
            </div>
        `;
    }
};

window.addElement = function(elementType) {
    if (window.videoEditor) {
        const success = window.videoEditor.trackElementAdd(elementType);
        if (success && window.app) {
            window.app.showNotification(`${elementType} added to timeline`, 'success');
        }
    }
};

window.playVideo = function() {
    if (window.videoEditor) {
        window.videoEditor.trackInteraction('video_play');
    }
    
    // Update play button state
    const playBtn = event.target;
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    playBtn.onclick = pauseVideo;
};

window.pauseVideo = function() {
    if (window.videoEditor) {
        window.videoEditor.trackInteraction('video_pause');
    }
    
    // Update pause button state
    const pauseBtn = event.target;
    pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    pauseBtn.onclick = playVideo;
};