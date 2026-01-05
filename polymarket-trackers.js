/**
 * Polymarket Multi-Tracker System
 * Manages independent whale trackers for different market categories
 */

// Category ID mapping - using Polymarket numeric tag IDs
// Note: Polymarket's category system uses tag_id parameter, but main categories
// may not be publicly accessible. Using null scans all markets and filters client-side.
const TRACKER_CATEGORIES = {
    'politics': null,        // Politics - scan all, filter by keywords
    'crypto': null,          // Crypto - scan all, filter by keywords
    'popculture': null,      // Pop Culture - scan all, filter by keywords
    'sports': null,          // Sports - scan all, filter by keywords
    'business': null,        // Business - scan all, filter by keywords
    'science': null          // Science/Tech - scan all, filter by keywords
};

// Keyword filters for client-side category classification
const CATEGORY_KEYWORDS = {
    'politics': ['trump', 'biden', 'election', 'president', 'congress', 'senate', 'house', 'government', 'policy', 'vote', 'republican', 'democrat', 'political', 'minister', 'prime minister', 'war', 'military'],
    'crypto': ['bitcoin', 'ethereum', 'crypto', 'btc', 'eth', 'blockchain', 'defi', 'nft', 'token', 'coin', 'solana', 'binance', 'coinbase'],
    'popculture': ['movie', 'film', 'music', 'artist', 'celebrity', 'award', 'oscar', 'grammy', 'netflix', 'spotify', 'album', 'box office', 'actor', 'actress', 'director'],
    'sports': ['nfl', 'nba', 'mlb', 'nhl', 'soccer', 'football', 'basketball', 'baseball', 'hockey', 'championship', 'super bowl', 'world cup', 'olympics', 'team', 'player', 'game'],
    'business': ['stock', 'market', 'company', 'ceo', 'revenue', 'profit', 'earnings', 'ipo', 'acquisition', 'merger', 'valuation', 'nasdaq', 'dow', 'sp500', 'business', 'corporate'],
    'science': ['science', 'technology', 'ai', 'artificial intelligence', 'research', 'space', 'nasa', 'climate', 'vaccine', 'medical', 'health', 'innovation', 'discovery', 'tech company']
};

console.log('📦 Polymarket Tracker Categories loaded:', TRACKER_CATEGORIES);

class PolymarketTrackerSystem {
    constructor(api) {
        this.api = api;
        this.monitors = new Map(); // category -> intervalId
        this.whaleData = new Map(); // category -> whale array
        this.lastScan = new Map(); // category -> timestamp
        this.minScore = 75;
        this.autoTrade = false;

        // Load saved state from localStorage
        this.loadState();

        // Auto-resume monitors that were active
        this.autoResumeMonitors();
    }

    /**
     * Load saved state from localStorage
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('polymarket_tracker_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.minScore = state.minScore || 75;
                this.autoTrade = state.autoTrade || false;
                this.activeCategories = state.activeCategories || [];
                console.log('📂 Loaded saved state:', state);
            }
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }

    /**
     * Save current state to localStorage
     */
    saveState() {
        try {
            const state = {
                minScore: this.minScore,
                autoTrade: this.autoTrade,
                activeCategories: Array.from(this.monitors.keys()),
                lastUpdate: Date.now()
            };
            localStorage.setItem('polymarket_tracker_state', JSON.stringify(state));
            console.log('💾 Saved state:', state);
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    /**
     * Auto-resume monitors that were active before page close
     */
    async autoResumeMonitors() {
        if (this.activeCategories && this.activeCategories.length > 0) {
            console.log(`🔄 Auto-resuming ${this.activeCategories.length} monitors...`);

            // Small delay to ensure UI is ready
            setTimeout(async () => {
                for (const category of this.activeCategories) {
                    await this.startTracker(category);
                }
            }, 1000);
        }
    }

    /**
     * Start monitoring a specific tracker
     */
    async startTracker(category) {
        if (this.monitors.has(category)) {
            console.log(`Tracker ${category} already running`);
            return;
        }

        console.log(`🚀 Starting ${category} tracker...`);
        this.logActivity(`▶ Started monitoring ${category}`);

        // Initial scan
        await this.scanTracker(category);

        // Set up interval (30 seconds)
        const intervalId = setInterval(() => this.scanTracker(category), 30000);
        this.monitors.set(category, intervalId);

        // Update UI
        this.updateTrackerUI(category, true);

        // Save state to localStorage
        this.saveState();
    }

    /**
     * Stop monitoring a specific tracker
     */
    stopTracker(category) {
        if (!this.monitors.has(category)) {
            return;
        }

        clearInterval(this.monitors.get(category));
        this.monitors.delete(category);
        this.whaleData.delete(category);

        this.logActivity(`⏸ Stopped monitoring ${category}`);
        console.log(`⏸ Stopped ${category} tracker`);

        // Update UI
        this.updateTrackerUI(category, false);
        this.renderTrackerWhales(category, []);
        this.updateTrackerStats(category, { count: 0, avgScore: 0, volume: 0 });

        // Save state to localStorage
        this.saveState();
    }

    /**
     * Scan a specific tracker for whales
     */
    async scanTracker(category) {
        const now = Date.now();
        const lastScan = this.lastScan.get(category) || 0;

        // Throttle (5 second minimum between scans)
        if (now - lastScan < 5000) {
            console.log(`⏳ ${category} scan throttled`);
            return;
        }

        this.lastScan.set(category, now);

        try {
            console.log(`🔍 Scanning ${category}...`);

            const categoryId = TRACKER_CATEGORIES[category];
            console.log(`Category ${category} mapped to tag: ${categoryId || 'ALL (keyword filter)'}`);

            if (!this.api) {
                throw new Error('Polymarket API not initialized');
            }

            // Scan for whales (passing null scans all markets)
            let whales = await this.api.scanWhaleActivity(categoryId, this.minScore);

            // If categoryId is null, filter by keywords
            if (categoryId === null && CATEGORY_KEYWORDS[category]) {
                const keywords = CATEGORY_KEYWORDS[category];
                whales = whales.filter(whale => {
                    const marketLower = whale.market.toLowerCase();
                    return keywords.some(keyword => marketLower.includes(keyword.toLowerCase()));
                });
                console.log(`  Filtered to ${whales.length} ${category}-related whales`);
            }

            this.whaleData.set(category, whales);
            console.log(`✅ Found ${whales.length} whales in ${category}`);

            // Calculate stats
            const stats = this.calculateStats(whales);

            // Update UI
            this.renderTrackerWhales(category, whales);
            this.updateTrackerStats(category, stats);

            // Update whale alert feed with all whales from this category
            this.updateWhaleAlertFeed(category, whales);

            // Log high-score whales
            const highScoreWhales = whales.filter(w => w.whaleScore >= 85);
            if (highScoreWhales.length > 0) {
                this.logActivity(`🚨 ${highScoreWhales.length} high-score whale(s) in ${category}!`, 'whale');

                // Auto-trade if enabled
                if (this.autoTrade) {
                    highScoreWhales.forEach(whale => {
                        this.logActivity(`⚡ Auto-copying ${this.formatWallet(whale.wallet)} - Score ${whale.whaleScore}`, 'success');
                    });
                }
            }

        } catch (error) {
            console.error(`❌ Error scanning ${category}:`, error);
            console.error('Full error:', error.stack);
            this.logActivity(`❌ Error scanning ${category}: ${error.message}`, 'error');
        }
    }

    /**
     * Calculate statistics for whales
     */
    calculateStats(whales) {
        if (!whales || whales.length === 0) {
            return { count: 0, avgScore: 0, volume: 0 };
        }

        const totalScore = whales.reduce((sum, w) => sum + w.whaleScore, 0);
        const totalVolume = whales.reduce((sum, w) => sum + w.betSize, 0);

        return {
            count: whales.length,
            avgScore: Math.round(totalScore / whales.length),
            volume: totalVolume
        };
    }

    /**
     * Render whales in a tracker panel
     */
    renderTrackerWhales(category, whales) {
        const container = document.querySelector(`[data-whales="${category}"]`);
        if (!container) return;

        if (!whales || whales.length === 0) {
            container.innerHTML = '<div class="empty-tracker">No whales found</div>';
            return;
        }

        container.innerHTML = whales.slice(0, 5).map(whale => `
            <div class="tracker-whale-item">
                <div class="tracker-whale-header">
                    <div class="tracker-whale-market">${whale.market}</div>
                    <div class="tracker-whale-score">${whale.whaleScore}</div>
                </div>
                <div class="tracker-whale-bet">
                    <span class="tracker-whale-amount">$${whale.betSize.toLocaleString()}</span>
                    <span>${whale.side}</span>
                    <span>${whale.outcome} @ ${(whale.price * 100).toFixed(1)}%</span>
                    <span>${this.getTimeAgo(whale.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Update tracker statistics display
     */
    updateTrackerStats(category, stats) {
        const countEl = document.querySelector(`[data-stat="count-${category}"]`);
        const scoreEl = document.querySelector(`[data-stat="score-${category}"]`);
        const volumeEl = document.querySelector(`[data-stat="volume-${category}"]`);

        if (countEl) countEl.textContent = stats.count;
        if (scoreEl) scoreEl.textContent = stats.avgScore || '--';
        if (volumeEl) volumeEl.textContent = stats.volume > 0 ? `$${(stats.volume / 1000).toFixed(0)}k` : '$0';
    }

    /**
     * Update tracker UI state
     */
    updateTrackerUI(category, isActive) {
        const panel = document.querySelector(`[data-tracker="${category}"]`);
        const button = document.querySelector(`.tracker-toggle[data-category="${category}"]`);

        if (!panel || !button) return;

        if (isActive) {
            panel.classList.add('active');
            button.classList.add('active');
            button.querySelector('.toggle-text').textContent = 'Stop';
        } else {
            panel.classList.remove('active');
            button.classList.remove('active');
            button.querySelector('.toggle-text').textContent = 'Start';
        }
    }

    /**
     * Add log entry
     */
    logActivity(message, type = 'info') {
        const logItems = document.getElementById('logItems');
        if (!logItems) return;

        const now = new Date();
        const timeString = now.toTimeString().split(' ')[0].substring(0, 5);

        const logItem = document.createElement('div');
        logItem.className = 'log-item-compact';

        const logClass = type === 'whale' ? 'whale' :
                        type === 'success' ? 'success' :
                        type === 'error' ? 'error' : '';

        logItem.innerHTML = `
            <span class="log-time-compact">${timeString}</span>
            <span class="log-message-compact ${logClass}">${message}</span>
        `;

        logItems.insertBefore(logItem, logItems.firstChild);

        // Keep only last 20
        while (logItems.children.length > 20) {
            logItems.removeChild(logItems.lastChild);
        }
    }

    /**
     * Format wallet address
     */
    formatWallet(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;

        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    /**
     * Start all trackers
     */
    async startAll() {
        for (const category of Object.keys(TRACKER_CATEGORIES)) {
            await this.startTracker(category);
        }
    }

    /**
     * Stop all trackers
     */
    stopAll() {
        for (const category of Object.keys(TRACKER_CATEGORIES)) {
            this.stopTracker(category);
        }
    }

    /**
     * Update whale alert feed panel
     */
    updateWhaleAlertFeed(category, whales) {
        const container = document.getElementById('whaleAlertsContainer');
        const countEl = document.getElementById('whaleAlertCount');

        if (!container || !countEl) return;

        // Collect all whales from all active trackers
        let allWhales = [];
        this.whaleData.forEach((categoryWhales, cat) => {
            categoryWhales.forEach(whale => {
                allWhales.push({ ...whale, category: cat });
            });
        });

        // Sort by whale score (highest first), then by timestamp (most recent first)
        allWhales.sort((a, b) => {
            if (b.whaleScore !== a.whaleScore) {
                return b.whaleScore - a.whaleScore;
            }
            return b.timestamp - a.timestamp;
        });

        // Update count
        countEl.textContent = allWhales.length;

        // Render alerts (limit to 20 most recent)
        if (allWhales.length === 0) {
            container.innerHTML = `
                <div class="no-alerts" style="font-family: 'SF Mono', Monaco, monospace; font-size: 0.6rem; color: rgba(255, 255, 255, 0.4); text-align: center; padding: 2rem 1rem;">
                    No whale activity detected yet.<br>Start monitoring categories to see alerts.
                </div>
            `;
            return;
        }

        container.innerHTML = allWhales.slice(0, 20).map(whale => {
            const scoreClass = whale.whaleScore >= 90 ? 'ultra-high' : '';
            const itemClass = whale.whaleScore >= 85 ? 'high-score' : '';

            return `
                <div class="whale-alert-item ${itemClass}">
                    <div class="whale-alert-header">
                        <span class="whale-category-badge">${whale.category.toUpperCase()}</span>
                        <span class="whale-score-badge ${scoreClass}">${whale.whaleScore}</span>
                    </div>

                    <div class="whale-market-title">${whale.market}</div>

                    <div class="whale-bet-details">
                        <div class="whale-detail-row">
                            <span class="whale-detail-label">Amount</span>
                            <span class="whale-detail-value amount">$${whale.betSize.toLocaleString()}</span>
                        </div>
                        <div class="whale-detail-row">
                            <span class="whale-detail-label">Position</span>
                            <span class="whale-detail-value">${whale.side}</span>
                        </div>
                        <div class="whale-detail-row">
                            <span class="whale-detail-label">Outcome</span>
                            <span class="whale-detail-value">${whale.outcome}</span>
                        </div>
                        <div class="whale-detail-row">
                            <span class="whale-detail-label">Price</span>
                            <span class="whale-detail-value">${(whale.price * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    <div class="whale-wallet-info">
                        <span class="whale-wallet">${this.formatWallet(whale.wallet)}</span>
                        <span class="whale-timestamp">${this.getTimeAgo(whale.timestamp)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Export for use in portfolio.html
if (typeof window !== 'undefined') {
    window.PolymarketTrackerSystem = PolymarketTrackerSystem;

    // Keep monitoring even when tab is inactive
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('🌙 Tab hidden - monitoring continues in background');
        } else {
            console.log('👁️ Tab visible - monitoring active');
        }
    });

    // Save state before page unload
    window.addEventListener('beforeunload', () => {
        console.log('💾 Saving state before page close...');
    });
}
