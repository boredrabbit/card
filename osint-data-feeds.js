/**
 * OSINT Data Feeds Integration
 * Real-time military aircraft, naval vessels, news, and pattern detection
 */

class OSINTDataFeeds {
    constructor() {
        this.militaryAircraft = [];
        this.navalVessels = [];
        this.newsItems = [];
        this.patterns = [];
        this.anomalies = [];

        // API endpoints
        this.apis = {
            // OpenSky Network - Free flight tracking API
            opensky: 'https://opensky-network.org/api/states/all',

            // ADS-B Exchange (requires API key for full access)
            adsbExchange: 'https://adsbexchange-com1.p.rapidapi.com/v2/mil/',

            // News APIs
            newsApi: 'https://newsapi.org/v2/everything',

            // GDELT for geopolitical events
            gdelt: 'https://api.gdeltproject.org/api/v2/doc/doc'
        };

        // Military aircraft identifiers (ICAO hex codes and callsign patterns)
        this.militaryIdentifiers = {
            usaf: ['AE', 'RCH', 'WING', 'CHIEF', 'SAM', 'AIR FORCE'],
            navy: ['CVN', 'LHD', 'DDG', 'CG'],
            patterns: /^(RCH|WING|VVLL|HUNT|CHIEF|SAM|DUKE)/i
        };

        // Pattern detection thresholds
        this.thresholds = {
            aircraftIncrease: 0.3, // 30% increase triggers alert
            navalMovement: 0.25,   // 25% increase in naval activity
            newsVolume: 0.4,       // 40% increase in military news
            timeWindow: 24 * 60 * 60 * 1000 // 24 hours
        };

        // Historical data for pattern detection
        this.historical = {
            aircraft: [],
            naval: [],
            news: []
        };
    }

    /**
     * Fetch real-time flight data from OpenSky Network
     */
    async fetchFlightData() {
        try {
            const response = await fetch(this.apis.opensky);
            const data = await response.json();

            if (data.states) {
                // Filter for military aircraft
                const military = data.states.filter(state => {
                    const callsign = state[1] ? state[1].trim() : '';
                    return this.militaryIdentifiers.patterns.test(callsign) ||
                           this.isMilitaryHex(state[0]);
                });

                this.militaryAircraft = military.map(state => ({
                    icao24: state[0],
                    callsign: state[1] ? state[1].trim() : 'UNKNOWN',
                    origin: state[2],
                    lat: state[6],
                    lon: state[5],
                    altitude: state[7],
                    velocity: state[9],
                    heading: state[10],
                    lastUpdate: state[3]
                }));

                console.log(`📡 Tracked ${this.militaryAircraft.length} military aircraft`);
                return this.militaryAircraft;
            }
        } catch (error) {
            console.error('Error fetching flight data:', error);
            // Fallback to simulated data for demo
            return this.generateSimulatedFlights();
        }
    }

    /**
     * Check if ICAO hex code belongs to military
     */
    isMilitaryHex(icao) {
        // US Military ICAO ranges
        const usMilitary = [
            { start: 0xADF7C8, end: 0xAFFFFF }, // USAF
            { start: 0xAE0000, end: 0xAE7FFF }  // US Military
        ];

        const icaoNum = parseInt(icao, 16);
        return usMilitary.some(range =>
            icaoNum >= range.start && icaoNum <= range.end
        );
    }

    /**
     * Fetch military/diplomatic news
     */
    async fetchMilitaryNews() {
        try {
            // Using multiple sources for comprehensive coverage
            const keywords = [
                'military deployment',
                'naval exercises',
                'aircraft carrier',
                'diplomatic crisis',
                'defense readiness',
                'strategic bomber',
                'submarine deployment'
            ];

            // Simulate news aggregation (in production, use actual news APIs)
            const news = await this.aggregateNewsFromSources(keywords);
            this.newsItems = news;

            return news;
        } catch (error) {
            console.error('Error fetching news:', error);
            return this.generateSimulatedNews();
        }
    }

    /**
     * Aggregate news from multiple sources
     */
    async aggregateNewsFromSources(keywords) {
        // This would integrate with NewsAPI, GDELT, Reuters, etc.
        // For now, returning structured simulated data

        const sources = [
            'Defense News', 'Reuters Defense', 'USNI News',
            'The Drive', 'Breaking Defense', 'Jane\'s'
        ];

        return this.generateSimulatedNews();
    }

    /**
     * Detect patterns in military activity
     */
    detectPatterns() {
        const now = Date.now();
        const timeWindow = this.thresholds.timeWindow;

        // Filter historical data to last 24 hours
        const recentAircraft = this.historical.aircraft.filter(
            entry => now - entry.timestamp < timeWindow
        );

        const recentNaval = this.historical.naval.filter(
            entry => now - entry.timestamp < timeWindow
        );

        const patterns = [];

        // Check for aircraft surge
        if (recentAircraft.length > 0) {
            const avgPrevious = recentAircraft.slice(0, -1).reduce((sum, e) => sum + e.count, 0) / (recentAircraft.length - 1);
            const current = this.militaryAircraft.length;
            const increase = (current - avgPrevious) / avgPrevious;

            if (increase > this.thresholds.aircraftIncrease) {
                patterns.push({
                    type: 'AIRCRAFT_SURGE',
                    severity: 'HIGH',
                    description: `${(increase * 100).toFixed(0)}% increase in military aircraft activity`,
                    timestamp: now,
                    location: {
                        type: 'global',
                        aircraft: this.militaryAircraft.map(a => ({lat: a.lat, lon: a.lon, callsign: a.callsign}))
                    }
                });
            }
        }

        // Check for geographic clustering
        const clusters = this.detectGeographicClusters(this.militaryAircraft);
        if (clusters.length > 0) {
            clusters.forEach(cluster => {
                patterns.push({
                    type: 'GEOGRAPHIC_CLUSTER',
                    severity: 'MEDIUM',
                    description: `${cluster.count} aircraft clustered near ${cluster.region}`,
                    coordinates: cluster.center,
                    timestamp: now,
                    location: {
                        lat: cluster.center.lat,
                        lon: cluster.center.lon,
                        region: cluster.region,
                        type: 'area',
                        radius: 300
                    }
                });
            });
        }

        this.patterns = patterns;
        return patterns;
    }

    /**
     * Detect geographic clusters of activity
     */
    detectGeographicClusters(assets) {
        // Simple clustering algorithm
        const clusters = [];
        const threshold = 5; // degrees
        const minClusterSize = 3;

        assets.forEach(asset => {
            if (!asset.lat || !asset.lon) return;

            // Find nearby assets
            const nearby = assets.filter(other => {
                if (!other.lat || !other.lon) return false;
                const dist = Math.sqrt(
                    Math.pow(asset.lat - other.lat, 2) +
                    Math.pow(asset.lon - other.lon, 2)
                );
                return dist < threshold;
            });

            if (nearby.length >= minClusterSize) {
                const centerLat = nearby.reduce((sum, a) => sum + a.lat, 0) / nearby.length;
                const centerLon = nearby.reduce((sum, a) => sum + a.lon, 0) / nearby.length;

                clusters.push({
                    count: nearby.length,
                    center: { lat: centerLat, lon: centerLon },
                    region: this.getRegionName(centerLat, centerLon)
                });
            }
        });

        // Remove duplicates
        return this.deduplicateClusters(clusters);
    }

    /**
     * Get region name from coordinates
     */
    getRegionName(lat, lon) {
        // Simplified region mapping
        if (lat > 35 && lat < 55 && lon > -10 && lon < 40) return 'Europe';
        if (lat > 25 && lat < 50 && lon > -130 && lon < -65) return 'North America';
        if (lat > 15 && lat < 35 && lon > 25 && lon < 65) return 'Middle East';
        if (lat > -10 && lat < 35 && lon > 100 && lon < 150) return 'Asia-Pacific';
        return 'Unknown Region';
    }

    /**
     * Remove duplicate clusters
     */
    deduplicateClusters(clusters) {
        const unique = [];
        const threshold = 2;

        clusters.forEach(cluster => {
            const isDuplicate = unique.some(u => {
                const dist = Math.sqrt(
                    Math.pow(cluster.center.lat - u.center.lat, 2) +
                    Math.pow(cluster.center.lon - u.center.lon, 2)
                );
                return dist < threshold;
            });

            if (!isDuplicate) {
                unique.push(cluster);
            }
        });

        return unique;
    }

    /**
     * Generate simulated flight data for demo
     */
    generateSimulatedFlights() {
        const aircraft = [
            { callsign: 'RCH457', lat: 38.8, lon: -77.0, alt: 35000, heading: 45, type: 'C-17', region: 'Washington DC' },
            { callsign: 'WING15', lat: 49.5, lon: 8.5, alt: 28000, heading: 180, type: 'C-130', region: 'Ramstein AB' },
            { callsign: 'SAM908', lat: 38.9, lon: -77.05, alt: 40000, heading: 270, type: 'B757', region: 'Andrews AFB' },
            { callsign: 'CHIEF01', lat: 51.5, lon: -0.1, alt: 38000, heading: 315, type: 'KC-135', region: 'UK Airspace' },
            { callsign: 'HUNT22', lat: 36.1, lon: 140.4, alt: 30000, heading: 90, type: 'P-8', region: 'Pacific' },
            { callsign: 'RCH892', lat: 26.3, lon: 50.1, alt: 32000, heading: 135, type: 'C-17', region: 'Persian Gulf' }
        ];

        return aircraft;
    }

    /**
     * Generate simulated news for demo
     */
    generateSimulatedNews() {
        const news = [
            {
                title: 'U.S. Carrier Strike Group Deploys to Mediterranean',
                source: 'USNI News',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                severity: 'HIGH',
                category: 'NAVAL',
                location: {
                    lat: 35.5,
                    lon: 14.5,
                    region: 'Mediterranean Sea',
                    type: 'vessel',
                    vesselsAffected: ['CVN-75', 'DDG-89', 'CG-67']
                }
            },
            {
                title: 'NATO Conducts Joint Air Exercise Over Baltic States',
                source: 'Defense News',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
                severity: 'MEDIUM',
                category: 'MILITARY',
                location: {
                    lat: 57.0,
                    lon: 24.5,
                    region: 'Baltic States',
                    type: 'area',
                    radius: 300
                }
            },
            {
                title: 'Russian Strategic Bombers Detected Near Alaskan Airspace',
                source: 'The Drive',
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
                severity: 'HIGH',
                category: 'STRATEGIC',
                location: {
                    lat: 60.5,
                    lon: -165.0,
                    region: 'Bering Strait',
                    type: 'aircraft',
                    aircraftAffected: ['HUNT22']
                }
            },
            {
                title: 'Increased Diplomatic Traffic at Pentagon Following Crisis Talks',
                source: 'Reuters',
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
                severity: 'MEDIUM',
                category: 'DIPLOMATIC',
                location: {
                    lat: 38.87,
                    lon: -77.05,
                    region: 'Washington D.C.',
                    type: 'facility'
                }
            }
        ];

        return news;
    }

    /**
     * Update historical data
     */
    updateHistoricalData() {
        const now = Date.now();

        this.historical.aircraft.push({
            timestamp: now,
            count: this.militaryAircraft.length
        });

        // Keep only last 48 hours
        const cutoff = now - (48 * 60 * 60 * 1000);
        this.historical.aircraft = this.historical.aircraft.filter(
            entry => entry.timestamp > cutoff
        );
    }

    /**
     * Start all data feeds
     */
    async startFeeds(updateInterval = 60000) {
        console.log('🚀 Starting OSINT data feeds...');

        // Initial fetch
        await this.fetchFlightData();
        await this.fetchMilitaryNews();
        this.detectPatterns();
        this.updateHistoricalData();

        // Set up periodic updates
        setInterval(async () => {
            await this.fetchFlightData();
            this.detectPatterns();
            this.updateHistoricalData();
        }, updateInterval);

        // News updates less frequently
        setInterval(async () => {
            await this.fetchMilitaryNews();
        }, updateInterval * 5);

        console.log('✅ OSINT feeds active');
    }
}

// Export for use in main HTML
window.OSINTDataFeeds = OSINTDataFeeds;
