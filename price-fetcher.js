/**
 * Live Price Data Fetcher
 * Fetches real-time prices for crypto and stocks
 */

class PriceFetcher {
    constructor() {
        this.cache = {};
        this.cacheTimeout = 10000; // Cache for 10 seconds
        this.updateCallbacks = new Map();
    }

    /**
     * Fetch crypto prices from CoinGecko (free, no API key needed)
     */
    async fetchCryptoPrice(symbol) {
        const coinIds = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'SOL': 'solana',
            'MATIC': 'matic-network',
            'AVAX': 'avalanche-2'
        };

        const coinId = coinIds[symbol];
        if (!coinId) {
            console.warn(`Unknown crypto symbol: ${symbol}`);
            return null;
        }

        const cacheKey = `crypto_${symbol}`;
        if (this.isCached(cacheKey)) {
            console.log(`Using cached data for ${symbol}`);
            return this.cache[cacheKey].data;
        }

        try {
            console.log(`Fetching ${symbol} price from CoinGecko...`);
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to fetch crypto price: ${response.status}`);
            }

            const data = await response.json();
            console.log(`CoinGecko response for ${symbol}:`, data);

            const coinData = data[coinId];

            if (!coinData) {
                console.error(`No data for ${coinId} in response`);
                return null;
            }

            const priceData = {
                symbol: symbol,
                price: coinData.usd,
                change24h: coinData.usd_24h_change || 0,
                volume24h: coinData.usd_24h_vol || 0,
                marketCap: coinData.usd_market_cap || 0,
                timestamp: Date.now()
            };

            console.log(`✅ ${symbol} price fetched:`, priceData);

            this.cache[cacheKey] = {
                data: priceData,
                timestamp: Date.now()
            };

            return priceData;
        } catch (error) {
            console.error(`❌ Error fetching ${symbol} price:`, error);
            console.error('Error details:', error.message, error.stack);
            return null;
        }
    }

    /**
     * Fetch stock prices - fallback to simulated data if API fails
     */
    async fetchStockPrice(symbol) {
        const cacheKey = `stock_${symbol}`;
        if (this.isCached(cacheKey)) {
            console.log(`Using cached data for ${symbol}`);
            return this.cache[cacheKey].data;
        }

        // Simulated stock data as fallback
        const simulatedPrices = {
            'AAPL': { price: 175.43, change: 1.8 },
            'TSLA': { price: 242.84, change: -2.3 },
            'SPX': { price: 4783.45, change: 0.9 },
            'MSFT': { price: 374.52, change: 0.5 },
            'GOOGL': { price: 140.23, change: 1.2 }
        };

        try {
            console.log(`Attempting to fetch ${symbol} stock price...`);

            // Try Finnhub API first (demo token has limits)
            const response = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=demo`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                console.warn(`Finnhub API error: ${response.status}, using simulated data`);
                throw new Error('API not available');
            }

            const data = await response.json();
            console.log(`Finnhub response for ${symbol}:`, data);

            // Check if we got valid data
            if (!data.c || data.c === 0) {
                throw new Error('No valid price data');
            }

            const priceData = {
                symbol: symbol,
                price: data.c, // current price
                change24h: data.dp || 0, // percent change
                high24h: data.h || data.c,
                low24h: data.l || data.c,
                open: data.o || data.c,
                previousClose: data.pc || data.c,
                timestamp: Date.now()
            };

            console.log(`✅ ${symbol} stock price fetched:`, priceData);

            this.cache[cacheKey] = {
                data: priceData,
                timestamp: Date.now()
            };

            return priceData;
        } catch (error) {
            console.warn(`⚠️ Using simulated data for ${symbol}:`, error.message);

            // Fallback to simulated data
            const simData = simulatedPrices[symbol] || { price: 100, change: 0 };
            const priceData = {
                symbol: symbol,
                price: simData.price + (Math.random() - 0.5) * 2, // Add small variation
                change24h: simData.change + (Math.random() - 0.5) * 0.5,
                high24h: simData.price * 1.02,
                low24h: simData.price * 0.98,
                timestamp: Date.now(),
                simulated: true
            };

            this.cache[cacheKey] = {
                data: priceData,
                timestamp: Date.now()
            };

            return priceData;
        }
    }

    /**
     * Fetch ticker tape data (multiple symbols at once)
     */
    async fetchTickerData() {
        const tickers = [
            { symbol: 'BTC', type: 'crypto' },
            { symbol: 'ETH', type: 'crypto' },
            { symbol: 'AAPL', type: 'stock' },
            { symbol: 'TSLA', type: 'stock' },
            { symbol: 'SPX', type: 'stock' }
        ];

        const promises = tickers.map(async (ticker) => {
            const data = ticker.type === 'crypto'
                ? await this.fetchCryptoPrice(ticker.symbol)
                : await this.fetchStockPrice(ticker.symbol);

            if (data) {
                return {
                    symbol: ticker.symbol,
                    price: data.price,
                    change: data.change24h,
                    type: ticker.type
                };
            }
            return null;
        });

        const results = await Promise.all(promises);
        return results.filter(r => r !== null);
    }

    /**
     * Check if cached data is still valid
     */
    isCached(key) {
        if (!this.cache[key]) return false;
        const age = Date.now() - this.cache[key].timestamp;
        return age < this.cacheTimeout;
    }

    /**
     * Start auto-updating a specific symbol
     */
    startAutoUpdate(symbol, type, callback, interval = 10000) {
        const updateFn = async () => {
            const data = type === 'crypto'
                ? await this.fetchCryptoPrice(symbol)
                : await this.fetchStockPrice(symbol);

            if (data) {
                callback(data);
            }
        };

        // Initial fetch
        updateFn();

        // Set up interval
        const intervalId = setInterval(updateFn, interval);

        // Store callback reference for cleanup
        const key = `${type}_${symbol}`;
        if (this.updateCallbacks.has(key)) {
            clearInterval(this.updateCallbacks.get(key));
        }
        this.updateCallbacks.set(key, intervalId);

        return intervalId;
    }

    /**
     * Stop auto-updating a symbol
     */
    stopAutoUpdate(symbol, type) {
        const key = `${type}_${symbol}`;
        if (this.updateCallbacks.has(key)) {
            clearInterval(this.updateCallbacks.get(key));
            this.updateCallbacks.delete(key);
        }
    }

    /**
     * Format price for display
     */
    formatPrice(price, symbol) {
        if (price >= 1000) {
            return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (price >= 1) {
            return '$' + price.toFixed(2);
        } else {
            return '$' + price.toFixed(4);
        }
    }

    /**
     * Format large numbers (volume, market cap)
     */
    formatLargeNumber(num) {
        if (num >= 1e12) {
            return '$' + (num / 1e12).toFixed(2) + 'T';
        } else if (num >= 1e9) {
            return '$' + (num / 1e9).toFixed(2) + 'B';
        } else if (num >= 1e6) {
            return '$' + (num / 1e6).toFixed(2) + 'M';
        } else {
            return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        }
    }

    /**
     * Format percentage change
     */
    formatChange(change) {
        const sign = change >= 0 ? '+' : '';
        return sign + change.toFixed(2) + '%';
    }
}
