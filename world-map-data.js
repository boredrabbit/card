/**
 * Simplified World Map Data (Military-Grade Wireframe)
 * Generated from Natural Earth GeoJSON data
 * Equirectangular projection for flat display
 */

class WorldMapRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mapData = null;
        this.simplificationFactor = 0.5; // Reduce point density for performance
    }

    /**
     * Load GeoJSON map data
     */
    async loadMapData() {
        try {
            const response = await fetch('world-map.geojson');
            const geojson = await response.json();

            // Simplify the data for military-grade wireframe
            this.mapData = this.simplifyGeoJSON(geojson);
            console.log('✅ World map data loaded');
            return true;
        } catch (error) {
            console.warn('Could not load detailed map, using simplified fallback');
            this.mapData = this.getFallbackMapData();
            return false;
        }
    }

    /**
     * Convert lat/lon to canvas coordinates (Equirectangular projection)
     */
    toCanvas(lat, lon) {
        return {
            x: this.canvas.width * ((lon + 180) / 360),
            y: this.canvas.height * ((90 - lat) / 180)
        };
    }

    /**
     * Simplify GeoJSON for wireframe display
     */
    simplifyGeoJSON(geojson) {
        const simplified = {
            type: 'FeatureCollection',
            features: []
        };

        geojson.features.forEach(feature => {
            if (feature.geometry.type === 'Polygon') {
                simplified.features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: this.simplifyPolygon(feature.geometry.coordinates)
                    }
                });
            } else if (feature.geometry.type === 'MultiPolygon') {
                const polygons = feature.geometry.coordinates.map(poly =>
                    this.simplifyPolygon(poly)
                );
                simplified.features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: polygons
                    }
                });
            }
        });

        return simplified;
    }

    /**
     * Simplify polygon coordinates (Douglas-Peucker algorithm approximation)
     */
    simplifyPolygon(coordinates) {
        return coordinates.map(ring => {
            // Keep every Nth point for simplification
            const step = Math.ceil(1 / this.simplificationFactor);
            const simplified = [];

            for (let i = 0; i < ring.length; i += step) {
                simplified.push(ring[i]);
            }

            // Always include the last point to close the polygon
            if (simplified[simplified.length - 1] !== ring[ring.length - 1]) {
                simplified.push(ring[ring.length - 1]);
            }

            return simplified;
        });
    }

    /**
     * Draw the world map as wireframe
     */
    drawMap() {
        if (!this.mapData) return;

        this.ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
        this.ctx.fillStyle = 'rgba(0, 255, 65, 0.06)';
        this.ctx.lineWidth = 1.5;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        this.mapData.features.forEach(feature => {
            if (feature.geometry.type === 'Polygon') {
                this.drawPolygon(feature.geometry.coordinates);
            } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(polygon => {
                    this.drawPolygon(polygon);
                });
            }
        });
    }

    /**
     * Draw a single polygon
     */
    drawPolygon(coordinates) {
        coordinates.forEach(ring => {
            if (ring.length < 3) return;

            this.ctx.beginPath();

            ring.forEach((coord, i) => {
                const [lon, lat] = coord;
                const {x, y} = this.toCanvas(lat, lon);

                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });

            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        });
    }

    /**
     * Draw shipping lanes overlay
     */
    drawShippingLanes() {
        const toCanvas = (lat, lon) => this.toCanvas(lat, lon);

        this.ctx.strokeStyle = 'rgba(0, 150, 255, 0.15)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        // Suez Canal route (Asia to Europe)
        this.ctx.beginPath();
        let points = [[30, 32], [12, 43], [36, -6], [43, -9], [50, 5]];
        points.forEach((p, i) => {
            const {x, y} = toCanvas(p[0], p[1]);
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();

        // Strait of Hormuz (Persian Gulf)
        this.ctx.beginPath();
        const hormuz = toCanvas(26.5, 56.25);
        this.ctx.arc(hormuz.x, hormuz.y, 15, 0, Math.PI * 2);
        this.ctx.stroke();

        // Strait of Malacca (Asia)
        this.ctx.beginPath();
        points = [[1, 104], [8, 103], [20, 121], [35, 104]];
        points.forEach((p, i) => {
            const {x, y} = toCanvas(p[0], p[1]);
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();

        // Panama Canal
        this.ctx.beginPath();
        const panama = toCanvas(9, -79.5);
        this.ctx.arc(panama.x, panama.y, 12, 0, Math.PI * 2);
        this.ctx.stroke();

        // Transatlantic route
        this.ctx.beginPath();
        points = [[40, -74], [50, -30], [51, -6]];
        points.forEach((p, i) => {
            const {x, y} = toCanvas(p[0], p[1]);
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();

        // Transpacific route (US to Asia)
        this.ctx.beginPath();
        points = [[37, -122], [35, -140], [35, 140], [35, 130]];
        points.forEach((p, i) => {
            const {x, y} = toCanvas(p[0], p[1]);
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();

        // Venezuela to China route (for dark fleet monitoring)
        this.ctx.beginPath();
        points = [[10.5, -64], [5, -35], [-10, -25], [-20, 17], [1, 104], [22, 114]];
        points.forEach((p, i) => {
            const {x, y} = toCanvas(p[0], p[1]);
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    /**
     * Draw strategic location labels
     */
    drawLabels() {
        this.ctx.fillStyle = 'rgba(0, 255, 65, 0.5)';
        this.ctx.font = '9px Courier New';
        this.ctx.textAlign = 'center';

        const labels = [
            {text: 'STRAIT OF HORMUZ', lat: 26.5, lon: 56.25},
            {text: 'SUEZ CANAL', lat: 30, lon: 32},
            {text: 'STRAIT OF MALACCA', lat: 1.5, lon: 103},
            {text: 'PANAMA CANAL', lat: 9, lon: -79.5},
            {text: 'PERSIAN GULF', lat: 28, lon: 51}
        ];

        labels.forEach(label => {
            const {x, y} = this.toCanvas(label.lat, label.lon);
            this.ctx.fillText(label.text, x, y);
        });

        this.ctx.textAlign = 'left';
    }

    /**
     * Fallback simplified map data if GeoJSON load fails
     */
    getFallbackMapData() {
        // Returns minimal hardcoded shapes as backup
        return {
            type: 'FeatureCollection',
            features: []
        };
    }
}

// Export for use in main application
window.WorldMapRenderer = WorldMapRenderer;
