/**
 * Ukraine Frontline Data Loader
 * Fetches real-time occupied territory data from DeepState Map
 * Source: https://github.com/cyterat/deepstate-map-data
 * Data updated daily at 03:00 UTC
 */

class UkraineFrontlineData {
    constructor() {
        this.occupiedTerritory = null;
        this.lastUpdate = null;
        this.isLoading = false;
        this.error = null;

        // GitHub raw URL for the data
        this.baseUrl = 'https://raw.githubusercontent.com/cyterat/deepstate-map-data/main/data/';

        // Load data on initialization
        this.loadLatestData();

        // Refresh every 6 hours (data updates daily at 03:00 UTC)
        setInterval(() => this.loadLatestData(), 6 * 60 * 60 * 1000);
    }

    /**
     * Get today's date in YYYYMMDD format
     */
    getDateString(daysAgo = 0) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    /**
     * Load the latest frontline data
     * Tries today first, then yesterday if not available
     */
    async loadLatestData() {
        if (this.isLoading) return;
        this.isLoading = true;
        this.error = null;

        // Try today's data first, then yesterday's
        for (let daysAgo = 0; daysAgo <= 2; daysAgo++) {
            const dateStr = this.getDateString(daysAgo);
            const url = `${this.baseUrl}deepstatemap_data_${dateStr}.geojson`;

            try {
                console.log(`🗺️ Fetching frontline data for ${dateStr}...`);
                const response = await fetch(url);

                if (response.ok) {
                    const data = await response.json();
                    this.occupiedTerritory = data;
                    this.lastUpdate = new Date();
                    this.isLoading = false;
                    console.log(`✅ Frontline data loaded successfully (${dateStr})`);
                    return true;
                }
            } catch (err) {
                console.warn(`⚠️ Could not fetch data for ${dateStr}:`, err.message);
            }
        }

        // If all fails, try loading from local cache
        try {
            const response = await fetch('deepstate-frontline.geojson');
            if (response.ok) {
                const data = await response.json();
                this.occupiedTerritory = data;
                this.lastUpdate = new Date();
                this.isLoading = false;
                console.log('✅ Loaded frontline data from local cache');
                return true;
            }
        } catch (err) {
            console.warn('⚠️ Could not load local cache:', err.message);
        }

        this.error = 'Failed to load frontline data';
        this.isLoading = false;
        console.error('❌ Failed to load frontline data from any source');
        return false;
    }

    /**
     * Get the occupied territory polygons for rendering
     * Returns an array of coordinate arrays
     */
    getOccupiedTerritoryPolygons() {
        if (!this.occupiedTerritory || !this.occupiedTerritory.features) {
            return [];
        }

        const polygons = [];

        this.occupiedTerritory.features.forEach(feature => {
            if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(polygon => {
                    // Each polygon is an array of rings (outer ring + holes)
                    polygon.forEach(ring => {
                        polygons.push(ring);
                    });
                });
            } else if (feature.geometry && feature.geometry.type === 'Polygon') {
                feature.geometry.coordinates.forEach(ring => {
                    polygons.push(ring);
                });
            }
        });

        return polygons;
    }

    /**
     * Get the frontline (boundary of occupied territory)
     * Extracts only the outer boundary for cleaner rendering
     */
    getFrontlineCoordinates() {
        if (!this.occupiedTerritory || !this.occupiedTerritory.features) {
            return [];
        }

        const frontlines = [];

        this.occupiedTerritory.features.forEach(feature => {
            if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(polygon => {
                    // First ring is the outer boundary (frontline)
                    if (polygon[0] && polygon[0].length > 0) {
                        frontlines.push(polygon[0]);
                    }
                });
            } else if (feature.geometry && feature.geometry.type === 'Polygon') {
                if (feature.geometry.coordinates[0]) {
                    frontlines.push(feature.geometry.coordinates[0]);
                }
            }
        });

        return frontlines;
    }

    /**
     * Check if a point is inside occupied territory
     */
    isPointOccupied(lat, lon) {
        const polygons = this.getOccupiedTerritoryPolygons();

        for (const polygon of polygons) {
            if (this.pointInPolygon([lon, lat], polygon)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Ray casting algorithm for point-in-polygon
     */
    pointInPolygon(point, polygon) {
        const [x, y] = point;
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**
     * Get data status for display
     */
    getStatus() {
        return {
            loaded: !!this.occupiedTerritory,
            loading: this.isLoading,
            error: this.error,
            lastUpdate: this.lastUpdate,
            source: 'DeepStateMap'
        };
    }
}

// Export for use in main application
window.UkraineFrontlineData = UkraineFrontlineData;
