/**
 * Shipping Lane Risk Assessment Service
 *
 * Computes dynamic risk scores for maritime shipping lanes based on:
 * - Active conflict zones proximity
 * - Geopolitical tensions (Iran, China, Russia, etc.)
 * - Recent incidents (attacks, seizures, blockades)
 * - Chokepoint vulnerability
 * - Alternative route availability
 *
 * Risk scores are 0-100 where:
 * 0-25: LOW - Normal operations
 * 26-50: ELEVATED - Increased monitoring advised
 * 51-75: HIGH - Active threats, consider alternatives
 * 76-100: CRITICAL - Active hostilities, avoid if possible
 */

class ShippingLaneRiskService {
    constructor() {
        this.riskCache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minute cache
        this.lastUpdate = Date.now();

        // Geopolitical risk factors - these would ideally come from real-time feeds
        // Each factor contributes to risk scores for affected routes
        this.geopoliticalFactors = this.initializeGeopoliticalFactors();

        // Recent incidents affecting shipping
        this.recentIncidents = this.initializeIncidents();

        // Start periodic updates
        this.startRiskMonitoring();
    }

    /**
     * Initialize geopolitical risk factors
     * In production, these would be updated from news feeds, government advisories, etc.
     */
    initializeGeopoliticalFactors() {
        return {
            // Red Sea / Houthi Crisis
            'red-sea-houthi': {
                name: 'Red Sea Houthi Attacks',
                active: true,
                severity: 85,
                startDate: '2023-11-19',
                description: 'Houthi militants targeting commercial shipping in Red Sea/Gulf of Aden',
                affectedRoutes: ['suez-canal', 'persian-gulf-malacca'],
                affectedChokepoints: ['Bab el-Mandeb', 'Gulf of Aden'],
                source: 'US CENTCOM / Lloyd\'s List'
            },

            // Iran tensions
            'iran-hormuz': {
                name: 'Iran-US Tensions (Strait of Hormuz)',
                active: true,
                severity: 65,
                description: 'Ongoing US-Iran tensions, periodic vessel seizures',
                affectedRoutes: ['persian-gulf-malacca'],
                affectedChokepoints: ['Strait of Hormuz'],
                source: 'UKMTO / US 5th Fleet'
            },

            // South China Sea
            'south-china-sea': {
                name: 'South China Sea Disputes',
                active: true,
                severity: 45,
                description: 'China-Philippines tensions, military exercises, reef disputes',
                affectedRoutes: ['malacca-strait', 'asia-australia'],
                affectedChokepoints: ['Spratly Islands', 'Scarborough Shoal'],
                source: 'AMTI / Philippine Coast Guard'
            },

            // Taiwan Strait
            'taiwan-strait': {
                name: 'Taiwan Strait Tensions',
                active: true,
                severity: 40,
                description: 'China-Taiwan military activity, potential blockade risk',
                affectedRoutes: ['malacca-strait', 'transpacific-west'],
                affectedChokepoints: ['Taiwan Strait'],
                source: 'Taiwan MND / US 7th Fleet'
            },

            // Black Sea / Ukraine
            'black-sea-ukraine': {
                name: 'Russia-Ukraine Black Sea Conflict',
                active: true,
                severity: 70,
                description: 'Naval warfare, mine risk, grain corridor disruptions',
                affectedRoutes: ['bosphorus-mediterranean'],
                affectedChokepoints: ['Bosphorus', 'Black Sea'],
                source: 'Ukrainian Navy / IMO'
            },

            // Somali piracy (reduced but present)
            'somalia-piracy': {
                name: 'Gulf of Aden Piracy',
                active: true,
                severity: 25,
                description: 'Reduced but persistent piracy threat',
                affectedRoutes: ['suez-canal', 'cape-good-hope'],
                affectedChokepoints: ['Gulf of Aden'],
                source: 'IMB Piracy Reporting Centre'
            },

            // Panama Canal drought
            'panama-drought': {
                name: 'Panama Canal Drought Restrictions',
                active: true,
                severity: 35,
                description: 'Water levels limiting transits, 30%+ reduction in capacity',
                affectedRoutes: ['panama-pacific', 'panama-uswest'],
                affectedChokepoints: ['Panama Canal'],
                source: 'Panama Canal Authority'
            },

            // Gulf of Guinea piracy
            'guinea-piracy': {
                name: 'Gulf of Guinea Maritime Crime',
                active: true,
                severity: 30,
                description: 'Kidnapping, armed robbery, oil theft',
                affectedRoutes: ['cape-good-hope'],
                affectedChokepoints: ['Gulf of Guinea'],
                source: 'IMB / MDAT-GoG'
            }
        };
    }

    /**
     * Initialize recent incidents
     * Would be updated from real-time incident feeds
     */
    initializeIncidents() {
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;

        return [
            {
                id: 'inc-001',
                type: 'missile_attack',
                description: 'Houthi anti-ship missile strike on container vessel',
                location: 'Red Sea, 50nm SW of Hodeidah',
                date: now - 2 * day,
                affectedRoutes: ['suez-canal'],
                severity: 80,
                source: 'UKMTO'
            },
            {
                id: 'inc-002',
                type: 'drone_attack',
                description: 'UAV attack on tanker, minor damage',
                location: 'Gulf of Aden',
                date: now - 5 * day,
                affectedRoutes: ['suez-canal', 'persian-gulf-malacca'],
                severity: 70,
                source: 'US CENTCOM'
            },
            {
                id: 'inc-003',
                type: 'military_exercise',
                description: 'PLA Navy live-fire exercises',
                location: 'South China Sea, near Scarborough Shoal',
                date: now - 3 * day,
                affectedRoutes: ['malacca-strait'],
                severity: 40,
                source: 'PLA Daily'
            },
            {
                id: 'inc-004',
                type: 'vessel_seizure',
                description: 'IRGC boarding of tanker in Hormuz',
                location: 'Strait of Hormuz',
                date: now - 10 * day,
                affectedRoutes: ['persian-gulf-malacca'],
                severity: 65,
                source: 'Reuters'
            },
            {
                id: 'inc-005',
                type: 'mine_warning',
                description: 'Suspected mine sighting reported',
                location: 'Western Black Sea',
                date: now - 7 * day,
                affectedRoutes: ['bosphorus-mediterranean'],
                severity: 55,
                source: 'Turkish Navy'
            }
        ];
    }

    /**
     * Start periodic risk monitoring
     */
    startRiskMonitoring() {
        // Update risk factors periodically (simulating real-time feed)
        setInterval(() => {
            this.updateRiskFactors();
        }, 60000); // Every minute
    }

    /**
     * Update risk factors with simulated real-time changes
     */
    updateRiskFactors() {
        const now = Date.now();
        this.lastUpdate = now;

        // Simulate minor fluctuations in risk levels
        Object.values(this.geopoliticalFactors).forEach(factor => {
            // Random fluctuation ±5
            const fluctuation = (Math.random() - 0.5) * 10;
            factor.severity = Math.max(10, Math.min(95, factor.severity + fluctuation));
        });

        // Occasionally add new incidents
        if (Math.random() < 0.1) {
            this.addRandomIncident();
        }

        // Clear cache to force recalculation
        this.riskCache.clear();
    }

    /**
     * Add a random incident for simulation
     */
    addRandomIncident() {
        const incidentTypes = [
            { type: 'suspicious_approach', severity: 30, desc: 'Suspicious vessel approach reported' },
            { type: 'military_activity', severity: 45, desc: 'Naval patrol activity increased' },
            { type: 'weather_warning', severity: 25, desc: 'Severe weather advisory issued' },
            { type: 'port_congestion', severity: 20, desc: 'Major port congestion reported' }
        ];

        const routes = ['suez-canal', 'malacca-strait', 'persian-gulf-malacca', 'bosphorus-mediterranean'];
        const incident = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
        const route = routes[Math.floor(Math.random() * routes.length)];

        this.recentIncidents.unshift({
            id: `inc-${Date.now()}`,
            type: incident.type,
            description: incident.desc,
            location: this.getRouteRegion(route),
            date: Date.now(),
            affectedRoutes: [route],
            severity: incident.severity,
            source: 'Maritime Advisory'
        });

        // Keep only last 20 incidents
        if (this.recentIncidents.length > 20) {
            this.recentIncidents.pop();
        }
    }

    /**
     * Get region name for a route
     */
    getRouteRegion(routeId) {
        const regions = {
            'suez-canal': 'Red Sea / Gulf of Aden',
            'malacca-strait': 'South China Sea',
            'persian-gulf-malacca': 'Strait of Hormuz',
            'bosphorus-mediterranean': 'Black Sea',
            'panama-pacific': 'Panama Canal Zone',
            'panama-uswest': 'Panama Canal Zone',
            'cape-good-hope': 'South Atlantic',
            'transpacific-west': 'Western Pacific',
            'transpacific-east': 'Eastern Pacific',
            'transatlantic-north': 'North Atlantic',
            'transatlantic-south': 'Central Atlantic',
            'asia-australia': 'Coral Sea'
        };
        return regions[routeId] || 'Unknown Region';
    }

    /**
     * Calculate comprehensive risk score for a shipping lane
     * @param {string} routeId - The route identifier
     * @returns {object} Risk assessment with score and breakdown
     */
    calculateRiskScore(routeId) {
        // Check cache
        const cached = this.riskCache.get(routeId);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        let totalRisk = 0;
        const riskFactors = [];
        const activeThreats = [];

        // 1. Geopolitical factors (weight: 50%)
        Object.entries(this.geopoliticalFactors).forEach(([key, factor]) => {
            if (factor.active && factor.affectedRoutes.includes(routeId)) {
                const contribution = factor.severity * 0.5;
                totalRisk += contribution;
                riskFactors.push({
                    name: factor.name,
                    contribution: Math.round(contribution),
                    severity: factor.severity,
                    source: factor.source
                });
                activeThreats.push(factor.name);
            }
        });

        // 2. Recent incidents (weight: 30%)
        const recentWindow = 14 * 24 * 60 * 60 * 1000; // 14 days
        const now = Date.now();

        this.recentIncidents.forEach(incident => {
            if (incident.affectedRoutes.includes(routeId) && (now - incident.date) < recentWindow) {
                // Decay factor - more recent = higher impact
                const ageHours = (now - incident.date) / (60 * 60 * 1000);
                const decayFactor = Math.max(0.3, 1 - (ageHours / (14 * 24)));
                const contribution = incident.severity * 0.3 * decayFactor;
                totalRisk += contribution;

                riskFactors.push({
                    name: incident.description,
                    contribution: Math.round(contribution),
                    severity: incident.severity,
                    source: incident.source,
                    date: incident.date
                });
            }
        });

        // 3. Base route vulnerability (weight: 20%)
        const baseVulnerability = this.getBaseVulnerability(routeId);
        totalRisk += baseVulnerability * 0.2;

        // Normalize to 0-100
        totalRisk = Math.min(100, Math.round(totalRisk));

        // Determine risk level
        let riskLevel, riskLabel;
        if (totalRisk <= 25) {
            riskLevel = 'LOW';
            riskLabel = 'Normal Operations';
        } else if (totalRisk <= 50) {
            riskLevel = 'ELEVATED';
            riskLabel = 'Enhanced Monitoring';
        } else if (totalRisk <= 75) {
            riskLevel = 'HIGH';
            riskLabel = 'Active Threats';
        } else {
            riskLevel = 'CRITICAL';
            riskLabel = 'Avoid If Possible';
        }

        const result = {
            routeId,
            score: totalRisk,
            level: riskLevel,
            label: riskLabel,
            factors: riskFactors.sort((a, b) => b.contribution - a.contribution).slice(0, 3),
            activeThreats: activeThreats,
            primaryThreat: riskFactors.length > 0 ? riskFactors[0].name : null,
            lastUpdate: this.lastUpdate,
            recommendation: this.getRecommendation(totalRisk, routeId)
        };

        // Cache result
        this.riskCache.set(routeId, {
            timestamp: Date.now(),
            data: result
        });

        return result;
    }

    /**
     * Get base vulnerability score for a route
     * Based on chokepoint presence, alternative availability, etc.
     */
    getBaseVulnerability(routeId) {
        const vulnerabilities = {
            'suez-canal': 70,         // Single chokepoint, no bypass without major reroute
            'persian-gulf-malacca': 80, // Multiple chokepoints (Hormuz + Malacca)
            'malacca-strait': 55,     // Major chokepoint but some alternatives
            'bosphorus-mediterranean': 50, // Single chokepoint, grain corridor importance
            'panama-pacific': 45,     // Canal bottleneck, capacity issues
            'panama-uswest': 45,      // Canal bottleneck
            'cape-good-hope': 20,     // Open ocean, low vulnerability
            'transpacific-west': 15,  // Open ocean
            'transpacific-east': 15,  // Open ocean
            'transatlantic-north': 10, // NATO protected corridor
            'transatlantic-south': 15, // Relatively safe
            'asia-australia': 25      // Some chokepoints but manageable
        };
        return vulnerabilities[routeId] || 30;
    }

    /**
     * Get operational recommendation based on risk
     */
    getRecommendation(score, routeId) {
        if (score <= 25) {
            return 'Normal transit operations';
        } else if (score <= 50) {
            return 'Monitor advisories, maintain communication';
        } else if (score <= 75) {
            const alternatives = this.getAlternativeRoutes(routeId);
            if (alternatives.length > 0) {
                return `Consider ${alternatives[0]} as alternative`;
            }
            return 'Enhanced security measures advised';
        } else {
            const alternatives = this.getAlternativeRoutes(routeId);
            if (alternatives.length > 0) {
                return `Reroute via ${alternatives[0]}`;
            }
            return 'Delay transit if possible';
        }
    }

    /**
     * Get alternative routes for a given route
     */
    getAlternativeRoutes(routeId) {
        const alternatives = {
            'suez-canal': ['Cape of Good Hope (+7-10 days)'],
            'persian-gulf-malacca': ['Cape route via South Africa'],
            'malacca-strait': ['Lombok Strait', 'Sunda Strait'],
            'bosphorus-mediterranean': ['Limited - Black Sea only'],
            'panama-pacific': ['Cape Horn (significant delay)'],
            'panama-uswest': ['Suez route (longer)']
        };
        return alternatives[routeId] || [];
    }

    /**
     * Get all risk scores for dashboard display
     */
    getAllRiskScores() {
        const routes = [
            'suez-canal', 'persian-gulf-malacca', 'malacca-strait',
            'bosphorus-mediterranean', 'panama-pacific', 'panama-uswest',
            'cape-good-hope', 'transpacific-west', 'transpacific-east',
            'transatlantic-north', 'transatlantic-south', 'asia-australia'
        ];

        return routes.map(routeId => this.calculateRiskScore(routeId));
    }

    /**
     * Get recent incidents for intel feed
     */
    getRecentIncidents(limit = 10) {
        return this.recentIncidents
            .slice(0, limit)
            .map(inc => ({
                ...inc,
                age: this.formatTimeAgo(inc.date)
            }));
    }

    /**
     * Get active geopolitical factors
     */
    getActiveGeopoliticalFactors() {
        return Object.entries(this.geopoliticalFactors)
            .filter(([_, factor]) => factor.active)
            .map(([key, factor]) => ({
                id: key,
                ...factor
            }))
            .sort((a, b) => b.severity - a.severity);
    }

    /**
     * Format time ago string
     */
    formatTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const hours = Math.floor(diff / (60 * 60 * 1000));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return 'Just now';
    }
}

// Initialize global instance
window.shippingLaneRiskService = new ShippingLaneRiskService();

console.log('Maritime Risk Assessment Service initialized');
