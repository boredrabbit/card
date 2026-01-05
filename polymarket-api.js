/**
 * Polymarket API Integration
 * Real-time whale tracking and copy-trading bot
 */

class PolymarketAPI {
    constructor() {
        this.baseURL = {
            gamma: 'https://gamma-api.polymarket.com',
            clob: 'https://clob.polymarket.com',
            data: 'https://data-api.polymarket.com'
        };

        this.cache = {};
        this.cacheTimeout = 30000; // 30 seconds

        // Track whale wallets and their scores
        this.whaleScores = new Map();
        this.trackedWhales = new Set();

        // Default filters
        this.MIN_WHALE_BET = 5000; // $5k minimum

        // Category cache
        this.categories = null;
        this.categoriesTimestamp = 0;
    }

    /**
     * Fetch with caching
     */
    async fetchWithCache(url, cacheKey) {
        if (this.cache[cacheKey] && (Date.now() - this.cache[cacheKey].timestamp < this.cacheTimeout)) {
            console.log(`Using cached data for ${cacheKey}`);
            return this.cache[cacheKey].data;
        }

        try {
            console.log(`Fetching: ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            this.cache[cacheKey] = {
                data: data,
                timestamp: Date.now()
            };

            return data;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            return null;
        }
    }

    /**
     * Get all available tags/categories
     */
    async getAllTags() {
        // Cache categories for 5 minutes
        if (this.categories && (Date.now() - this.categoriesTimestamp < 300000)) {
            return this.categories;
        }

        try {
            const url = `${this.baseURL.gamma}/tags`;
            console.log(`Fetching all Polymarket categories...`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch tags: ${response.status}`);
            }

            const tags = await response.json();

            // Cache the categories
            this.categories = tags;
            this.categoriesTimestamp = Date.now();

            console.log(`✅ Found ${tags.length} categories`);
            return tags;
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Return common categories as fallback
            return [
                { id: '100381', label: 'Politics' },
                { id: '100382', label: 'Sports' },
                { id: '100383', label: 'Crypto' },
                { id: '100384', label: 'Pop Culture' }
            ];
        }
    }

    /**
     * Get active markets by category (or all if no tag_id specified)
     */
    async getMarketsByCategory(tagId = null, limit = 50) {
        let url = `${this.baseURL.gamma}/markets?closed=false&limit=${limit}`;
        if (tagId) {
            url += `&tag_id=${tagId}`;
        }

        const cacheKey = tagId ? `markets_${tagId}` : 'markets_all';
        const markets = await this.fetchWithCache(url, cacheKey);
        return markets || [];
    }

    /**
     * Get active political markets (backward compatibility)
     */
    async getPoliticalMarkets() {
        return await this.getMarketsByCategory('100381', 50);
    }

    /**
     * Get recent activity for a market
     */
    async getMarketActivity(conditionId, limit = 100) {
        const url = `${this.baseURL.data}/activity?market=${conditionId}&type=TRADE&limit=${limit}`;
        const cacheKey = `market_activity_${conditionId}`;
        return await this.fetchWithCache(url, cacheKey);
    }

    /**
     * Get wallet transaction history
     */
    async getWalletHistory(walletAddress, limit = 500) {
        const url = `${this.baseURL.data}/activity?user=${walletAddress}&limit=${limit}`;
        const cacheKey = `wallet_${walletAddress}`;
        return await this.fetchWithCache(url, cacheKey);
    }

    /**
     * Get wallet positions
     */
    async getWalletPositions(walletAddress) {
        const url = `${this.baseURL.data}/positions?user=${walletAddress}`;
        const cacheKey = `positions_${walletAddress}`;
        return await this.fetchWithCache(url, cacheKey);
    }

    /**
     * Calculate whale score based on transaction history
     * Score factors:
     * - Win rate (40%)
     * - Average bet size (20%)
     * - Total volume (20%)
     * - Bet frequency (10%)
     * - Recent performance (10%)
     */
    async calculateWhaleScore(walletAddress) {
        // Check cache first
        if (this.whaleScores.has(walletAddress)) {
            const cached = this.whaleScores.get(walletAddress);
            if (Date.now() - cached.timestamp < 300000) { // 5 min cache
                return cached.score;
            }
        }

        const history = await this.getWalletHistory(walletAddress);
        if (!history || history.length === 0) {
            return 0;
        }

        // Calculate metrics
        const trades = history.filter(t => t.type === 'TRADE');
        const totalTrades = trades.length;

        if (totalTrades === 0) return 0;

        // Calculate win rate (need to check resolved positions)
        const positions = await this.getWalletPositions(walletAddress);
        const resolvedPositions = positions?.filter(p => p.market?.closed) || [];
        const winningPositions = resolvedPositions.filter(p =>
            (p.cashPnl && parseFloat(p.cashPnl) > 0)
        );
        const winRate = resolvedPositions.length > 0
            ? (winningPositions.length / resolvedPositions.length) * 100
            : 50; // Default 50% if no resolved positions

        // Calculate average bet size
        const totalVolume = trades.reduce((sum, t) =>
            sum + parseFloat(t.usdcSize || 0), 0
        );
        const avgBetSize = totalVolume / totalTrades;

        // Normalize average bet size score (20k+ = 100%)
        const betSizeScore = Math.min(100, (avgBetSize / 20000) * 100);

        // Volume score (normalize to $500k = 100%)
        const volumeScore = Math.min(100, (totalVolume / 500000) * 100);

        // Frequency score (50+ trades = 100%)
        const frequencyScore = Math.min(100, (totalTrades / 50) * 100);

        // Recent performance (last 10 trades)
        const recentTrades = trades.slice(0, 10);
        const recentPositions = await Promise.all(
            recentTrades.map(async (trade) => {
                const marketPositions = positions?.filter(p =>
                    p.market?.condition_id === trade.conditionId
                ) || [];
                return marketPositions[0];
            })
        );
        const recentWins = recentPositions.filter(p =>
            p && p.cashPnl && parseFloat(p.cashPnl) > 0
        ).length;
        const recentPerformance = recentPositions.length > 0
            ? (recentWins / recentPositions.length) * 100
            : 50;

        // Weighted score
        const score = Math.round(
            (winRate * 0.4) +
            (betSizeScore * 0.2) +
            (volumeScore * 0.2) +
            (frequencyScore * 0.1) +
            (recentPerformance * 0.1)
        );

        // Cache the score
        this.whaleScores.set(walletAddress, {
            score: score,
            timestamp: Date.now(),
            metrics: {
                winRate: Math.round(winRate),
                avgBetSize: Math.round(avgBetSize),
                totalVolume: Math.round(totalVolume),
                totalTrades: totalTrades,
                recentPerformance: Math.round(recentPerformance)
            }
        });

        return score;
    }

    /**
     * Scan for whale activity across all or specific categories
     * @param {Array|String|null} categories - Array of tag IDs, single tag ID, or null for all
     * @param {Number} minScore - Minimum whale score to include (default 75)
     */
    async scanWhaleActivity(categories = null, minScore = 75) {
        console.log('🔍 Scanning for whale activity...');

        let allMarkets = [];

        // If no categories specified, scan all markets
        if (!categories) {
            console.log('Fetching all active markets...');
            allMarkets = await this.getMarketsByCategory(null, 100);
        }
        // If single category string
        else if (typeof categories === 'string') {
            console.log(`Fetching markets for category ${categories}...`);
            allMarkets = await this.getMarketsByCategory(categories, 50);
        }
        // If array of categories, fetch each in parallel
        else if (Array.isArray(categories)) {
            console.log(`Fetching markets for ${categories.length} categories...`);
            const marketPromises = categories.map(tagId =>
                this.getMarketsByCategory(tagId, 50)
            );
            const marketArrays = await Promise.all(marketPromises);
            allMarkets = marketArrays.flat();
        }

        console.log(`Found ${allMarkets.length} active markets to scan`);

        const whaleActivity = [];

        // Process markets in batches for better performance
        const BATCH_SIZE = 10;
        for (let i = 0; i < allMarkets.length; i += BATCH_SIZE) {
            const batch = allMarkets.slice(i, i + BATCH_SIZE);

            // Fetch activity for batch in parallel
            const activityPromises = batch.map(market =>
                this.getMarketActivity(market.condition_id)
                    .then(activity => ({ market, activity }))
                    .catch(err => {
                        console.warn(`Failed to fetch activity for ${market.question}:`, err);
                        return { market, activity: null };
                    })
            );

            const batchResults = await Promise.all(activityPromises);

            // Process each market's activity
            for (const { market, activity } of batchResults) {
                if (!activity) continue;

                // Filter for large bets ($20k+)
                const whaleBets = activity.filter(trade =>
                    parseFloat(trade.usdcSize || 0) >= this.MIN_WHALE_BET
                );

                for (const bet of whaleBets) {
                    // Calculate whale score
                    const score = await this.calculateWhaleScore(bet.proxyWallet);

                    // Only include high-scoring whales
                    if (score >= minScore) {
                        const scoreData = this.whaleScores.get(bet.proxyWallet);

                        whaleActivity.push({
                            market: market.question,
                            marketSlug: market.slug,
                            conditionId: market.condition_id,
                            category: market.tags?.[0] || 'Other',
                            wallet: bet.proxyWallet,
                            betSize: parseFloat(bet.usdcSize),
                            side: bet.side,
                            price: parseFloat(bet.price),
                            outcome: bet.outcome,
                            timestamp: bet.timestamp,
                            whaleScore: score,
                            metrics: scoreData.metrics,
                            transactionHash: bet.transactionHash
                        });
                    }
                }
            }

            // Progress logging
            console.log(`Processed ${Math.min(i + BATCH_SIZE, allMarkets.length)}/${allMarkets.length} markets...`);
        }

        // Sort by whale score (highest first)
        whaleActivity.sort((a, b) => b.whaleScore - a.whaleScore);

        console.log(`✅ Found ${whaleActivity.length} high-score whale bets`);
        return whaleActivity;
    }

    /**
     * Get formatted time ago string
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
     * Format currency
     */
    formatCurrency(amount) {
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(2)}M`;
        } else if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(1)}k`;
        } else {
            return `$${amount.toFixed(0)}`;
        }
    }

    /**
     * Format wallet address
     */
    formatWallet(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
}

// Export for use in portfolio.html
if (typeof window !== 'undefined') {
    window.PolymarketAPI = PolymarketAPI;
}
