/**
 * Military Installations, Nuclear Facilities, and Strategic Assets Data
 *
 * Data Sources (for real implementation):
 * - ADS-B Exchange (adsb.fi) - Real-time aircraft tracking
 * - FlightRadar24 API - Commercial flight data
 * - OpenSky Network - Open source flight tracking
 * - Public military base locations from official sources
 * - Nuclear facility data from IAEA, NRC, and national registries
 *
 * Note: Nuclear-capable aircraft tracking shows publicly known deployments
 * and exercises. Real-time data would require ADS-B receiver network access.
 */

class MilitaryInstallationsData {
    constructor() {
        this.lastUpdate = Date.now();
        this.updateInterval = 30000; // 30 second updates for aircraft

        // Nuclear event tracking - only show items detected in last 24 hours
        this.nuclearEvents = [];
        this.DECAY_TIME = 24 * 60 * 60 * 1000; // 24 hours in ms

        // Real-time position tracking with trajectory history
        this.positionHistory = {}; // Track position history for each asset
        this.MAX_TRAIL_POINTS = 50; // Number of trail points to keep
        this.POSITION_UPDATE_INTERVAL = 2000; // Update positions every 2 seconds

        // Start generating simulated nuclear events
        this.startNuclearEventMonitoring();

        // Start real-time position updates
        this.startPositionTracking();
    }

    /**
     * Start real-time position tracking for all nuclear assets
     */
    startPositionTracking() {
        // Update positions every 2 seconds for smooth movement
        setInterval(() => {
            this.updateAllPositions();
        }, this.POSITION_UPDATE_INTERVAL);
    }

    /**
     * Update positions of all tracked assets
     */
    updateAllPositions() {
        const now = Date.now();

        // Update aircraft positions
        this.nuclearEvents.forEach(event => {
            if (event.type === 'aircraft_detection') {
                this.updateAircraftPosition(event, now);
            } else if (event.type === 'submarine_movement') {
                this.updateSubmarinePosition(event, now);
            } else if (event.type === 'convoy_spotted') {
                this.updateConvoyPosition(event, now);
            }
        });
    }

    /**
     * Update aircraft position based on heading and speed
     */
    updateAircraftPosition(event, now) {
        const data = event.data;
        const id = event.id;

        // Initialize position history if needed
        if (!this.positionHistory[id]) {
            this.positionHistory[id] = {
                trail: [{lat: data.lat, lon: data.lon, timestamp: now}],
                lastUpdate: now
            };
        }

        const history = this.positionHistory[id];
        const timeDelta = (now - history.lastUpdate) / 1000; // seconds

        // Calculate movement based on speed and heading
        // Speed is in knots, convert to degrees per second
        // 1 knot ≈ 0.000277778 degrees per second at equator
        const speedDegPerSec = (data.speed || 400) * 0.000005; // Scaled for visibility

        // Add some realistic variation to heading
        const headingVariation = Math.sin(now / 30000) * 5; // ±5 degree wobble
        const effectiveHeading = (data.heading || 0) + headingVariation;
        const headingRad = effectiveHeading * Math.PI / 180;

        // Calculate new position
        const deltaLat = Math.cos(headingRad) * speedDegPerSec * timeDelta;
        const deltaLon = Math.sin(headingRad) * speedDegPerSec * timeDelta / Math.cos(data.lat * Math.PI / 180);

        // Update position
        data.lat += deltaLat;
        data.lon += deltaLon;

        // Keep within bounds
        data.lat = Math.max(-85, Math.min(85, data.lat));
        if (data.lon > 180) data.lon -= 360;
        if (data.lon < -180) data.lon += 360;

        // Add slight altitude variation
        data.altitude = (data.altitude || 35000) + Math.sin(now / 10000) * 500;

        // Add to trail
        history.trail.push({
            lat: data.lat,
            lon: data.lon,
            timestamp: now,
            altitude: data.altitude
        });

        // Trim trail to max length
        if (history.trail.length > this.MAX_TRAIL_POINTS) {
            history.trail.shift();
        }

        history.lastUpdate = now;
    }

    /**
     * Update submarine position with realistic patrol patterns
     * Submarines patrol within defined areas, occasionally changing course
     */
    updateSubmarinePosition(event, now) {
        const data = event.data;
        const id = event.id;

        // Define patrol area boundaries by region
        const patrolAreas = {
            'Atlantic': { latMin: 25, latMax: 50, lonMin: -70, lonMax: -30 },
            'Pacific': { latMin: 15, latMax: 55, lonMin: -180, lonMax: -120 },
            'Arctic/Pacific': { latMin: 55, latMax: 72, lonMin: -180, lonMax: -160 },
            'North Atlantic': { latMin: 50, latMax: 70, lonMin: -30, lonMax: 5 },
            'Barents Sea': { latMin: 65, latMax: 75, lonMin: 25, lonMax: 55 },
            'Arctic/Barents': { latMin: 68, latMax: 80, lonMin: 20, lonMax: 60 },
            'Sea of Okhotsk': { latMin: 45, latMax: 60, lonMin: 140, lonMax: 165 },
            'South China Sea': { latMin: 5, latMax: 25, lonMin: 105, lonMax: 120 },
            'Philippine Sea': { latMin: 10, latMax: 30, lonMin: 120, lonMax: 140 },
            'Yellow Sea': { latMin: 33, latMax: 42, lonMin: 118, lonMax: 127 },
            'Bay of Bengal': { latMin: 5, latMax: 22, lonMin: 78, lonMax: 95 },
            'Indian Ocean': { latMin: -5, latMax: 20, lonMin: 65, lonMax: 90 },
            'Eastern Mediterranean': { latMin: 30, latMax: 37, lonMin: 28, lonMax: 36 },
            'Sea of Japan': { latMin: 35, latMax: 45, lonMin: 128, lonMax: 142 },
            'Bay of Biscay': { latMin: 43, latMax: 48, lonMin: -10, lonMax: -1 }
        };

        if (!this.positionHistory[id]) {
            this.positionHistory[id] = {
                trail: [{lat: data.lat, lon: data.lon, timestamp: now}],
                lastUpdate: now,
                heading: Math.random() * 360,
                depth: 100 + Math.random() * 300, // Depth 100-400m
                patrolPhase: 'transit', // transit, loiter, evade
                phaseTimer: 0,
                speed: 8 + Math.random() * 12 // 8-20 knots
            };
        }

        const history = this.positionHistory[id];
        const timeDelta = (now - history.lastUpdate) / 1000;

        // Update patrol phase periodically
        history.phaseTimer += timeDelta;
        if (history.phaseTimer > 120) { // Every ~2 minutes
            history.phaseTimer = 0;
            const phases = ['transit', 'loiter', 'transit', 'transit'];
            history.patrolPhase = phases[Math.floor(Math.random() * phases.length)];
            history.speed = history.patrolPhase === 'loiter' ? 3 + Math.random() * 5 : 8 + Math.random() * 12;
        }

        // Speed varies by phase (scaled for visibility)
        const speedDegPerSec = history.speed * 0.0000015;

        // Heading changes - more erratic during loiter
        const headingChange = history.patrolPhase === 'loiter'
            ? (Math.random() - 0.5) * 8
            : (Math.random() - 0.5) * 1.5;
        history.heading += headingChange;

        // Keep heading in bounds
        if (history.heading < 0) history.heading += 360;
        if (history.heading >= 360) history.heading -= 360;

        const headingRad = history.heading * Math.PI / 180;

        // Calculate new position
        let newLat = data.lat + Math.cos(headingRad) * speedDegPerSec * timeDelta;
        let newLon = data.lon + Math.sin(headingRad) * speedDegPerSec * timeDelta / Math.cos(data.lat * Math.PI / 180);

        // Keep within patrol area boundaries
        const area = patrolAreas[data.patrolArea];
        if (area) {
            // If approaching boundary, turn back
            if (newLat < area.latMin + 2) {
                history.heading = 45 + Math.random() * 90; // Turn north
            } else if (newLat > area.latMax - 2) {
                history.heading = 225 + Math.random() * 90; // Turn south
            }
            if (newLon < area.lonMin + 3) {
                history.heading = (history.heading + 90) % 360; // Turn east
            } else if (newLon > area.lonMax - 3) {
                history.heading = (history.heading + 270) % 360; // Turn west
            }

            // Clamp to area
            newLat = Math.max(area.latMin, Math.min(area.latMax, newLat));
            newLon = Math.max(area.lonMin, Math.min(area.lonMax, newLon));
        }

        data.lat = newLat;
        data.lon = newLon;

        // Depth variation - realistic depth changes
        const depthChange = Math.sin(now / 30000) * 20 + (Math.random() - 0.5) * 5;
        history.depth = Math.max(50, Math.min(450, history.depth + depthChange * 0.1));
        data.depth = Math.round(history.depth);

        // Update heading in data for rendering
        data.heading = history.heading;
        data.speed = history.speed;
        data.patrolPhase = history.patrolPhase;

        history.trail.push({
            lat: data.lat,
            lon: data.lon,
            timestamp: now,
            depth: data.depth,
            heading: data.heading
        });

        if (history.trail.length > this.MAX_TRAIL_POINTS) {
            history.trail.shift();
        }

        history.lastUpdate = now;
    }

    /**
     * Update convoy position (ground movement along roads)
     */
    updateConvoyPosition(event, now) {
        const data = event.data;
        const id = event.id;

        if (!this.positionHistory[id]) {
            // Define route waypoints based on convoy type
            const routes = {
                'UK Nuclear Convoy': [
                    {lat: 51.38, lon: -1.15}, // AWE Aldermaston
                    {lat: 52.0, lon: -1.5},
                    {lat: 53.0, lon: -2.0},
                    {lat: 54.0, lon: -2.5},
                    {lat: 55.0, lon: -3.5},
                    {lat: 56.05, lon: -4.87} // RNAD Coulport
                ],
                'NNSA Transport': [
                    {lat: 35.32, lon: -101.57}, // Pantex
                    {lat: 35.5, lon: -100.5},
                    {lat: 35.8, lon: -99.0},
                    {lat: 36.0, lon: -97.5}
                ]
            };

            const route = routes[data.name] || [{lat: data.lat, lon: data.lon}];

            this.positionHistory[id] = {
                trail: [{lat: data.lat, lon: data.lon, timestamp: now}],
                lastUpdate: now,
                route: route,
                routeIndex: 0,
                progress: 0 // 0-1 between waypoints
            };
        }

        const history = this.positionHistory[id];
        const timeDelta = (now - history.lastUpdate) / 1000;

        // Move along route
        history.progress += timeDelta * 0.001; // Slow convoy speed

        if (history.progress >= 1 && history.routeIndex < history.route.length - 2) {
            history.routeIndex++;
            history.progress = 0;
        }

        // Interpolate position between waypoints
        const idx = Math.min(history.routeIndex, history.route.length - 2);
        const from = history.route[idx];
        const to = history.route[idx + 1] || from;
        const t = Math.min(history.progress, 1);

        data.lat = from.lat + (to.lat - from.lat) * t;
        data.lon = from.lon + (to.lon - from.lon) * t;

        history.trail.push({
            lat: data.lat,
            lon: data.lon,
            timestamp: now
        });

        if (history.trail.length > this.MAX_TRAIL_POINTS) {
            history.trail.shift();
        }

        history.lastUpdate = now;
    }

    /**
     * Get position history/trail for an asset
     */
    getTrail(eventId) {
        return this.positionHistory[eventId]?.trail || [];
    }

    /**
     * Get all trails for rendering
     */
    getAllTrails() {
        const trails = {};
        for (const [id, history] of Object.entries(this.positionHistory)) {
            trails[id] = history.trail;
        }
        return trails;
    }

    /**
     * Start monitoring for nuclear-related events
     * In production, this would connect to ADS-B feeds, naval tracking APIs, etc.
     */
    startNuclearEventMonitoring() {
        // Seed initial submarine events - always have submarines on startup
        this.seedInitialSubmarines();

        // Generate initial events for other types
        this.generateNuclearEvents();

        // Periodically generate new events (simulating real-time detection)
        setInterval(() => {
            this.generateNuclearEvents();
            this.pruneExpiredEvents();
        }, 60000); // Check every minute
    }

    /**
     * Seed initial submarine contacts on startup
     * Ensures submarines are always visible from the start
     */
    seedInitialSubmarines() {
        const now = Date.now();

        // Get all submarine definitions from createNuclearEvent
        const submarineList = [
            // USA
            { name: 'USS TENNESSEE', hullNo: 'SSBN-734', type: 'Ohio-class SSBN', country: 'USA', flag: '🇺🇸',
              lat: 30.8 + (Math.random() - 0.5) * 2, lon: -81.5 + (Math.random() - 0.5) * 2,
              homePort: 'Kings Bay, GA', patrolArea: 'Atlantic', missiles: 20, warheads: 80,
              status: 'Departed Kings Bay', source: 'OSINT/Satellite', severity: 'HIGH' },
            { name: 'USS PENNSYLVANIA', hullNo: 'SSBN-735', type: 'Ohio-class SSBN', country: 'USA', flag: '🇺🇸',
              lat: 47.8 + (Math.random() - 0.5) * 3, lon: -125.0 + (Math.random() - 0.5) * 5,
              homePort: 'Bangor, WA', patrolArea: 'Pacific', missiles: 20, warheads: 80,
              status: 'Pacific Deterrent Patrol', source: 'Track Estimate', severity: 'HIGH' },
            { name: 'USS KENTUCKY', hullNo: 'SSBN-737', type: 'Ohio-class SSBN', country: 'USA', flag: '🇺🇸',
              lat: 20.5 + (Math.random() - 0.5) * 4, lon: -160.0 + (Math.random() - 0.5) * 10,
              homePort: 'Bangor, WA', patrolArea: 'Pacific', missiles: 20, warheads: 80,
              status: 'Central Pacific Patrol', source: 'Track Estimate', severity: 'HIGH' },
            // UK
            { name: 'HMS VICTORIOUS', hullNo: 'S29', type: 'Vanguard-class SSBN', country: 'UK', flag: '🇬🇧',
              lat: 62.0 + (Math.random() - 0.5) * 6, lon: -15.0 + (Math.random() - 0.5) * 10,
              homePort: 'HMNB Clyde (Faslane)', patrolArea: 'North Atlantic', missiles: 16, warheads: 48,
              status: 'CASD Patrol (Operation Relentless)', source: 'Track Estimate', severity: 'HIGH' },
            // France
            { name: 'LE TÉMÉRAIRE', hullNo: 'S617', type: 'Triomphant-class SSBN', country: 'France', flag: '🇫🇷',
              lat: 55.0 + (Math.random() - 0.5) * 8, lon: -25.0 + (Math.random() - 0.5) * 15,
              homePort: 'Île Longue', patrolArea: 'North Atlantic', missiles: 16, warheads: 96,
              status: 'Deterrent Patrol (FOST)', source: 'Track Estimate', severity: 'HIGH' },
            // Russia
            { name: 'K-535 YURI DOLGORUKIY', hullNo: 'K-535', type: 'Borei-class SSBN', country: 'Russia', flag: '🇷🇺',
              lat: 69.1 + (Math.random() - 0.5) * 2, lon: 33.4 + (Math.random() - 0.5) * 2,
              homePort: 'Gadzhiyevo', patrolArea: 'Barents Sea', missiles: 16, warheads: 96,
              status: 'Northern Fleet', source: 'Satellite', severity: 'HIGH' },
            { name: 'K-550 ALEXANDER NEVSKY', hullNo: 'K-550', type: 'Borei-class SSBN', country: 'Russia', flag: '🇷🇺',
              lat: 55.0 + (Math.random() - 0.5) * 6, lon: 158.0 + (Math.random() - 0.5) * 10,
              homePort: 'Vilyuchinsk', patrolArea: 'Sea of Okhotsk', missiles: 16, warheads: 96,
              status: 'Pacific Fleet Patrol', source: 'Track Estimate', severity: 'HIGH' },
            // China
            { name: 'CHANGZHENG 18', hullNo: '418', type: 'Type 094 Jin-class SSBN', country: 'China', flag: '🇨🇳',
              lat: 18.2 + (Math.random() - 0.5) * 2, lon: 109.5 + (Math.random() - 0.5) * 2,
              homePort: 'Yulin Naval Base, Hainan', patrolArea: 'South China Sea', missiles: 12, warheads: 12,
              status: 'South China Sea Patrol', source: 'Track Estimate', severity: 'HIGH' },
            { name: 'CHANGZHENG 20', hullNo: '420', type: 'Type 094A Jin-class SSBN', country: 'China', flag: '🇨🇳',
              lat: 20.0 + (Math.random() - 0.5) * 3, lon: 125.0 + (Math.random() - 0.5) * 8,
              homePort: 'Yulin Naval Base, Hainan', patrolArea: 'Philippine Sea', missiles: 12, warheads: 12,
              status: 'Pacific Transit', source: 'Track Estimate', severity: 'HIGH' },
            // India
            { name: 'INS ARIHANT', hullNo: 'S2', type: 'Arihant-class SSBN', country: 'India', flag: '🇮🇳',
              lat: 17.7 + (Math.random() - 0.5) * 2, lon: 83.3 + (Math.random() - 0.5) * 2,
              homePort: 'INS Varsha (Visakhapatnam)', patrolArea: 'Bay of Bengal', missiles: 4, warheads: 12,
              status: 'Deterrent Patrol', source: 'Track Estimate', severity: 'HIGH' },
            // North Korea
            { name: 'SINPO-C SSBN', hullNo: 'Unknown', type: 'Sinpo-C class SSBN', country: 'North Korea', flag: '🇰🇵',
              lat: 39.5 + (Math.random() - 0.5) * 1, lon: 127.5 + (Math.random() - 0.5) * 1,
              homePort: 'Sinpo Naval Shipyard', patrolArea: 'Sea of Japan', missiles: 3, warheads: 3,
              status: 'Port Activity Detected', source: 'Satellite', severity: 'HIGH' }
        ];

        // Add each submarine as an event
        submarineList.forEach(sub => {
            const event = {
                id: `nuke_${now}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'submarine_movement',
                timestamp: now,
                expiresAt: now + this.DECAY_TIME,
                data: sub
            };
            this.nuclearEvents.push(event);
        });

        console.log(`🚢 Seeded ${submarineList.length} initial submarine contacts`);
    }

    /**
     * Generate simulated nuclear-related events
     * In production, this would parse real ADS-B/AIS data
     */
    generateNuclearEvents() {
        const now = Date.now();
        const eventTypes = [
            'aircraft_detection',
            'submarine_movement',
            'convoy_spotted',
            'base_activity',
            'exercise_detected'
        ];

        // Randomly generate 0-2 new events
        const numEvents = Math.floor(Math.random() * 3);

        for (let i = 0; i < numEvents; i++) {
            const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const event = this.createNuclearEvent(eventType, now);
            if (event) {
                this.nuclearEvents.push(event);
            }
        }
    }

    /**
     * Create a nuclear event based on type
     */
    createNuclearEvent(eventType, timestamp) {
        const events = {
            aircraft_detection: [
                { callsign: 'DEATH11', type: 'B-52H', country: 'USA', lat: 64.2 + (Math.random() - 0.5) * 4, lon: -22.5 + (Math.random() - 0.5) * 6, altitude: 35000, heading: 45, speed: 480, mission: 'Bomber Task Force Europe', source: 'ADS-B Exchange', severity: 'HIGH' },
                { callsign: 'DEATH12', type: 'B-52H', country: 'USA', lat: 63.8 + (Math.random() - 0.5) * 4, lon: -21.2 + (Math.random() - 0.5) * 6, altitude: 34500, heading: 48, speed: 475, mission: 'Bomber Task Force Europe', source: 'ADS-B Exchange', severity: 'HIGH' },
                { callsign: 'SKULL01', type: 'B-2A', country: 'USA', lat: 38.5 + (Math.random() - 0.5) * 2, lon: -93.8 + (Math.random() - 0.5) * 2, altitude: 40000, heading: 270, speed: 560, mission: 'Training Sortie', source: 'Track Estimate', severity: 'MEDIUM' },
                { callsign: 'RFF7821', type: 'Tu-160', country: 'Russia', lat: 68.5 + (Math.random() - 0.5) * 6, lon: 42.3 + (Math.random() - 0.5) * 8, altitude: 39000, heading: 315, speed: 520, mission: 'Arctic Patrol', source: 'Track Estimate', severity: 'HIGH' },
                { callsign: 'RFF4512', type: 'Tu-95MS', country: 'Russia', lat: 55.2 + (Math.random() - 0.5) * 8, lon: 125.8 + (Math.random() - 0.5) * 10, altitude: 32000, heading: 90, speed: 440, mission: 'Pacific Patrol', source: 'Track Estimate', severity: 'HIGH' },
                { callsign: 'FAF2045', type: 'Rafale B', country: 'France', lat: 43.8 + (Math.random() - 0.5) * 2, lon: 4.5 + (Math.random() - 0.5) * 2, altitude: 30000, heading: 220, speed: 550, mission: 'FAS Training', source: 'ADS-B', severity: 'MEDIUM' },
                { callsign: 'TACAMO1', type: 'E-6B', country: 'USA', lat: 36.5 + (Math.random() - 0.5) * 4, lon: -76.8 + (Math.random() - 0.5) * 4, altitude: 25000, heading: 180, speed: 350, mission: 'TACAMO Patrol', source: 'ADS-B', severity: 'HIGH', nuclearC2: true },
                { callsign: 'NIGHT01', type: 'E-4B', country: 'USA', lat: 39.8 + (Math.random() - 0.5) * 2, lon: -104.5 + (Math.random() - 0.5) * 2, altitude: 35000, heading: 270, speed: 400, mission: 'NAOC Standby', source: 'Track Estimate', severity: 'HIGH', nuclearC2: true },
                { callsign: 'RRR4521', type: 'C-17A', country: 'UK', lat: 52.4 + (Math.random() - 0.5), lon: 0.5 + (Math.random() - 0.5), altitude: 28000, heading: 180, speed: 420, mission: 'Lakenheath Ops', source: 'ADS-B', severity: 'MEDIUM', nuclearSupport: true }
            ],
            submarine_movement: [
                // === USA - Ohio-class SSBNs (14 active) ===
                { name: 'USS TENNESSEE', hullNo: 'SSBN-734', type: 'Ohio-class SSBN', country: 'USA', flag: '🇺🇸',
                  lat: 30.8 + (Math.random() - 0.5) * 2, lon: -81.5 + (Math.random() - 0.5) * 2,
                  homePort: 'Kings Bay, GA', patrolArea: 'Atlantic', missiles: 20, warheads: 80,
                  status: 'Departed Kings Bay', source: 'OSINT/Satellite', severity: 'HIGH' },
                { name: 'USS PENNSYLVANIA', hullNo: 'SSBN-735', type: 'Ohio-class SSBN', country: 'USA', flag: '🇺🇸',
                  lat: 47.8 + (Math.random() - 0.5) * 3, lon: -125.0 + (Math.random() - 0.5) * 5,
                  homePort: 'Bangor, WA', patrolArea: 'Pacific', missiles: 20, warheads: 80,
                  status: 'Pacific Deterrent Patrol', source: 'Track Estimate', severity: 'HIGH' },
                { name: 'USS KENTUCKY', hullNo: 'SSBN-737', type: 'Ohio-class SSBN', country: 'USA', flag: '🇺🇸',
                  lat: 20.5 + (Math.random() - 0.5) * 4, lon: -160.0 + (Math.random() - 0.5) * 10,
                  homePort: 'Bangor, WA', patrolArea: 'Pacific', missiles: 20, warheads: 80,
                  status: 'Central Pacific Patrol', source: 'Track Estimate', severity: 'HIGH' },
                { name: 'USS MARYLAND', hullNo: 'SSBN-738', type: 'Ohio-class SSBN', country: 'USA', flag: '🇺🇸',
                  lat: 35.0 + (Math.random() - 0.5) * 5, lon: -55.0 + (Math.random() - 0.5) * 8,
                  homePort: 'Kings Bay, GA', patrolArea: 'Atlantic', missiles: 20, warheads: 80,
                  status: 'Atlantic Deterrent Patrol', source: 'Track Estimate', severity: 'HIGH' },
                { name: 'USS LOUISIANA', hullNo: 'SSBN-743', type: 'Ohio-class SSBN', country: 'USA', flag: '🇺🇸',
                  lat: 62.0 + (Math.random() - 0.5) * 4, lon: -175.0 + (Math.random() - 0.5) * 10,
                  homePort: 'Bangor, WA', patrolArea: 'Arctic/Pacific', missiles: 20, warheads: 80,
                  status: 'Northern Pacific Patrol', source: 'Satellite', severity: 'HIGH' },

                // === UK - Vanguard-class SSBNs (4 active, 1 always on patrol - CASD) ===
                { name: 'HMS VANGUARD', hullNo: 'S28', type: 'Vanguard-class SSBN', country: 'UK', flag: '🇬🇧',
                  lat: 56.1 + (Math.random() - 0.5), lon: -4.8 + (Math.random() - 0.5),
                  homePort: 'HMNB Clyde (Faslane)', patrolArea: 'North Atlantic', missiles: 16, warheads: 48,
                  status: 'Faslane Activity', source: 'Local Report', severity: 'MEDIUM' },
                { name: 'HMS VICTORIOUS', hullNo: 'S29', type: 'Vanguard-class SSBN', country: 'UK', flag: '🇬🇧',
                  lat: 62.0 + (Math.random() - 0.5) * 6, lon: -15.0 + (Math.random() - 0.5) * 10,
                  homePort: 'HMNB Clyde (Faslane)', patrolArea: 'North Atlantic', missiles: 16, warheads: 48,
                  status: 'CASD Patrol (Operation Relentless)', source: 'Track Estimate', severity: 'HIGH' },
                { name: 'HMS VIGILANT', hullNo: 'S30', type: 'Vanguard-class SSBN', country: 'UK', flag: '🇬🇧',
                  lat: 58.5 + (Math.random() - 0.5) * 3, lon: -8.0 + (Math.random() - 0.5) * 5,
                  homePort: 'HMNB Clyde (Faslane)', patrolArea: 'North Atlantic', missiles: 16, warheads: 48,
                  status: 'Transit/Training', source: 'OSINT', severity: 'MEDIUM' },

                // === France - Triomphant-class SSBNs (4 active, 1 always on patrol) ===
                { name: 'LE TRIOMPHANT', hullNo: 'S616', type: 'Triomphant-class SSBN', country: 'France', flag: '🇫🇷',
                  lat: 48.3 + (Math.random() - 0.5), lon: -4.5 + (Math.random() - 0.5),
                  homePort: 'Île Longue', patrolArea: 'North Atlantic', missiles: 16, warheads: 96,
                  status: 'Île Longue Transit', source: 'OSINT', severity: 'MEDIUM' },
                { name: 'LE TÉMÉRAIRE', hullNo: 'S617', type: 'Triomphant-class SSBN', country: 'France', flag: '🇫🇷',
                  lat: 55.0 + (Math.random() - 0.5) * 8, lon: -25.0 + (Math.random() - 0.5) * 15,
                  homePort: 'Île Longue', patrolArea: 'North Atlantic', missiles: 16, warheads: 96,
                  status: 'Deterrent Patrol (FOST)', source: 'Track Estimate', severity: 'HIGH' },
                { name: 'LE VIGILANT', hullNo: 'S618', type: 'Triomphant-class SSBN', country: 'France', flag: '🇫🇷',
                  lat: 45.0 + (Math.random() - 0.5) * 4, lon: -12.0 + (Math.random() - 0.5) * 6,
                  homePort: 'Île Longue', patrolArea: 'Bay of Biscay', missiles: 16, warheads: 96,
                  status: 'Training Exercise', source: 'AIS/Local', severity: 'MEDIUM' },

                // === Russia - Borei-class SSBNs (modern, 5 active) ===
                { name: 'K-535 YURI DOLGORUKIY', hullNo: 'K-535', type: 'Borei-class SSBN', country: 'Russia', flag: '🇷🇺',
                  lat: 69.1 + (Math.random() - 0.5) * 2, lon: 33.4 + (Math.random() - 0.5) * 2,
                  homePort: 'Gadzhiyevo', patrolArea: 'Barents Sea', missiles: 16, warheads: 96,
                  status: 'Northern Fleet', source: 'Satellite', severity: 'HIGH' },
                { name: 'K-550 ALEXANDER NEVSKY', hullNo: 'K-550', type: 'Borei-class SSBN', country: 'Russia', flag: '🇷🇺',
                  lat: 55.0 + (Math.random() - 0.5) * 6, lon: 158.0 + (Math.random() - 0.5) * 10,
                  homePort: 'Vilyuchinsk', patrolArea: 'Sea of Okhotsk', missiles: 16, warheads: 96,
                  status: 'Pacific Fleet Patrol', source: 'Track Estimate', severity: 'HIGH' },
                { name: 'K-551 VLADIMIR MONOMAKH', hullNo: 'K-551', type: 'Borei-class SSBN', country: 'Russia', flag: '🇷🇺',
                  lat: 52.0 + (Math.random() - 0.5) * 4, lon: 155.0 + (Math.random() - 0.5) * 8,
                  homePort: 'Vilyuchinsk', patrolArea: 'Pacific', missiles: 16, warheads: 96,
                  status: 'Sea of Okhotsk Bastion', source: 'Satellite', severity: 'HIGH' },
                { name: 'K-549 KNYAZ VLADIMIR', hullNo: 'K-549', type: 'Borei-A class SSBN', country: 'Russia', flag: '🇷🇺',
                  lat: 72.0 + (Math.random() - 0.5) * 5, lon: 40.0 + (Math.random() - 0.5) * 15,
                  homePort: 'Gadzhiyevo', patrolArea: 'Arctic/Barents', missiles: 16, warheads: 96,
                  status: 'Arctic Patrol', source: 'Track Estimate', severity: 'HIGH' },

                // === Russia - Delta IV class (older, still active) ===
                { name: 'K-114 TULA', hullNo: 'K-114', type: 'Delta IV-class SSBN', country: 'Russia', flag: '🇷🇺',
                  lat: 68.5 + (Math.random() - 0.5) * 3, lon: 38.0 + (Math.random() - 0.5) * 8,
                  homePort: 'Gadzhiyevo', patrolArea: 'Barents Sea', missiles: 16, warheads: 64,
                  status: 'Northern Fleet Reserve', source: 'OSINT', severity: 'MEDIUM' },

                // === China - Type 094 Jin-class SSBNs (6 active) ===
                { name: 'CHANGZHENG 18', hullNo: '418', type: 'Type 094 Jin-class SSBN', country: 'China', flag: '🇨🇳',
                  lat: 18.2 + (Math.random() - 0.5) * 2, lon: 109.5 + (Math.random() - 0.5) * 2,
                  homePort: 'Yulin Naval Base, Hainan', patrolArea: 'South China Sea', missiles: 12, warheads: 12,
                  status: 'South China Sea Patrol', source: 'Track Estimate', severity: 'HIGH' },
                { name: 'CHANGZHENG 19', hullNo: '419', type: 'Type 094 Jin-class SSBN', country: 'China', flag: '🇨🇳',
                  lat: 15.0 + (Math.random() - 0.5) * 4, lon: 115.0 + (Math.random() - 0.5) * 6,
                  homePort: 'Yulin Naval Base, Hainan', patrolArea: 'South China Sea', missiles: 12, warheads: 12,
                  status: 'Deterrent Patrol', source: 'Satellite', severity: 'HIGH' },
                { name: 'CHANGZHENG 20', hullNo: '420', type: 'Type 094A Jin-class SSBN', country: 'China', flag: '🇨🇳',
                  lat: 20.0 + (Math.random() - 0.5) * 3, lon: 125.0 + (Math.random() - 0.5) * 8,
                  homePort: 'Yulin Naval Base, Hainan', patrolArea: 'Philippine Sea', missiles: 12, warheads: 12,
                  status: 'Pacific Transit', source: 'Track Estimate', severity: 'HIGH' },

                // === China - Type 096 (newer, limited intel) ===
                { name: 'CHANGZHENG 21', hullNo: '421', type: 'Type 096 SSBN', country: 'China', flag: '🇨🇳',
                  lat: 38.9 + (Math.random() - 0.5) * 2, lon: 121.5 + (Math.random() - 0.5) * 3,
                  homePort: 'Jianggezhuang (Qingdao)', patrolArea: 'Yellow Sea', missiles: 16, warheads: 48,
                  status: 'Sea Trials/Training', source: 'Satellite', severity: 'HIGH' },

                // === India - Arihant-class SSBNs (2 active) ===
                { name: 'INS ARIHANT', hullNo: 'S2', type: 'Arihant-class SSBN', country: 'India', flag: '🇮🇳',
                  lat: 17.7 + (Math.random() - 0.5) * 2, lon: 83.3 + (Math.random() - 0.5) * 2,
                  homePort: 'INS Varsha (Visakhapatnam)', patrolArea: 'Bay of Bengal', missiles: 4, warheads: 12,
                  status: 'Deterrent Patrol', source: 'Track Estimate', severity: 'HIGH' },
                { name: 'INS ARIGHAT', hullNo: 'S3', type: 'Arihant-class SSBN', country: 'India', flag: '🇮🇳',
                  lat: 13.0 + (Math.random() - 0.5) * 3, lon: 80.0 + (Math.random() - 0.5) * 4,
                  homePort: 'INS Varsha (Visakhapatnam)', patrolArea: 'Indian Ocean', missiles: 4, warheads: 12,
                  status: 'Indian Ocean Patrol', source: 'OSINT', severity: 'HIGH' },

                // === Israel (unconfirmed nuclear capability) ===
                { name: 'INS DRAKON', hullNo: 'Unknown', type: 'Dolphin II-class SSK', country: 'Israel', flag: '🇮🇱',
                  lat: 32.0 + (Math.random() - 0.5) * 3, lon: 34.0 + (Math.random() - 0.5) * 2,
                  homePort: 'Haifa', patrolArea: 'Eastern Mediterranean', missiles: 4, warheads: 'Unknown',
                  status: 'Mediterranean Patrol', source: 'Track Estimate', severity: 'MEDIUM' },

                // === North Korea (limited intel) ===
                { name: 'SINPO-C SSBN', hullNo: 'Unknown', type: 'Sinpo-C class SSBN', country: 'North Korea', flag: '🇰🇵',
                  lat: 39.5 + (Math.random() - 0.5) * 1, lon: 127.5 + (Math.random() - 0.5) * 1,
                  homePort: 'Sinpo Naval Shipyard', patrolArea: 'Sea of Japan', missiles: 3, warheads: 3,
                  status: 'Port Activity Detected', source: 'Satellite', severity: 'HIGH' }
            ],
            convoy_spotted: [
                { name: 'UK Nuclear Convoy', type: 'Road Transport', country: 'UK', lat: 54.5 + (Math.random() - 0.5) * 2, lon: -2.5 + (Math.random() - 0.5) * 2, route: 'AWE to Coulport', source: 'Nukewatch UK', severity: 'HIGH' },
                { name: 'NNSA Transport', type: 'DOE Convoy', country: 'USA', lat: 35.3 + (Math.random() - 0.5) * 4, lon: -101.5 + (Math.random() - 0.5) * 4, route: 'Pantex Operations', source: 'OSINT', severity: 'MEDIUM' }
            ],
            base_activity: [
                { name: 'Whiteman AFB', type: 'Increased Activity', country: 'USA', lat: 38.730, lon: -93.548, activity: 'Multiple B-2 movements', source: 'Satellite/ADS-B', severity: 'MEDIUM' },
                { name: 'Engels-2', type: 'Alert Status', country: 'Russia', lat: 51.481, lon: 46.208, activity: 'Tu-160 dispersal', source: 'Satellite', severity: 'HIGH' },
                { name: 'RAF Lakenheath', type: 'F-35A Activity', country: 'UK/USA', lat: 52.409, lon: 0.561, activity: 'Nuclear cert. training', source: 'ADS-B/Local', severity: 'MEDIUM' }
            ],
            exercise_detected: [
                { name: 'GLOBAL THUNDER', type: 'Strategic Exercise', country: 'USA', lat: 41.1 + (Math.random() - 0.5) * 10, lon: -104.8 + (Math.random() - 0.5) * 10, description: 'USSTRATCOM annual exercise', source: 'Official/OSINT', severity: 'HIGH' },
                { name: 'GROM', type: 'Strategic Exercise', country: 'Russia', lat: 62.0 + (Math.random() - 0.5) * 10, lon: 40.0 + (Math.random() - 0.5) * 20, description: 'Russian nuclear forces exercise', source: 'Official/Satellite', severity: 'HIGH' }
            ]
        };

        const eventList = events[eventType];
        if (!eventList || eventList.length === 0) return null;

        const selectedEvent = eventList[Math.floor(Math.random() * eventList.length)];

        // Check if similar event already exists (avoid duplicates)
        const isDuplicate = this.nuclearEvents.some(e =>
            e.data.name === selectedEvent.name ||
            e.data.callsign === selectedEvent.callsign
        );

        if (isDuplicate) return null;

        return {
            id: `nuke_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            timestamp: timestamp,
            expiresAt: timestamp + this.DECAY_TIME,
            data: {
                ...selectedEvent,
                nuclear: eventType === 'aircraft_detection' && !selectedEvent.nuclearC2 && !selectedEvent.nuclearSupport
            }
        };
    }

    /**
     * Remove expired events (older than 24 hours)
     */
    pruneExpiredEvents() {
        const now = Date.now();
        this.nuclearEvents = this.nuclearEvents.filter(e => e.expiresAt > now);
    }

    /**
     * Get active nuclear events (within 24 hours)
     */
    getActiveNuclearEvents() {
        const now = Date.now();
        return this.nuclearEvents.filter(e => e.expiresAt > now);
    }

    /**
     * Get events by type
     */
    getNuclearEventsByType(type) {
        return this.getActiveNuclearEvents().filter(e => e.type === type);
    }

    /**
     * Get nuclear aircraft from active events
     */
    getActiveNuclearAircraft() {
        return this.getNuclearEventsByType('aircraft_detection').map(e => ({
            ...e.data,
            eventId: e.id,
            detectedAt: e.timestamp,
            expiresAt: e.expiresAt,
            timeRemaining: e.expiresAt - Date.now()
        }));
    }

    /**
     * Get submarine movements from active events
     */
    getActiveSubmarineMovements() {
        return this.getNuclearEventsByType('submarine_movement').map(e => ({
            ...e.data,
            eventId: e.id,
            detectedAt: e.timestamp,
            expiresAt: e.expiresAt,
            timeRemaining: e.expiresAt - Date.now()
        }));
    }

    /**
     * Get convoy sightings from active events
     */
    getActiveConvoySightings() {
        return this.getNuclearEventsByType('convoy_spotted').map(e => ({
            ...e.data,
            eventId: e.id,
            detectedAt: e.timestamp,
            expiresAt: e.expiresAt,
            timeRemaining: e.expiresAt - Date.now()
        }));
    }

    /**
     * Get base activity events
     */
    getActiveBaseActivity() {
        return this.getNuclearEventsByType('base_activity').map(e => ({
            ...e.data,
            eventId: e.id,
            detectedAt: e.timestamp,
            expiresAt: e.expiresAt,
            timeRemaining: e.expiresAt - Date.now()
        }));
    }

    /**
     * Get exercise events
     */
    getActiveExercises() {
        return this.getNuclearEventsByType('exercise_detected').map(e => ({
            ...e.data,
            eventId: e.id,
            detectedAt: e.timestamp,
            expiresAt: e.expiresAt,
            timeRemaining: e.expiresAt - Date.now()
        }));
    }

    /**
     * Add a manual event (for integration with external feeds)
     */
    addNuclearEvent(eventType, data, severity = 'MEDIUM') {
        const now = Date.now();
        const event = {
            id: `nuke_${now}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            timestamp: now,
            expiresAt: now + this.DECAY_TIME,
            data: {
                ...data,
                severity
            }
        };
        this.nuclearEvents.push(event);
        return event;
    }

    /**
     * Get all active nuclear data for map display
     */
    getActiveNuclearData() {
        return {
            aircraft: this.getActiveNuclearAircraft(),
            submarines: this.getActiveSubmarineMovements(),
            convoys: this.getActiveConvoySightings(),
            baseActivity: this.getActiveBaseActivity(),
            exercises: this.getActiveExercises(),
            totalEvents: this.getActiveNuclearEvents().length
        };
    }

    /**
     * Format time remaining for display
     */
    formatTimeRemaining(ms) {
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        return `${hours}h ${minutes}m`;
    }

    /**
     * Major Military Bases Worldwide
     * Categories: air_force, army, navy, joint, nuclear
     */
    getMilitaryBases() {
        return [
            // === UNITED STATES ===
            // Nuclear-capable Air Force Bases
            { name: 'RAF Lakenheath', lat: 52.409, lon: 0.561, country: 'UK/USA', type: 'air_force', nuclear: true, category: 'F-35A Nuclear', description: 'USAF Europe, F-35A nuclear certification 2024' },
            { name: 'Incirlik Air Base', lat: 37.002, lon: 35.426, country: 'Turkey/USA', type: 'air_force', nuclear: true, category: 'B61 Storage', description: 'NATO nuclear sharing, ~50 B61 bombs' },
            { name: 'Büchel Air Base', lat: 50.174, lon: 7.063, country: 'Germany', type: 'air_force', nuclear: true, category: 'B61 Storage', description: 'Luftwaffe Tornado nuclear sharing' },
            { name: 'Kleine Brogel', lat: 51.168, lon: 5.470, country: 'Belgium', type: 'air_force', nuclear: true, category: 'B61 Storage', description: 'Belgian F-16 nuclear sharing' },
            { name: 'Volkel Air Base', lat: 51.657, lon: 5.708, country: 'Netherlands', type: 'air_force', nuclear: true, category: 'B61 Storage', description: 'RNLAF F-35 nuclear sharing' },
            { name: 'Aviano Air Base', lat: 46.032, lon: 12.597, country: 'Italy/USA', type: 'air_force', nuclear: true, category: 'B61 Storage', description: 'USAF nuclear weapons storage' },
            { name: 'Ghedi Air Base', lat: 45.432, lon: 10.277, country: 'Italy', type: 'air_force', nuclear: true, category: 'B61 Storage', description: 'Italian Tornado nuclear sharing' },

            // US Strategic Bomber Bases
            { name: 'Whiteman AFB', lat: 38.730, lon: -93.548, country: 'USA', type: 'air_force', nuclear: true, category: 'B-2 Spirit', description: '509th Bomb Wing, B-2 stealth bombers' },
            { name: 'Minot AFB', lat: 48.416, lon: -101.358, country: 'USA', type: 'air_force', nuclear: true, category: 'B-52H', description: '5th Bomb Wing, ICBM wing' },
            { name: 'Barksdale AFB', lat: 32.501, lon: -93.663, country: 'USA', type: 'air_force', nuclear: true, category: 'B-52H', description: 'Air Force Global Strike Command HQ' },
            { name: 'Dyess AFB', lat: 32.421, lon: -99.855, country: 'USA', type: 'air_force', nuclear: true, category: 'B-1B', description: '7th Bomb Wing, B-1B Lancer' },
            { name: 'Ellsworth AFB', lat: 44.145, lon: -103.103, country: 'USA', type: 'air_force', nuclear: true, category: 'B-1B', description: '28th Bomb Wing' },

            // ICBM Bases
            { name: 'F.E. Warren AFB', lat: 41.146, lon: -104.868, country: 'USA', type: 'air_force', nuclear: true, category: 'Minuteman III', description: '90th Missile Wing, 150 ICBMs' },
            { name: 'Malmstrom AFB', lat: 47.505, lon: -111.183, country: 'USA', type: 'air_force', nuclear: true, category: 'Minuteman III', description: '341st Missile Wing, 150 ICBMs' },

            // Major Naval Bases
            { name: 'Naval Base San Diego', lat: 32.686, lon: -117.129, country: 'USA', type: 'navy', nuclear: false, category: 'Pacific Fleet', description: 'Largest US naval base' },
            { name: 'Naval Station Norfolk', lat: 36.946, lon: -76.303, country: 'USA', type: 'navy', nuclear: true, category: 'Atlantic Fleet', description: 'World\'s largest naval station' },
            { name: 'Naval Base Kitsap', lat: 47.564, lon: -122.654, country: 'USA', type: 'navy', nuclear: true, category: 'Trident SSBN', description: 'Ohio-class submarine base' },
            { name: 'Kings Bay Naval Base', lat: 30.799, lon: -81.516, country: 'USA', type: 'navy', nuclear: true, category: 'Trident SSBN', description: 'Atlantic Trident submarine base' },

            // === RUSSIA ===
            { name: 'Engels-2 Air Base', lat: 51.481, lon: 46.208, country: 'Russia', type: 'air_force', nuclear: true, category: 'Tu-160/Tu-95', description: 'Strategic bomber base' },
            { name: 'Ukrainka Air Base', lat: 51.166, lon: 128.445, country: 'Russia', type: 'air_force', nuclear: true, category: 'Tu-95MS', description: 'Far East strategic bombers' },
            { name: 'Severomorsk', lat: 69.071, lon: 33.416, country: 'Russia', type: 'navy', nuclear: true, category: 'Northern Fleet', description: 'Nuclear submarine HQ' },
            { name: 'Gadzhiyevo', lat: 69.252, lon: 33.330, country: 'Russia', type: 'navy', nuclear: true, category: 'SSBN Base', description: 'Delta/Borei class submarines' },
            { name: 'Vilyuchinsk', lat: 52.927, lon: 158.404, country: 'Russia', type: 'navy', nuclear: true, category: 'Pacific SSBN', description: 'Pacific Fleet nuclear subs' },
            { name: 'Kaliningrad', lat: 54.710, lon: 20.510, country: 'Russia', type: 'joint', nuclear: true, category: 'Iskander-M', description: 'Baltic exclave, tactical nukes' },

            // === CHINA ===
            { name: 'Jianqiao Air Base', lat: 30.341, lon: 120.261, country: 'China', type: 'air_force', nuclear: true, category: 'H-6K', description: 'Strategic bomber base' },
            { name: 'Datong Air Base', lat: 40.056, lon: 113.324, country: 'China', type: 'air_force', nuclear: true, category: 'H-6', description: 'Nuclear bomber wing' },
            { name: 'Yulin Naval Base', lat: 18.227, lon: 109.541, country: 'China', type: 'navy', nuclear: true, category: 'SSBN', description: 'South China Sea submarine base' },
            { name: 'Jianggezhuang', lat: 36.099, lon: 120.573, country: 'China', type: 'navy', nuclear: true, category: 'SSBN', description: 'North Sea Fleet nuclear subs' },
            { name: 'Djibouti Base', lat: 11.547, lon: 43.145, country: 'China', type: 'navy', nuclear: false, category: 'Support Base', description: 'PLA\'s first overseas base' },

            // === UK ===
            { name: 'HMNB Clyde (Faslane)', lat: 56.067, lon: -4.819, country: 'UK', type: 'navy', nuclear: true, category: 'Vanguard SSBN', description: 'UK nuclear deterrent base' },
            { name: 'AWE Aldermaston', lat: 51.381, lon: -1.152, country: 'UK', type: 'nuclear_facility', nuclear: true, category: 'Warhead Production', description: 'UK nuclear warhead facility' },
            { name: 'RNAD Coulport', lat: 56.051, lon: -4.874, country: 'UK', type: 'navy', nuclear: true, category: 'Trident Storage', description: 'Trident missile depot' },
            { name: 'RAF Coningsby', lat: 53.093, lon: -0.166, country: 'UK', type: 'air_force', nuclear: false, category: 'Typhoon QRA', description: 'Quick Reaction Alert' },

            // === FRANCE ===
            { name: 'Île Longue', lat: 48.311, lon: -4.512, country: 'France', type: 'navy', nuclear: true, category: 'Triomphant SSBN', description: 'French nuclear submarine base' },
            { name: 'BA 125 Istres', lat: 43.527, lon: 4.928, country: 'France', type: 'air_force', nuclear: true, category: 'Rafale/ASMP-A', description: 'Strategic air forces' },
            { name: 'BA 113 Saint-Dizier', lat: 48.636, lon: 4.899, country: 'France', type: 'air_force', nuclear: true, category: 'Rafale/ASMP-A', description: 'Nuclear strike squadron' },

            // === INDIA ===
            { name: 'INS Arihant Base', lat: 17.686, lon: 83.302, country: 'India', type: 'navy', nuclear: true, category: 'Arihant SSBN', description: 'Indian nuclear submarine' },
            { name: 'Agra Air Station', lat: 27.157, lon: 77.961, country: 'India', type: 'air_force', nuclear: true, category: 'Mirage 2000', description: 'Nuclear delivery aircraft' },

            // === PAKISTAN ===
            { name: 'Sargodha Air Base', lat: 32.050, lon: 72.665, country: 'Pakistan', type: 'air_force', nuclear: true, category: 'F-16/JF-17', description: 'Nuclear-capable aircraft' },
            { name: 'Masroor Air Base', lat: 24.894, lon: 66.939, country: 'Pakistan', type: 'air_force', nuclear: true, category: 'Nuclear Strike', description: 'PAF Southern Air Command' },

            // === ISRAEL (Undeclared) ===
            { name: 'Sdot Micha', lat: 31.708, lon: 34.952, country: 'Israel', type: 'air_force', nuclear: true, category: 'Jericho III', description: 'Suspected IRBM base' },
            { name: 'Nevatim Air Base', lat: 31.208, lon: 35.012, country: 'Israel', type: 'air_force', nuclear: true, category: 'F-35I', description: 'Nuclear-capable F-35s' },

            // === NORTH KOREA ===
            { name: 'Sunchon Air Base', lat: 39.410, lon: 125.900, country: 'North Korea', type: 'air_force', nuclear: true, category: 'KN-23/25', description: 'Ballistic missile site' },
            { name: 'Sinpo Naval Base', lat: 39.933, lon: 128.167, country: 'North Korea', type: 'navy', nuclear: true, category: 'SLBM Development', description: 'Submarine-launched missile' },

            // === MAJOR NON-NUCLEAR BASES ===
            { name: 'Al Udeid Air Base', lat: 25.117, lon: 51.315, country: 'Qatar/USA', type: 'air_force', nuclear: false, category: 'CENTCOM', description: 'Largest US base in Middle East' },
            { name: 'Camp Humphreys', lat: 36.963, lon: 127.031, country: 'South Korea/USA', type: 'army', nuclear: false, category: 'USFK HQ', description: 'Largest overseas US base' },
            { name: 'Ramstein Air Base', lat: 49.437, lon: 7.600, country: 'Germany/USA', type: 'air_force', nuclear: false, category: 'USAFE HQ', description: 'US Air Forces Europe HQ' },
            { name: 'Kadena Air Base', lat: 26.352, lon: 127.769, country: 'Japan/USA', type: 'air_force', nuclear: false, category: 'Pacific Air', description: 'Largest USAF base in Pacific' },
            { name: 'Diego Garcia', lat: -7.316, lon: 72.411, country: 'UK/USA', type: 'joint', nuclear: false, category: 'B-2 Forward', description: 'Indian Ocean strategic base' }
        ];
    }

    /**
     * Nuclear Facilities (Power Plants, Research Reactors, Enrichment)
     */
    getNuclearFacilities() {
        return [
            // Major Nuclear Power Plants
            { name: 'Zaporizhzhia NPP', lat: 47.508, lon: 34.585, country: 'Ukraine', type: 'power_plant', status: 'occupied', capacity: '6000 MW', description: 'Largest in Europe, Russian-occupied' },
            { name: 'Bruce Power Station', lat: 44.326, lon: -81.598, country: 'Canada', type: 'power_plant', status: 'active', capacity: '6384 MW', description: 'World\'s largest operating' },
            { name: 'Kashiwazaki-Kariwa', lat: 37.429, lon: 138.598, country: 'Japan', type: 'power_plant', status: 'shutdown', capacity: '7965 MW', description: 'World\'s largest by capacity' },
            { name: 'Hanul NPP', lat: 37.093, lon: 129.384, country: 'South Korea', type: 'power_plant', status: 'active', capacity: '5908 MW', description: 'Major Korean plant' },
            { name: 'Gravelines NPP', lat: 51.015, lon: 2.136, country: 'France', type: 'power_plant', status: 'active', capacity: '5460 MW', description: 'Largest in Western Europe' },

            // Enrichment & Reprocessing
            { name: 'Natanz', lat: 33.724, lon: 51.727, country: 'Iran', type: 'enrichment', status: 'active', capacity: 'Unknown', description: 'Underground centrifuge facility' },
            { name: 'Fordow', lat: 34.883, lon: 50.984, country: 'Iran', type: 'enrichment', status: 'active', capacity: 'Unknown', description: 'Underground enrichment' },
            { name: 'Yongbyon', lat: 39.796, lon: 125.755, country: 'North Korea', type: 'research', status: 'active', capacity: 'Unknown', description: 'Nuclear weapons complex' },
            { name: 'La Hague', lat: 49.678, lon: -1.881, country: 'France', type: 'reprocessing', status: 'active', capacity: '1700 t/year', description: 'Largest reprocessing plant' },
            { name: 'Sellafield', lat: 54.420, lon: -3.495, country: 'UK', type: 'reprocessing', status: 'decom', capacity: 'N/A', description: 'Legacy reprocessing site' },
            { name: 'Rokkasho', lat: 40.957, lon: 141.326, country: 'Japan', type: 'reprocessing', status: 'testing', capacity: '800 t/year', description: 'Japanese reprocessing' },

            // Weapons Production
            { name: 'Pantex Plant', lat: 35.317, lon: -101.566, country: 'USA', type: 'weapons', status: 'active', capacity: 'N/A', description: 'US warhead assembly/disassembly' },
            { name: 'Y-12 Complex', lat: 35.984, lon: -84.252, country: 'USA', type: 'weapons', status: 'active', capacity: 'N/A', description: 'Uranium processing' },
            { name: 'Sarov (Arzamas-16)', lat: 54.933, lon: 43.317, country: 'Russia', type: 'weapons', status: 'active', capacity: 'N/A', description: 'Russian warhead design' },
            { name: 'Snezhinsk (Chelyabinsk-70)', lat: 56.085, lon: 60.732, country: 'Russia', type: 'weapons', status: 'active', capacity: 'N/A', description: 'Russian warhead design' },
            { name: 'Dimona', lat: 31.001, lon: 35.145, country: 'Israel', type: 'weapons', status: 'suspected', capacity: 'Unknown', description: 'Israeli nuclear program' }
        ];
    }

    /**
     * Spaceports and Launch Facilities
     */
    getSpaceports() {
        return [
            // USA
            { name: 'Kennedy Space Center', lat: 28.524, lon: -80.650, country: 'USA', operator: 'NASA/SpaceX', type: 'orbital', launches2024: 45, description: 'Primary US crewed launch site' },
            { name: 'Cape Canaveral SFS', lat: 28.489, lon: -80.578, country: 'USA', operator: 'USSF/SpaceX/ULA', type: 'orbital', launches2024: 67, description: 'High-tempo launch complex' },
            { name: 'Vandenberg SFB', lat: 34.742, lon: -120.572, country: 'USA', operator: 'USSF/SpaceX', type: 'orbital', launches2024: 28, description: 'Polar orbit launches' },
            { name: 'Wallops Flight Facility', lat: 37.940, lon: -75.466, country: 'USA', operator: 'NASA', type: 'orbital', launches2024: 5, description: 'Antares/Electron launches' },
            { name: 'SpaceX Starbase', lat: 25.997, lon: -97.157, country: 'USA', operator: 'SpaceX', type: 'orbital', launches2024: 6, description: 'Starship development & launch' },

            // Russia
            { name: 'Baikonur Cosmodrome', lat: 45.965, lon: 63.305, country: 'Kazakhstan/Russia', operator: 'Roscosmos', type: 'orbital', launches2024: 12, description: 'Soyuz crewed launches' },
            { name: 'Plesetsk Cosmodrome', lat: 62.925, lon: 40.577, country: 'Russia', operator: 'VKS', type: 'orbital', launches2024: 8, description: 'Military launches' },
            { name: 'Vostochny Cosmodrome', lat: 51.884, lon: 128.334, country: 'Russia', operator: 'Roscosmos', type: 'orbital', launches2024: 4, description: 'New Russian spaceport' },

            // China
            { name: 'Jiuquan Launch Center', lat: 40.958, lon: 100.291, country: 'China', operator: 'CNSA', type: 'orbital', launches2024: 22, description: 'Crewed missions, Shenzhou' },
            { name: 'Xichang Launch Center', lat: 28.246, lon: 102.027, country: 'China', operator: 'CNSA', type: 'orbital', launches2024: 18, description: 'Geostationary launches' },
            { name: 'Wenchang Space Launch', lat: 19.614, lon: 110.951, country: 'China', operator: 'CNSA', type: 'orbital', launches2024: 15, description: 'Heavy-lift, space station' },
            { name: 'Taiyuan Launch Center', lat: 38.849, lon: 111.608, country: 'China', operator: 'CNSA', type: 'orbital', launches2024: 12, description: 'Sun-synchronous orbit' },

            // Europe
            { name: 'Guiana Space Centre', lat: 5.239, lon: -52.768, country: 'French Guiana', operator: 'ESA/Arianespace', type: 'orbital', launches2024: 8, description: 'Ariane 6, Vega' },

            // India
            { name: 'Satish Dhawan Space Centre', lat: 13.720, lon: 80.230, country: 'India', operator: 'ISRO', type: 'orbital', launches2024: 7, description: 'PSLV, GSLV, Gaganyaan' },

            // Japan
            { name: 'Tanegashima Space Center', lat: 30.391, lon: 130.969, country: 'Japan', operator: 'JAXA', type: 'orbital', launches2024: 4, description: 'H-IIA, H3 launches' },

            // Other
            { name: 'Rocket Lab LC-1', lat: -39.262, lon: 177.865, country: 'New Zealand', operator: 'Rocket Lab', type: 'orbital', launches2024: 12, description: 'Electron small-sat launches' },
            { name: 'Semnan Launch Site', lat: 35.235, lon: 53.921, country: 'Iran', operator: 'ISA', type: 'orbital', launches2024: 3, description: 'Iranian space program' },
            { name: 'Sohae Launch Site', lat: 39.660, lon: 124.705, country: 'North Korea', operator: 'NADA', type: 'orbital', launches2024: 2, description: 'Satellite/ICBM testing' }
        ];
    }

    /**
     * Get nuclear aircraft from event-driven tracking
     * Only returns aircraft that have been detected in the last 24 hours
     *
     * For real implementation, integrate with:
     * - ADS-B Exchange API (adsb.fi)
     * - OpenSky Network API
     * - FlightRadar24 API
     */
    getNuclearAircraft() {
        // Return aircraft from active events (24-hour window)
        return this.getActiveNuclearAircraft();
    }

    /**
     * Get all data with optional filtering
     */
    getAllData(options = {}) {
        return {
            bases: options.includeBases !== false ? this.getMilitaryBases() : [],
            facilities: options.includeFacilities !== false ? this.getNuclearFacilities() : [],
            spaceports: options.includeSpaceports !== false ? this.getSpaceports() : [],
            aircraft: options.includeAircraft !== false ? this.getNuclearAircraft() : [],
            lastUpdate: this.lastUpdate,
            sources: [
                'Public satellite imagery',
                'IAEA reports',
                'ADS-B Exchange',
                'OpenSky Network',
                'Official government disclosures',
                'Academic research'
            ]
        };
    }

    /**
     * Get facilities by type
     */
    getByType(dataType, facilityType) {
        switch(dataType) {
            case 'bases':
                return this.getMilitaryBases().filter(b =>
                    facilityType ? b.type === facilityType : true
                );
            case 'nuclear':
                return this.getMilitaryBases().filter(b => b.nuclear);
            case 'facilities':
                return this.getNuclearFacilities().filter(f =>
                    facilityType ? f.type === facilityType : true
                );
            case 'spaceports':
                return this.getSpaceports();
            case 'aircraft':
                return this.getNuclearAircraft();
            default:
                return [];
        }
    }

    /**
     * Get visible items based on zoom level
     */
    getVisibleInstallations(zoom) {
        const bases = this.getMilitaryBases();
        const facilities = this.getNuclearFacilities();
        const spaceports = this.getSpaceports();

        if (zoom < 1.5) {
            // Only show nuclear bases and major spaceports at low zoom
            return {
                bases: bases.filter(b => b.nuclear),
                facilities: facilities.filter(f => f.type === 'weapons' || f.type === 'enrichment'),
                spaceports: spaceports.filter(s => s.launches2024 > 20)
            };
        } else if (zoom < 3) {
            // Show all nuclear + major bases
            return {
                bases: bases.filter(b => b.nuclear || b.type === 'navy'),
                facilities: facilities.filter(f => f.type !== 'power_plant' || f.capacity.includes('5000')),
                spaceports: spaceports.filter(s => s.launches2024 > 5)
            };
        } else {
            // Show everything at high zoom
            return { bases, facilities, spaceports };
        }
    }
}

// Export for use in main application
window.MilitaryInstallationsData = MilitaryInstallationsData;
