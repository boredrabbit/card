/**
 * Real-time News Aggregator
 * Fetches breaking news from Twitter accounts via RSS bridges and other sources
 */

class NewsAggregator {
    constructor() {
        this.newsItems = [];
        this.maxItems = 50; // Keep last 50 items
        this.updateInterval = 15000; // Update every 15 seconds (faster!)

        // Twitter accounts to follow (via Nitter RSS)
        // PRIORITY ACCOUNTS - checked first and most frequently
        this.twitterAccounts = [
            { handle: 'zoomerfied', category: 'breaking', priority: true },
            { handle: 'DeItaone', category: 'breaking', priority: true },
            { handle: 'FirstSquawk', category: 'markets' },
            { handle: 'Fxhedgers', category: 'markets' },
            { handle: 'unusual_whales', category: 'crypto' },
            { handle: 'zerohedge', category: 'markets' },
            { handle: 'WSJ', category: 'markets' },
            { handle: 'Bloomberg', category: 'markets' },
            { handle: 'business', category: 'markets' },
            // Crypto-specific accounts
            { handle: 'VitalikButerin', category: 'crypto' },
            { handle: 'cz_binance', category: 'crypto' },
            { handle: 'APompliano', category: 'crypto' },
            { handle: 'DocumentingBTC', category: 'crypto' },
            // TCG/Collectibles accounts
            { handle: 'PokeBeach', category: 'collectibles' },
            { handle: 'PokemonTCG', category: 'collectibles' },
            { handle: 'OnePieceTCGNews', category: 'collectibles' },
            { handle: 'PrimetimePokemon', category: 'collectibles' },
            // Polymarket-specific accounts
            { handle: 'PolymarketHQ', category: 'polymarket' },
            { handle: 'ThePolymarket', category: 'polymarket' },
            { handle: 'CalebandBrown', category: 'polymarket' },
            { handle: 'PredictIt', category: 'polymarket' }
        ];

        // Nitter instances (backup mirrors in case one is down)
        this.nitterInstances = [
            'nitter.poast.org',
            'nitter.net',
            'nitter.privacydev.net',
            'nitter.unixfox.eu'
        ];

        this.currentNitterIndex = 0;
    }

    /**
     * Get next available Nitter instance
     */
    getNextNitterInstance() {
        const instance = this.nitterInstances[this.currentNitterIndex];
        this.currentNitterIndex = (this.currentNitterIndex + 1) % this.nitterInstances.length;
        return instance;
    }

    /**
     * Fetch tweets from a specific account using Nitter RSS
     */
    async fetchTwitterAccount(handle, category) {
        const nitterInstance = this.getNextNitterInstance();
        const rssUrl = `https://${nitterInstance}/${handle}/rss`;

        try {
            const response = await fetch(rssUrl);
            if (!response.ok) {
                console.warn(`Failed to fetch ${handle} from ${nitterInstance}`);
                return [];
            }

            const text = await response.text();
            return this.parseRSS(text, handle, category);
        } catch (error) {
            console.error(`Error fetching ${handle}:`, error);
            return [];
        }
    }

    /**
     * Parse RSS feed and extract news items
     */
    parseRSS(xmlText, source, category) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'text/xml');
        const items = xml.querySelectorAll('item');
        const news = [];

        items.forEach((item, index) => {
            if (index >= 5) return; // Only get latest 5 tweets per account

            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';

            // Clean up description (remove HTML tags)
            const cleanDesc = description.replace(/<[^>]*>/g, '').trim();

            // Calculate time ago
            const timeAgo = this.getTimeAgo(new Date(pubDate));

            news.push({
                id: `twitter_${source}_${Date.parse(pubDate)}`,
                source: `@${source}`,
                category: category,
                title: title.substring(0, 200), // Limit title length
                excerpt: cleanDesc.substring(0, 300), // Limit excerpt length
                link: link,
                timestamp: Date.parse(pubDate),
                timeAgo: timeAgo
            });
        });

        return news;
    }

    /**
     * Calculate "time ago" string
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    /**
     * Fetch from alternative RSS sources (Bloomberg, Reuters, etc.)
     */
    async fetchRSSFeed(url, source, category) {
        try {
            // Use CORS proxy for cross-origin requests
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();

            return this.parseRSS(data.contents, source, category);
        } catch (error) {
            console.error(`Error fetching RSS from ${source}:`, error);
            return [];
        }
    }

    /**
     * Fetch all news from all sources
     */
    async fetchAllNews() {
        const promises = [];

        // Fetch Twitter accounts
        this.twitterAccounts.forEach(account => {
            promises.push(this.fetchTwitterAccount(account.handle, account.category));
        });

        // Fetch traditional RSS feeds - EXPANDED LIST
        promises.push(
            // Bloomberg feeds
            this.fetchRSSFeed('https://feeds.bloomberg.com/markets/news.rss', 'Bloomberg Markets', 'markets'),
            this.fetchRSSFeed('https://feeds.bloomberg.com/politics/news.rss', 'Bloomberg Politics', 'policy'),
            this.fetchRSSFeed('https://feeds.bloomberg.com/technology/news.rss', 'Bloomberg Tech', 'markets'),

            // Reuters feeds
            this.fetchRSSFeed('https://www.reuters.com/rssfeed/businessNews', 'Reuters Business', 'markets'),
            this.fetchRSSFeed('https://www.reuters.com/rssfeed/marketsNews', 'Reuters Markets', 'markets'),

            // CNBC feeds
            this.fetchRSSFeed('https://www.cnbc.com/id/100003114/device/rss/rss.html', 'CNBC', 'markets'),
            this.fetchRSSFeed('https://www.cnbc.com/id/15839135/device/rss/rss.html', 'CNBC Top News', 'breaking'),

            // Financial Times
            this.fetchRSSFeed('https://www.ft.com/markets?format=rss', 'FT Markets', 'markets'),

            // Wall Street Journal
            this.fetchRSSFeed('https://feeds.a.dj.com/rss/RSSMarketsMain.xml', 'WSJ Markets', 'markets'),
            this.fetchRSSFeed('https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml', 'WSJ Business', 'markets'),

            // Seeking Alpha
            this.fetchRSSFeed('https://seekingalpha.com/market_currents.xml', 'Seeking Alpha', 'markets'),

            // MarketWatch
            this.fetchRSSFeed('https://www.marketwatch.com/rss/topstories', 'MarketWatch', 'markets'),

            // Crypto-specific feeds
            this.fetchRSSFeed('https://www.coindesk.com/arc/outboundfeeds/rss/', 'CoinDesk', 'crypto'),
            this.fetchRSSFeed('https://www.theblock.co/rss.xml', 'The Block', 'crypto'),
            this.fetchRSSFeed('https://cointelegraph.com/rss', 'Cointelegraph', 'crypto'),
            this.fetchRSSFeed('https://decrypt.co/feed', 'Decrypt', 'crypto'),

            // TCG/Collectibles feeds
            this.fetchRSSFeed('https://www.pokebeach.com/feed', 'PokeBeach', 'collectibles'),
            this.fetchRSSFeed('https://www.tcgplayer.com/blog/feed', 'TCGPlayer Blog', 'collectibles')
        );

        const results = await Promise.allSettled(promises);

        // Combine all news items
        const allNews = [];
        results.forEach(result => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                allNews.push(...result.value);
            }
        });

        // Sort by timestamp (newest first)
        allNews.sort((a, b) => b.timestamp - a.timestamp);

        // Remove duplicates based on similar titles
        const uniqueNews = this.removeDuplicates(allNews);

        // Keep only the most recent items
        this.newsItems = uniqueNews.slice(0, this.maxItems);

        return this.newsItems;
    }

    /**
     * Remove duplicate news items
     */
    removeDuplicates(items) {
        const seen = new Set();
        return items.filter(item => {
            // Create a normalized version of the title for comparison
            const normalized = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
            if (seen.has(normalized)) {
                return false;
            }
            seen.add(normalized);
            return true;
        });
    }

    /**
     * Start auto-updating news feed
     */
    startAutoUpdate(callback) {
        // Fetch priority accounts FIRST for instant news (fast!)
        const priorityAccounts = this.twitterAccounts.filter(acc => acc.priority);
        const priorityPromises = priorityAccounts.map(acc =>
            this.fetchTwitterAccount(acc.handle, acc.category)
        );

        Promise.allSettled(priorityPromises).then(results => {
            const priorityNews = [];
            results.forEach(result => {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    priorityNews.push(...result.value);
                }
            });

            if (priorityNews.length > 0) {
                priorityNews.sort((a, b) => b.timestamp - a.timestamp);
                this.newsItems = this.removeDuplicates(priorityNews);
                console.log(`⚡ Quick load: ${this.newsItems.length} priority news items`);
                callback(this.newsItems); // INSTANT callback with priority news
            }

            // Then fetch everything else in background
            this.fetchAllNews().then(allNews => {
                console.log(`📰 Full load: ${allNews.length} total news items`);
                callback(allNews);
            });
        });

        // Fast polling for priority accounts (every 10 seconds)
        setInterval(async () => {
            const priorityAccounts = this.twitterAccounts.filter(acc => acc.priority);
            const promises = priorityAccounts.map(acc =>
                this.fetchTwitterAccount(acc.handle, acc.category)
            );

            const results = await Promise.allSettled(promises);
            const newItems = [];
            results.forEach(result => {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    newItems.push(...result.value);
                }
            });

            if (newItems.length > 0) {
                // Merge with existing items
                const combined = [...newItems, ...this.newsItems];
                combined.sort((a, b) => b.timestamp - a.timestamp);
                this.newsItems = this.removeDuplicates(combined).slice(0, this.maxItems);
                callback(this.newsItems);
            }
        }, 10000); // Check priority accounts every 10 seconds

        // Full update for all accounts (every 15 seconds)
        setInterval(async () => {
            const news = await this.fetchAllNews();
            callback(news);
        }, this.updateInterval);
    }

    /**
     * Add custom Twitter account
     */
    addTwitterAccount(handle, category = 'markets') {
        this.twitterAccounts.push({ handle, category });
    }

    /**
     * Remove Twitter account
     */
    removeTwitterAccount(handle) {
        this.twitterAccounts = this.twitterAccounts.filter(
            account => account.handle !== handle
        );
    }

    /**
     * Filter news by category
     * @param {string} category - 'all', 'crypto', 'stocks', 'collectibles', 'polymarket'
     * @returns {Array} Filtered news items
     */
    filterByCategory(category) {
        if (category === 'all') {
            return this.newsItems;
        }

        return this.newsItems.filter(item => {
            // Direct category match
            if (item.category === category) {
                return true;
            }

            // For stocks category, include general markets news
            if (category === 'stocks' && (item.category === 'markets' || item.category === 'breaking')) {
                return true;
            }

            // For crypto, only show crypto-specific news
            if (category === 'crypto' && item.category === 'crypto') {
                return true;
            }

            // For collectibles, only show collectibles news
            if (category === 'collectibles' && item.category === 'collectibles') {
                return true;
            }

            // For polymarket, show polymarket + general markets/breaking news
            if (category === 'polymarket') {
                return item.category === 'polymarket' ||
                       item.category === 'markets' ||
                       item.category === 'breaking';
            }

            return false;
        });
    }
}

// Export for use in portfolio.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsAggregator;
}
