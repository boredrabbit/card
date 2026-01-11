/**
 * Naval Tracking & Dark Fleet Detection
 * Tracks military vessels, oil tankers, and suspicious "dark fleet" activity
 */

class NavalTrackingSystem {
    constructor() {
        this.militaryVessels = [];
        this.oilTankers = [];
        this.darkFleet = [];
        this.suspiciousActivity = [];

        // API endpoints
        this.apis = {
            // MarineTraffic API (requires key for production)
            marineTraffic: 'https://services.marinetraffic.com/api/exportvessel',

            // AIS data providers
            aisHub: 'https://www.aishub.net/api',

            // Vessel Finder
            vesselFinder: 'https://www.vesselfinder.com/api'
        };

        // US Navy vessels and NATO allies
        this.militaryFleet = {
            usNavy: {
                carriers: ['CVN-68', 'CVN-69', 'CVN-70', 'CVN-71', 'CVN-72', 'CVN-73', 'CVN-74', 'CVN-75', 'CVN-76', 'CVN-77', 'CVN-78'],
                destroyers: ['DDG-', 'CG-'],
                submarines: ['SSN-', 'SSBN-'],
                amphibious: ['LHD-', 'LHA-', 'LPD-']
            },
            nato: ['HMS', 'FGS', 'HNLMS', 'FS'],
            russia: ['Admiral', 'Kuznetsov', 'Pyotr'],
            china: ['Liaoning', 'Shandong', 'Type 055']
        };

        // Venezuelan oil tanker patterns
        this.venezuelanTankers = {
            pdvsa: ['PDVSA', 'VENEZUELA'],
            darkFleet: {
                // Known dark fleet operators
                operators: ['National Iranian Tanker Company', 'NITC'],
                flags: ['Panama', 'Liberia', 'Marshall Islands'],
                // Suspicious patterns
                patterns: {
                    aisOff: true,           // AIS transponder turned off
                    flagChanges: true,      // Multiple flag changes
                    nameChanges: true,      // Frequent name changes
                    oldVessels: 15,         // Vessels older than 15 years
                    sanctionedPorts: ['Venezuela', 'Iran', 'Syria']
                }
            },
            routes: {
                venezuela: { lat: 10.5, lon: -66.9 },  // Venezuela coast
                caribbean: { lat: 18.2, lon: -66.5 },   // Caribbean
                cuba: { lat: 23.1, lon: -82.4 },        // Cuban ports
                china: { lat: 22.3, lon: 114.2 }        // South China Sea
            }
        };

        // Conflict zones requiring monitoring
        this.conflictZones = [
            { name: 'South China Sea', lat: 16.0, lon: 114.0, radius: 500 },
            { name: 'Strait of Hormuz', lat: 26.5, lon: 56.25, radius: 100 },
            { name: 'Black Sea', lat: 43.5, lon: 34.0, radius: 300 },
            { name: 'Taiwan Strait', lat: 24.5, lon: 120.0, radius: 200 },
            { name: 'Baltic Sea', lat: 58.0, lon: 20.0, radius: 400 },
            { name: 'Venezuela Coast', lat: 10.5, lon: -66.9, radius: 300 }
        ];

        // Dark fleet detection criteria
        this.darkFleetIndicators = {
            aisGapThreshold: 24 * 60 * 60 * 1000,    // 24 hours without AIS
            speedAnomaly: 25,                         // Unusual speed changes
            routeDeviation: 100,                      // km from normal route
            sanctionedCountries: ['Venezuela', 'Iran', 'North Korea', 'Syria'],
            flagChangesInYear: 2,                     // Multiple flag changes
            oldTankerAge: 15                          // Years
        };
    }

    /**
     * Fetch naval vessel data
     */
    async fetchNavalData() {
        try {
            // In production, this would call actual AIS/MarineTraffic APIs
            // For now, using simulated data with real-world patterns

            const vessels = await this.generateRealisticNavalData();

            // Categorize vessels
            this.militaryVessels = vessels.filter(v => v.type === 'military');
            this.oilTankers = vessels.filter(v => v.type === 'tanker');
            this.darkFleet = vessels.filter(v => v.darkFleet === true);

            // Detect suspicious activity
            this.detectSuspiciousActivity();

            console.log(`🚢 Tracked ${this.militaryVessels.length} military vessels`);
            console.log(`🛢️ Tracked ${this.oilTankers.length} oil tankers`);
            console.log(`⚠️ Identified ${this.darkFleet.length} dark fleet vessels`);

            return {
                military: this.militaryVessels,
                tankers: this.oilTankers,
                darkFleet: this.darkFleet
            };
        } catch (error) {
            console.error('Error fetching naval data:', error);
            return this.generateRealisticNavalData();
        }
    }

    /**
     * Generate realistic naval data based on current geopolitical situation
     */
    async generateRealisticNavalData() {
        const vessels = [];

        // US Navy assets
        vessels.push(
            {
                name: 'USS Gerald R. Ford',
                mmsi: '369970000',
                callsign: 'NGRF',
                type: 'military',
                category: 'Aircraft Carrier',
                lat: 36.8,
                lon: -76.0,
                speed: 0,
                heading: 90,
                status: 'At anchor - Norfolk Naval Base',
                country: 'United States',
                darkFleet: false
            },
            {
                name: 'USS Dwight D. Eisenhower',
                mmsi: '369970001',
                callsign: 'NIKE',
                type: 'military',
                category: 'Aircraft Carrier',
                lat: 26.5,
                lon: 56.0,
                speed: 18,
                heading: 120,
                status: 'Underway - Persian Gulf deployment',
                country: 'United States',
                darkFleet: false
            },
            {
                name: 'USS Arleigh Burke',
                mmsi: '338916000',
                callsign: 'NDDG',
                type: 'military',
                category: 'Destroyer',
                lat: 35.5,
                lon: 139.8,
                speed: 22,
                heading: 270,
                status: 'Underway - Western Pacific patrol',
                country: 'United States',
                darkFleet: false
            }
        );

        // Venezuelan oil tankers (legitimate)
        vessels.push(
            {
                name: 'PDVSA Petrozuata',
                mmsi: '775999123',
                callsign: 'YVPZ',
                type: 'tanker',
                category: 'Crude Oil Tanker',
                lat: 10.5,
                lon: -64.2,
                speed: 0,
                heading: 0,
                status: 'Loading - Jose Terminal, Venezuela',
                country: 'Venezuela',
                cargo: 'Crude Oil - 2M barrels',
                age: 18,
                darkFleet: false,
                flagHistory: ['Venezuela']
            },
            {
                name: 'PDVSA Ayacucho',
                mmsi: '775999456',
                callsign: 'YVAY',
                type: 'tanker',
                category: 'Crude Oil Tanker',
                lat: 18.4,
                lon: -72.9,
                speed: 12,
                heading: 180,
                status: 'Underway - Destination: China',
                country: 'Venezuela',
                cargo: 'Crude Oil - 1.8M barrels',
                age: 20,
                darkFleet: false
            }
        );

        // DARK FLEET - Suspicious tankers
        vessels.push(
            {
                name: 'Ocean Princess',
                mmsi: '353999888',  // Panama flag
                callsign: 'H3LP',
                type: 'tanker',
                category: 'Crude Oil Tanker',
                lat: 22.3,
                lon: 114.2,
                speed: 0,
                heading: 0,
                status: 'AIS SIGNAL LOST - Last seen 36 hours ago',
                country: 'Panama',
                cargo: 'Unknown - Suspected Venezuelan crude',
                age: 22,
                darkFleet: true,
                suspicionScore: 95,
                indicators: [
                    'AIS transponder off for 36+ hours',
                    'Multiple flag changes (Venezuela → Liberia → Panama)',
                    'Name changed 3x in 18 months',
                    'Vessel age: 22 years',
                    'Last port: Venezuela (Jose Terminal)',
                    'Destination: China (suspected)'
                ],
                flagHistory: ['Venezuela', 'Liberia', 'Panama'],
                nameHistory: ['PDVSA Caracas', 'Sea Explorer', 'Ocean Princess']
            },
            {
                name: 'Atlantic Star',
                mmsi: '636999777',
                callsign: 'A8LM',
                type: 'tanker',
                category: 'Crude Oil Tanker',
                lat: 10.2,
                lon: -66.5,
                speed: 8,
                heading: 95,
                status: 'Underway - AIS transponder intermittent',
                country: 'Liberia',
                cargo: 'Crude Oil - 2.1M barrels',
                age: 19,
                darkFleet: true,
                suspicionScore: 88,
                indicators: [
                    'AIS gaps detected (12 hours in last 48h)',
                    'Flagged as possible sanctions evasion vessel',
                    'Ownership changed via shell company',
                    'Speed reduction near US surveillance area',
                    'Route deviation from filed plan'
                ],
                flagHistory: ['Iran', 'Liberia'],
                nameHistory: ['Iranian Prosperity', 'Atlantic Star']
            },
            {
                name: 'Caribbean Venture',
                mmsi: '538999666',
                callsign: 'V7CV',
                type: 'tanker',
                category: 'Crude Oil Tanker',
                lat: 23.1,
                lon: -82.3,
                speed: 0,
                heading: 0,
                status: 'At anchor - Suspected ship-to-ship transfer',
                country: 'Marshall Islands',
                cargo: 'Unknown',
                age: 25,
                darkFleet: true,
                suspicionScore: 92,
                indicators: [
                    'Stopped in international waters - unusual',
                    'Second vessel detected nearby (STS transfer suspected)',
                    'AIS shows "fishing" but is crude tanker',
                    'Multiple ownership changes',
                    'Linked to sanctioned entities'
                ],
                flagHistory: ['Venezuela', 'Panama', 'Marshall Islands'],
                nameHistory: ['PDVSA Miranda', 'Liberty Trader', 'Caribbean Venture']
            }
        );

        // Russian naval assets (relevant to conflict monitoring)
        vessels.push(
            {
                name: 'Admiral Kuznetsov',
                mmsi: '273999111',
                callsign: 'UCAL',
                type: 'military',
                category: 'Aircraft Carrier',
                lat: 69.0,
                lon: 33.0,
                speed: 0,
                heading: 0,
                status: 'In port - Murmansk',
                country: 'Russia',
                darkFleet: false
            }
        );

        // Chinese naval expansion
        vessels.push(
            {
                name: 'Liaoning',
                mmsi: '413999222',
                callsign: 'BYDZ',
                type: 'military',
                category: 'Aircraft Carrier',
                lat: 24.5,
                lon: 120.5,
                speed: 15,
                heading: 90,
                status: 'Underway - Taiwan Strait patrol',
                country: 'China',
                darkFleet: false
            }
        );

        return vessels;
    }

    /**
     * Detect suspicious dark fleet activity
     */
    detectSuspiciousActivity() {
        const alerts = [];

        // Check for vessels near Venezuela
        const venezuelaProximity = this.oilTankers.filter(v => {
            const dist = this.calculateDistance(v.lat, v.lon, 10.5, -66.9);
            return dist < 300; // Within 300km of Venezuela
        });

        if (venezuelaProximity.length > 5) {
            alerts.push({
                type: 'CONCENTRATION',
                severity: 'MEDIUM',
                description: `${venezuelaProximity.length} oil tankers detected near Venezuelan coast`,
                vessels: venezuelaProximity.map(v => v.name)
            });
        }

        // Check for AIS gaps
        const aisGaps = this.oilTankers.filter(v =>
            v.status && v.status.includes('AIS')
        );

        if (aisGaps.length > 0) {
            alerts.push({
                type: 'AIS_ANOMALY',
                severity: 'HIGH',
                description: `${aisGaps.length} tankers with AIS transponder anomalies detected`,
                vessels: aisGaps.map(v => v.name)
            });
        }

        // Check for ship-to-ship transfers
        const stsSuspects = this.oilTankers.filter(v =>
            v.status && v.status.toLowerCase().includes('ship-to-ship')
        );

        if (stsSuspects.length > 0) {
            alerts.push({
                type: 'STS_TRANSFER',
                severity: 'HIGH',
                description: 'Suspected ship-to-ship oil transfer in international waters',
                vessels: stsSuspects.map(v => v.name),
                detail: 'Possible sanctions evasion tactic'
            });
        }

        // Monitor military buildups in conflict zones
        this.conflictZones.forEach(zone => {
            const vesselsInZone = this.militaryVessels.filter(v => {
                const dist = this.calculateDistance(v.lat, v.lon, zone.lat, zone.lon);
                return dist < zone.radius;
            });

            if (vesselsInZone.length >= 3) {
                alerts.push({
                    type: 'MILITARY_CONCENTRATION',
                    severity: vesselsInZone.length >= 5 ? 'HIGH' : 'MEDIUM',
                    description: `${vesselsInZone.length} military vessels in ${zone.name}`,
                    zone: zone.name,
                    vessels: vesselsInZone.map(v => v.name)
                });
            }
        });

        this.suspiciousActivity = alerts;
        return alerts;
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Get dark fleet intelligence report
     */
    getDarkFleetReport() {
        return {
            totalDarkFleet: this.darkFleet.length,
            highRisk: this.darkFleet.filter(v => v.suspicionScore >= 90),
            mediumRisk: this.darkFleet.filter(v => v.suspicionScore >= 70 && v.suspicionScore < 90),
            suspiciousActivity: this.suspiciousActivity,
            venezuelanTankers: this.oilTankers.filter(v => v.country === 'Venezuela'),
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Generate intelligence recommendations
     */
    generateRecommendations() {
        const recs = [];

        if (this.darkFleet.length > 0) {
            recs.push('Monitor dark fleet vessels for AIS reactivation');
            recs.push('Track suspected ship-to-ship transfers');
            recs.push('Coordinate with allied naval assets for interdiction');
        }

        const venezuelanActivity = this.oilTankers.filter(v =>
            v.country === 'Venezuela' || v.darkFleet
        );

        if (venezuelanActivity.length > 3) {
            recs.push('Elevated Venezuelan oil export activity detected');
            recs.push('Potential sanctions evasion in progress');
        }

        return recs;
    }

    /**
     * Start naval tracking
     */
    async startTracking(updateInterval = 120000) {
        console.log('🚢 Starting naval tracking system...');

        await this.fetchNavalData();

        setInterval(async () => {
            await this.fetchNavalData();
        }, updateInterval);

        console.log('✅ Naval tracking active');
    }
}

// Export for use in main application
window.NavalTrackingSystem = NavalTrackingSystem;
