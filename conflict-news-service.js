/**
 * Conflict Zone News Service
 * Fetches real-time news for conflict zones using multiple news APIs
 * Caches results to minimize API calls
 */

class ConflictNewsService {
    constructor() {
        this.cache = new Map();
        this.cacheTTL = 15 * 60 * 1000; // 15 minutes cache
        this.isLoading = new Map();

        // Search terms for different regions/zones
        this.searchTerms = {
            // Ukraine conflict zones
            'Donetsk City': ['Donetsk', 'Donetsk City', 'DNR'],
            'Bakhmut': ['Bakhmut', 'Artyomovsk'],
            'Avdiivka': ['Avdiivka', 'Avdeevka'],
            'Mariupol': ['Mariupol'],
            'Kherson': ['Kherson', 'Kherson Oblast'],
            'Zaporizhzhia': ['Zaporizhzhia', 'Zaporizhia', 'Zaporozhye'],
            'Luhansk': ['Luhansk', 'Lugansk', 'LNR'],
            'Kharkiv': ['Kharkiv', 'Kharkov'],
            'Mykolaiv': ['Mykolaiv', 'Nikolaev'],
            'Odesa': ['Odesa', 'Odessa'],
            'Kreminna': ['Kreminna', 'Kremenna'],
            'Sievierodonetsk': ['Sievierodonetsk', 'Severodonetsk'],
            'Lysychansk': ['Lysychansk'],
            'Vuhledar': ['Vuhledar', 'Ugledar'],
            'Marinka': ['Marinka'],
            'Pokrovsk': ['Pokrovsk'],
            'Chasiv Yar': ['Chasiv Yar', 'Chasov Yar'],
            'Toretsk': ['Toretsk', 'Dzerzhinsk'],
            'Kupiansk': ['Kupiansk', 'Kupyansk'],
            // Crimea
            'Sevastopol': ['Sevastopol', 'Crimea naval'],
            'Simferopol': ['Simferopol', 'Crimea'],
            'Kerch Bridge': ['Kerch Bridge', 'Crimean Bridge'],
            'Saky Air Base': ['Saky', 'Crimea airbase'],
            'Belbek Air Base': ['Belbek', 'Crimea military'],
            // Gaza/Israel
            'Gaza City': ['Gaza', 'Gaza City', 'Hamas'],
            'Khan Yunis': ['Khan Yunis', 'Khan Younis'],
            'Rafah': ['Rafah', 'Gaza border'],
            'Jerusalem': ['Jerusalem', 'Al-Aqsa'],
            // Syria
            'Aleppo': ['Aleppo', 'Syria conflict'],
            'Idlib': ['Idlib', 'Syria'],
            'Damascus': ['Damascus', 'Syria'],
            // Myanmar
            'Rakhine': ['Rakhine', 'Myanmar conflict'],
            'Chin State': ['Chin State', 'Myanmar'],
            // Sudan
            'Khartoum': ['Khartoum', 'Sudan conflict', 'RSF'],
            'Darfur': ['Darfur', 'Sudan'],
            // Maritime / Shipping Lanes
            'suez-canal': ['Red Sea shipping', 'Houthi attack ship', 'Suez Canal'],
            'persian-gulf-malacca': ['Strait of Hormuz', 'Iran ship seizure', 'Persian Gulf tanker'],
            'malacca-strait': ['Malacca Strait', 'South China Sea shipping', 'Singapore strait'],
            'bosphorus-mediterranean': ['Black Sea grain', 'Bosphorus shipping', 'Ukraine grain corridor'],
            'panama-pacific': ['Panama Canal drought', 'Panama Canal shipping'],
            'panama-uswest': ['Panama Canal', 'Panama shipping delay'],
            'cape-good-hope': ['Cape shipping route', 'Red Sea bypass', 'Cape of Good Hope'],
            'transpacific-west': ['Pacific shipping', 'Asia Pacific trade'],
            'transpacific-east': ['Pacific container shipping', 'US West Coast port'],
            'transatlantic-north': ['Atlantic shipping', 'transatlantic trade'],
            'transatlantic-south': ['Caribbean shipping', 'Gulf of Mexico tanker'],
            'asia-australia': ['Australia China trade', 'Indo-Pacific shipping'],
            // Generic fallback
            'default': ['Ukraine war', 'conflict zone']
        };

        // News API endpoints (using free/public sources)
        this.newsEndpoints = [
            {
                name: 'GNews',
                url: 'https://gnews.io/api/v4/search',
                // Note: GNews requires API key, but we can use their RSS feed approach
            }
        ];
    }

    /**
     * Get search terms for a zone
     */
    getSearchTerms(zoneName) {
        // Try exact match first
        if (this.searchTerms[zoneName]) {
            return this.searchTerms[zoneName];
        }

        // Try partial match
        for (const [key, terms] of Object.entries(this.searchTerms)) {
            if (zoneName.toLowerCase().includes(key.toLowerCase()) ||
                key.toLowerCase().includes(zoneName.toLowerCase())) {
                return terms;
            }
        }

        // Return zone name itself as search term
        return [zoneName];
    }

    /**
     * Fetch news for a specific zone
     * Uses Google News RSS feed (no API key required)
     */
    async fetchNewsForZone(zoneName) {
        const cacheKey = zoneName.toLowerCase();

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.news;
        }

        // Prevent duplicate requests
        if (this.isLoading.get(cacheKey)) {
            return null;
        }

        this.isLoading.set(cacheKey, true);

        try {
            const searchTerms = this.getSearchTerms(zoneName);
            const query = encodeURIComponent(searchTerms[0] + ' war OR conflict OR military');

            // Try multiple CORS proxies in order
            const corsProxies = [
                'https://api.allorigins.win/raw?url=',
                'https://corsproxy.io/?',
                'https://api.codetabs.com/v1/proxy?quest='
            ];

            const googleNewsUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

            let news = null;
            let lastError = null;

            for (const corsProxy of corsProxies) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2500);

                    const response = await fetch(corsProxy + encodeURIComponent(googleNewsUrl), {
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const xmlText = await response.text();
                        news = this.parseGoogleNewsRSS(xmlText);
                        if (news && news.length > 0) break;
                    }
                } catch (proxyError) {
                    lastError = proxyError;
                    continue;
                }
            }

            // If no news fetched, use fallback data
            if (!news || news.length === 0) {
                news = this.getFallbackNews(zoneName);
            }

            // Cache the results
            this.cache.set(cacheKey, {
                news: news,
                timestamp: Date.now()
            });

            this.isLoading.set(cacheKey, false);
            return news;

        } catch (error) {
            console.warn(`Failed to fetch news for ${zoneName}:`, error.message);
            this.isLoading.set(cacheKey, false);

            // Use fallback data
            const fallback = this.getFallbackNews(zoneName);
            this.cache.set(cacheKey, {
                news: fallback,
                timestamp: Date.now()
            });
            return fallback;
        }
    }

    /**
     * Get fallback news/intel for when live feeds are unavailable
     */
    getFallbackNews(zoneName) {
        const fallbackData = {
            // Shipping lanes
            'suez-canal': [
                { title: 'Red Sea shipping disruptions continue amid Houthi attacks', timeAgo: 'Recent', source: 'Maritime Intel' },
                { title: 'Maersk and MSC rerouting vessels via Cape of Good Hope', timeAgo: 'Ongoing', source: 'Industry' }
            ],
            'persian-gulf-malacca': [
                { title: 'Strait of Hormuz tensions elevated amid Iran standoff', timeAgo: 'Recent', source: 'CENTCOM' },
                { title: 'Oil tanker insurance rates spike for Gulf transit', timeAgo: 'Ongoing', source: 'Lloyd\'s' }
            ],
            'malacca-strait': [
                { title: 'South China Sea military exercises reported', timeAgo: 'Recent', source: 'AMTI' },
                { title: 'Singapore port congestion affecting schedules', timeAgo: 'Ongoing', source: 'Port Auth' }
            ],
            'bosphorus-mediterranean': [
                { title: 'Black Sea grain corridor operations continue', timeAgo: 'Recent', source: 'UN' },
                { title: 'Turkish straits traffic at seasonal high', timeAgo: 'Ongoing', source: 'Maritime' }
            ],
            'panama-pacific': [
                { title: 'Panama Canal water levels improving slightly', timeAgo: 'Recent', source: 'ACP' },
                { title: 'Transit restrictions still affecting Neopanamax vessels', timeAgo: 'Ongoing', source: 'Canal Auth' }
            ],
            'cape-good-hope': [
                { title: 'Cape route traffic surge as Red Sea diversions continue', timeAgo: 'Recent', source: 'Shipping Intel' },
                { title: 'South African port capacity under pressure', timeAgo: 'Ongoing', source: 'Transnet' }
            ],
            'panama-uswest': [
                { title: 'Panama Canal draft restrictions impact container shipping', timeAgo: 'Recent', source: 'ACP' },
                { title: 'US West Coast ports see increased congestion', timeAgo: 'Ongoing', source: 'Port LA' }
            ],
            'transpacific-west': [
                { title: 'Asia-Pacific trade volumes remain strong', timeAgo: 'Recent', source: 'Trade Intel' },
                { title: 'Container rates stabilizing on major routes', timeAgo: 'Ongoing', source: 'Freightos' }
            ],
            'transpacific-east': [
                { title: 'US import demand steady from Asian markets', timeAgo: 'Recent', source: 'NRF' },
                { title: 'Long Beach terminal operations normal', timeAgo: 'Ongoing', source: 'Port Auth' }
            ],
            'transatlantic-north': [
                { title: 'Transatlantic shipping lanes operating normally', timeAgo: 'Recent', source: 'NATO Maritime' },
                { title: 'European port throughput at seasonal levels', timeAgo: 'Ongoing', source: 'ESPO' }
            ],
            'transatlantic-south': [
                { title: 'Caribbean shipping traffic stable', timeAgo: 'Recent', source: 'Maritime Intel' },
                { title: 'Gulf of Mexico energy exports continue', timeAgo: 'Ongoing', source: 'EIA' }
            ],
            'asia-australia': [
                { title: 'Australia-Asia trade corridor flows normal', timeAgo: 'Recent', source: 'DFAT' },
                { title: 'Iron ore shipments from Port Hedland steady', timeAgo: 'Ongoing', source: 'Pilbara Ports' }
            ],
            // Conflict zones
            'donetsk city': [
                { title: 'Heavy fighting reported along Donetsk front', timeAgo: 'Recent', source: 'ISW' },
                { title: 'Russian forces continue grinding advances', timeAgo: 'Ongoing', source: 'OSINT' }
            ],
            'bakhmut': [
                { title: 'Bakhmut area sees continued positional battles', timeAgo: 'Recent', source: 'DeepState' },
                { title: 'Ukrainian forces maintain defensive positions', timeAgo: 'Ongoing', source: 'UA MOD' }
            ],
            'gaza city': [
                { title: 'Humanitarian situation remains critical in Gaza', timeAgo: 'Recent', source: 'UN OCHA' },
                { title: 'Ceasefire negotiations ongoing', timeAgo: 'Ongoing', source: 'Diplomatic' }
            ],
            'kharkiv': [
                { title: 'Kharkiv Oblast faces continued shelling', timeAgo: 'Recent', source: 'UA Military' },
                { title: 'Northern border tensions remain elevated', timeAgo: 'Ongoing', source: 'OSINT' }
            ]
        };

        const key = zoneName.toLowerCase();
        if (fallbackData[key]) {
            return fallbackData[key];
        }

        // Generic fallback
        return [
            { title: `Monitoring ${zoneName} - situation developing`, timeAgo: 'Active', source: 'OSINT' }
        ];
    }

    /**
     * Parse Google News RSS XML
     */
    parseGoogleNewsRSS(xmlText) {
        const news = [];

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const items = xmlDoc.querySelectorAll('item');

            items.forEach((item, index) => {
                if (index >= 5) return; // Limit to 5 items

                const title = item.querySelector('title')?.textContent || '';
                const link = item.querySelector('link')?.textContent || '';
                const pubDate = item.querySelector('pubDate')?.textContent || '';
                const source = item.querySelector('source')?.textContent || 'Unknown';

                // Clean up title (remove source suffix)
                const cleanTitle = title.split(' - ')[0].trim();

                // Parse date
                const date = new Date(pubDate);
                const timeAgo = this.getTimeAgo(date);

                news.push({
                    title: cleanTitle,
                    link: link,
                    source: source,
                    date: date,
                    timeAgo: timeAgo
                });
            });
        } catch (error) {
            console.warn('Error parsing news RSS:', error);
        }

        return news;
    }

    /**
     * Get human-readable time ago string
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    /**
     * Get cached news immediately (sync)
     * Returns cached data or null if not available
     */
    getCachedNews(zoneName) {
        const cacheKey = zoneName.toLowerCase();
        const cached = this.cache.get(cacheKey);

        if (cached) {
            return cached.news;
        }

        // Trigger async fetch for next time
        this.fetchNewsForZone(zoneName);

        return null;
    }

    /**
     * Preload news for priority zones - fast parallel loading
     */
    preloadNews() {
        // Priority shipping lanes first (most likely to be hovered)
        const priorityShippingLanes = [
            'suez-canal',
            'persian-gulf-malacca',
            'malacca-strait',
            'bosphorus-mediterranean'
        ];

        // Priority conflict zones
        const priorityConflictZones = [
            'Donetsk City',
            'Bakhmut',
            'Gaza City',
            'Kharkiv'
        ];

        // Batch 1: Fire off shipping lanes immediately (parallel)
        priorityShippingLanes.forEach(zone => {
            this.fetchNewsForZone(zone);
        });

        // Batch 2: Conflict zones after short delay (parallel)
        setTimeout(() => {
            priorityConflictZones.forEach(zone => {
                this.fetchNewsForZone(zone);
            });
        }, 500);
    }

    /**
     * Preload a specific zone immediately (for on-demand loading)
     */
    preloadZone(zoneName) {
        if (!this.cache.has(zoneName.toLowerCase()) && !this.isLoading.get(zoneName.toLowerCase())) {
            this.fetchNewsForZone(zoneName);
        }
    }
}

// Initialize global instance
window.conflictNewsService = new ConflictNewsService();

// Preload news IMMEDIATELY on script load (don't wait for page load)
window.conflictNewsService.preloadNews();
