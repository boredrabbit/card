/**
 * GeoJSON World Map Renderer - Military Grade Wireframe
 * Loads real country boundaries and renders with minimal aesthetic
 */

class GeoJSONMapRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.countries = null;
        this.hoveredCountry = null;

        // Zoom and pan state
        this.zoom = 1.0;
        this.minZoom = 1.0;
        this.maxZoom = 25.0; // Increased for detailed tactical view
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.lastPanX = 0;
        this.lastPanY = 0;

        // Theme colors (default to military green)
        this.colors = {
            primary: '#00ff41',
            primaryRgb: '0, 255, 65',
            primaryDim: 'rgba(0, 255, 65, 0.7)',
            primaryFaint: 'rgba(0, 255, 65, 0.3)',
            primaryGhost: 'rgba(0, 255, 65, 0.1)',
            alert: '#ff0000',
            alertRgb: '255, 0, 0',
            warning: '#ffaa00',
            warningRgb: '255, 170, 0',
            naval: '#0099ff'
        };
    }

    /**
     * Update theme colors
     */
    updateThemeColors(colors) {
        this.colors = colors;
    }

    /**
     * Convert hex color to RGB string
     */
    hexToRgb(hex) {
        if (!hex) return '255, 255, 255';
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            '255, 255, 255';
    }

    /**
     * Load GeoJSON country data
     */
    async loadCountries() {
        try {
            console.log('🔍 Attempting to load countries.geo.json...');
            const response = await fetch('countries.geo.json');
            console.log('📡 Response received:', response.status, response.statusText);

            const data = await response.json();
            console.log('📊 Data parsed, type:', data.type);
            console.log('📊 Features count:', data.features ? data.features.length : 0);

            this.countries = data.features;
            console.log(`✅ Loaded ${this.countries.length} countries`);
            console.log('🗺️ First country:', this.countries[0].properties.name);
            console.log('🗺️ Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
            return true;
        } catch (error) {
            console.error('❌ Error loading countries:', error);
            console.error('Error details:', error.message);
            return false;
        }
    }

    /**
     * Convert lat/lon to canvas coordinates (Equirectangular projection with zoom/pan)
     */
    toCanvas(lat, lon) {
        // Base projection
        const baseX = this.canvas.width * ((lon + 180) / 360);
        const baseY = this.canvas.height * ((90 - lat) / 180);

        // Apply zoom and pan
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const x = centerX + (baseX - centerX) * this.zoom + this.panX;
        const y = centerY + (baseY - centerY) * this.zoom + this.panY;

        return { x, y };
    }

    /**
     * Convert canvas coordinates back to lat/lon (accounting for zoom/pan)
     */
    toLatLon(canvasX, canvasY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Reverse zoom and pan
        const baseX = ((canvasX - this.panX) - centerX) / this.zoom + centerX;
        const baseY = ((canvasY - this.panY) - centerY) / this.zoom + centerY;

        // Convert to lat/lon
        const lon = (baseX / this.canvas.width) * 360 - 180;
        const lat = 90 - (baseY / this.canvas.height) * 180;

        return { lat, lon };
    }

    /**
     * Draw all countries with military wireframe aesthetic
     */
    drawCountries() {
        if (!this.countries) {
            console.warn('⚠️ drawCountries() called but this.countries is null/undefined');
            return;
        }

        // Removed excessive logging that was being called 60 times per second
        const rgb = this.colors.primaryRgb || '0, 255, 65';
        const isMonoTheme = rgb === '255, 255, 255';

        let drawnCount = 0;
        this.countries.forEach(country => {
            const isHovered = this.hoveredCountry &&
                             this.hoveredCountry.properties.name === country.properties.name;

            // Set military wireframe style - much darker and more subtle
            if (isHovered) {
                // Highlighted style for hovered country - brighter for mono theme
                if (isMonoTheme) {
                    this.ctx.strokeStyle = `rgba(${rgb}, 0.7)`;
                    this.ctx.fillStyle = `rgba(${rgb}, 0.12)`;
                    this.ctx.lineWidth = 1.5;
                } else {
                    this.ctx.strokeStyle = `rgba(${rgb}, 0.25)`;
                    this.ctx.fillStyle = `rgba(${rgb}, 0.05)`;
                    this.ctx.lineWidth = 1;
                }
            } else {
                // Normal style - ultra faint for deep black OLED
                if (isMonoTheme) {
                    this.ctx.strokeStyle = `rgba(${rgb}, 0.12)`;
                    this.ctx.fillStyle = `rgba(${rgb}, 0.015)`;
                    this.ctx.lineWidth = 0.4;
                } else {
                    this.ctx.strokeStyle = `rgba(${rgb}, 0.08)`;
                    this.ctx.fillStyle = `rgba(${rgb}, 0.01)`;
                    this.ctx.lineWidth = 0.4;
                }
            }

            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';

            this.drawFeature(country);
            drawnCount++;
        });

        // Removed excessive logging
    }

    /**
     * Draw a single GeoJSON feature (country)
     */
    drawFeature(feature) {
        const geometry = feature.geometry;

        if (geometry.type === 'Polygon') {
            this.drawPolygon(geometry.coordinates);
        } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach(polygon => {
                this.drawPolygon(polygon);
            });
        }
    }

    /**
     * Draw a polygon
     */
    drawPolygon(coordinates) {
        coordinates.forEach(ring => {
            if (ring.length < 3) return;

            this.ctx.beginPath();

            ring.forEach((coord, i) => {
                const [lon, lat] = coord;

                // Handle coordinates that cross the antimeridian (180° longitude)
                let adjustedLon = lon;
                if (i > 0) {
                    const [prevLon] = ring[i - 1];
                    const diff = lon - prevLon;

                    // If the difference is greater than 180°, we've crossed the antimeridian
                    if (diff > 180) adjustedLon = lon - 360;
                    else if (diff < -180) adjustedLon = lon + 360;
                }

                const {x, y} = this.toCanvas(lat, adjustedLon);

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
     * Check if a point is inside a country
     */
    getCountryAtPoint(mouseX, mouseY) {
        if (!this.countries) return null;

        // Convert canvas coordinates back to lat/lon (accounting for zoom/pan)
        const { lat, lon } = this.toLatLon(mouseX, mouseY);

        // Check each country
        for (const country of this.countries) {
            if (this.isPointInCountry(lat, lon, country)) {
                return country;
            }
        }

        return null;
    }

    /**
     * Handle zoom with mouse wheel
     */
    handleWheel(e, mouseX, mouseY) {
        e.preventDefault();

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomFactor));

        if (newZoom !== this.zoom) {
            // Zoom towards mouse position
            const { lat, lon } = this.toLatLon(mouseX, mouseY);

            this.zoom = newZoom;

            // Adjust pan to keep mouse position stable
            const newPos = this.toCanvas(lat, lon);
            this.panX += mouseX - newPos.x;
            this.panY += mouseY - newPos.y;

            // Constrain pan to keep map within bounds
            this.constrainPan();
        }

        return true; // Redraw needed
    }

    /**
     * Handle mouse down for panning
     */
    handleMouseDown(e, mouseX, mouseY) {
        this.isDragging = true;
        this.dragStartX = mouseX;
        this.dragStartY = mouseY;
        this.lastPanX = this.panX;
        this.lastPanY = this.panY;
    }

    /**
     * Handle mouse move for panning
     */
    handleMouseMove(mouseX, mouseY) {
        if (this.isDragging) {
            this.panX = this.lastPanX + (mouseX - this.dragStartX);
            this.panY = this.lastPanY + (mouseY - this.dragStartY);
            this.constrainPan();
            return true; // Redraw needed
        }
        return false;
    }

    /**
     * Constrain panning to keep map content visible
     */
    constrainPan() {
        // Calculate the scaled map dimensions
        const scaledWidth = this.canvas.width * this.zoom;
        const scaledHeight = this.canvas.height * this.zoom;

        // Calculate maximum pan values to keep map within bounds
        const maxPanX = (scaledWidth - this.canvas.width) / 2;
        const maxPanY = (scaledHeight - this.canvas.height) / 2;

        // Constrain pan values
        this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.panX));
        this.panY = Math.max(-maxPanY, Math.min(maxPanY, this.panY));
    }

    /**
     * Handle mouse up
     */
    handleMouseUp() {
        this.isDragging = false;
    }

    /**
     * Reset zoom and pan
     */
    resetView() {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
    }

    /**
     * Check if a lat/lon point is inside a country's geometry
     */
    isPointInCountry(lat, lon, country) {
        const geometry = country.geometry;

        if (geometry.type === 'Polygon') {
            return this.isPointInPolygon(lat, lon, geometry.coordinates);
        } else if (geometry.type === 'MultiPolygon') {
            for (const polygon of geometry.coordinates) {
                if (this.isPointInPolygon(lat, lon, polygon)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Ray casting algorithm to check if point is in polygon
     */
    isPointInPolygon(lat, lon, coordinates) {
        const ring = coordinates[0]; // Use outer ring
        let inside = false;

        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];

            const intersect = ((yi > lat) !== (yj > lat)) &&
                            (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**
     * Shipping lane data with metadata for hover cards and intel feed
     */
    getShippingLaneData() {
        return [
            {
                id: 'suez-canal',
                name: 'Suez Canal Route',
                description: 'Mediterranean → Red Sea → Indian Ocean',
                tradeVolume: '12-15% of global trade',
                keyPorts: ['Gibraltar', 'Port Said', 'Suez', 'Aden', 'Mumbai'],
                strategicValue: 'Critical chokepoint - Houthi attacks disrupting traffic since 2023',
                riskLevel: 'HIGH',
                coords: [
                    [35, -6], [36, 0], [37, 10], [33, 28], [31.5, 32.3],
                    [30, 32.5], [29.5, 32.5], [27.5, 34], [22, 38], [15, 42],
                    [12.5, 43.5], [12, 45], [11.5, 51], [10, 55], [5, 60], [-2, 65]
                ]
            },
            {
                id: 'malacca-strait',
                name: 'Strait of Malacca',
                description: 'Singapore → South China Sea → East Asia',
                tradeVolume: '25% of global trade, 80% of China oil imports',
                keyPorts: ['Singapore', 'Hong Kong', 'Shanghai', 'Busan'],
                strategicValue: 'Busiest shipping lane - vital for Asia-Pacific economies',
                riskLevel: 'MEDIUM',
                coords: [
                    [1.3, 103.8], [3, 105], [5, 104], [7, 106], [10, 109],
                    [15, 113], [18, 115], [22, 114], [25, 120], [30, 123], [35, 130]
                ]
            },
            {
                id: 'transatlantic-north',
                name: 'North Atlantic Route',
                description: 'US East Coast → English Channel',
                tradeVolume: '$800B+ annual trade volume',
                keyPorts: ['New York', 'Boston', 'Rotterdam', 'Hamburg', 'London'],
                strategicValue: 'Historic trade route - NATO maritime corridor',
                riskLevel: 'LOW',
                coords: [
                    [40.5, -74], [41, -70], [42, -65], [43, -55], [47, -40],
                    [50, -25], [50, -10], [50.5, -5], [51, 1]
                ]
            },
            {
                id: 'transatlantic-south',
                name: 'South Atlantic Route',
                description: 'Gulf of Mexico → Caribbean → Gibraltar',
                tradeVolume: '$400B+ annual trade',
                keyPorts: ['New Orleans', 'Miami', 'Gibraltar', 'Casablanca'],
                strategicValue: 'Oil/LNG tanker route - Caribbean transit zone',
                riskLevel: 'LOW',
                coords: [
                    [29, -89], [25, -84], [23, -80], [22, -75], [20, -68],
                    [18, -65], [20, -55], [25, -40], [30, -25], [34, -10], [35.5, -6]
                ]
            },
            {
                id: 'cape-good-hope',
                name: 'Cape of Good Hope',
                description: 'South Atlantic → Indian Ocean (Suez bypass)',
                tradeVolume: '9% of global trade (increasing due to Red Sea crisis)',
                keyPorts: ['Cape Town', 'Durban', 'Maputo', 'Mombasa'],
                strategicValue: 'Alternative to Suez - longer but safer route',
                riskLevel: 'LOW',
                coords: [
                    [-35, 18], [-35, 22], [-33, 28], [-30, 33], [-25, 37],
                    [-15, 42], [-10, 48], [-5, 55], [0, 60], [5, 65]
                ]
            },
            {
                id: 'panama-pacific',
                name: 'Panama Canal → South Pacific',
                description: 'Panama → South American West Coast',
                tradeVolume: '5% of global maritime trade',
                keyPorts: ['Panama City', 'Callao', 'Valparaiso'],
                strategicValue: 'Pacific access - drought affecting canal capacity',
                riskLevel: 'MEDIUM',
                coords: [
                    [9, -79.5], [8, -82], [5, -85], [0, -90], [-5, -100], [-15, -110]
                ]
            },
            {
                id: 'panama-uswest',
                name: 'Panama Canal → US West Coast',
                description: 'Panama → California → Pacific Northwest',
                tradeVolume: '6% of global trade',
                keyPorts: ['Panama City', 'Los Angeles', 'San Francisco', 'Seattle'],
                strategicValue: 'Asia-Americas trade route - critical supply chain',
                riskLevel: 'MEDIUM',
                coords: [
                    [9, -79.5], [12, -85], [16, -95], [22, -106], [28, -114],
                    [33, -118], [37, -122], [42, -125], [48, -125]
                ]
            },
            {
                id: 'transpacific-west',
                name: 'Transpacific (Western)',
                description: 'Japan → Central Pacific',
                tradeVolume: 'Part of $1.2T Pacific trade',
                keyPorts: ['Yokohama', 'Kobe', 'Busan'],
                strategicValue: 'US-Asia trade lifeline - container shipping hub',
                riskLevel: 'LOW',
                coords: [
                    [35, 130], [35, 140], [33, 150], [30, 160], [28, 170]
                ]
            },
            {
                id: 'transpacific-east',
                name: 'Transpacific (Eastern)',
                description: 'Central Pacific → US West Coast',
                tradeVolume: 'Part of $1.2T Pacific trade',
                keyPorts: ['Honolulu', 'Los Angeles', 'Long Beach', 'Oakland'],
                strategicValue: 'Primary container shipping route',
                riskLevel: 'LOW',
                coords: [
                    [26, -170], [26, -160], [28, -150], [32, -140], [35, -130], [37, -123]
                ]
            },
            {
                id: 'persian-gulf-malacca',
                name: 'Persian Gulf → Malacca',
                description: 'Strait of Hormuz → India → Singapore',
                tradeVolume: '20% of global oil trade',
                keyPorts: ['Dubai', 'Mumbai', 'Colombo', 'Singapore'],
                strategicValue: 'Critical oil tanker route - Hormuz chokepoint',
                riskLevel: 'HIGH',
                coords: [
                    [26.5, 56.5], [24, 58], [21, 62], [18, 68], [15, 73],
                    [10, 76], [8, 77], [6, 80], [5, 85], [3, 95], [2, 100], [1.3, 103.8]
                ]
            },
            {
                id: 'asia-australia',
                name: 'East Asia → Australia',
                description: 'Hong Kong → Makassar Strait → Sydney',
                tradeVolume: '$180B+ Australia-Asia trade',
                keyPorts: ['Hong Kong', 'Manila', 'Jakarta', 'Brisbane', 'Sydney'],
                strategicValue: 'Resource exports - iron ore, coal, LNG',
                riskLevel: 'LOW',
                coords: [
                    [22, 114], [18, 116], [12, 117], [5, 117], [0, 117],
                    [-3, 117], [-6, 116], [-8.5, 116], [-10, 120], [-12, 127],
                    [-14, 135], [-18, 145], [-25, 153], [-34, 151]
                ]
            },
            {
                id: 'bosphorus-mediterranean',
                name: 'Bosphorus → Mediterranean',
                description: 'Black Sea → Aegean → Western Mediterranean',
                tradeVolume: '3% of global trade, Ukraine grain exports',
                keyPorts: ['Istanbul', 'Piraeus', 'Malta', 'Gibraltar'],
                strategicValue: 'Ukraine grain corridor - NATO/Russia tensions',
                riskLevel: 'MEDIUM',
                coords: [
                    [41, 29], [40.5, 26.5], [39.5, 25], [37.5, 24], [35.5, 23],
                    [35, 20], [35.5, 15], [37, 11], [37.5, 5], [36.5, 0], [35.8, -5.5]
                ]
            }
        ];
    }

    /**
     * Draw shipping lanes with hover highlighting
     */
    drawShippingLanes(hoveredLaneId = null) {
        const lanes = this.getShippingLaneData();

        lanes.forEach(lane => {
            const isHovered = lane.id === hoveredLaneId;

            // Set style based on hover state and risk level
            if (isHovered) {
                // Highlighted style - bright cyan with glow
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([12, 6]);

                // Draw glow effect
                this.ctx.save();
                this.ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
                this.ctx.shadowBlur = 10;
            } else {
                // Normal style - subtle dashed lines
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
                this.ctx.lineWidth = 1.2;
                this.ctx.setLineDash([8, 8]);
            }

            // Draw the route
            if (lane.coords.length >= 2) {
                this.ctx.beginPath();
                const start = this.toCanvas(lane.coords[0][0], lane.coords[0][1]);
                this.ctx.moveTo(start.x, start.y);

                for (let i = 1; i < lane.coords.length; i++) {
                    const point = this.toCanvas(lane.coords[i][0], lane.coords[i][1]);
                    this.ctx.lineTo(point.x, point.y);
                }

                this.ctx.stroke();
            }

            if (isHovered) {
                this.ctx.restore();
            }
        });

        // Reset line dash
        this.ctx.setLineDash([]);
    }

    /**
     * Check if a point is near a shipping lane
     * Returns the lane ID if hovering, null otherwise
     */
    getShippingLaneAtPoint(mouseX, mouseY) {
        const { lat, lon } = this.toLatLon(mouseX, mouseY);
        const lanes = this.getShippingLaneData();
        const threshold = 3 / this.zoom; // Pixel threshold adjusted for zoom

        for (const lane of lanes) {
            for (let i = 0; i < lane.coords.length - 1; i++) {
                const p1 = lane.coords[i];
                const p2 = lane.coords[i + 1];

                // Distance from point to line segment
                const dist = this.distanceToLineSegment(lat, lon, p1[0], p1[1], p2[0], p2[1]);

                if (dist < threshold) {
                    return lane;
                }
            }
        }

        return null;
    }

    /**
     * Calculate distance from a point to a line segment
     */
    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) {
            // Line segment is a point
            return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        }

        // Project point onto line segment
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        const nearestX = x1 + t * dx;
        const nearestY = y1 + t * dy;

        return Math.sqrt((px - nearestX) * (px - nearestX) + (py - nearestY) * (py - nearestY));
    }

    /**
     * Preload news for nearby shipping lanes (call on mousemove near lanes)
     */
    preloadNearbyShippingLaneNews(mouseX, mouseY) {
        if (!window.conflictNewsService) return;

        const { lat, lon } = this.toLatLon(mouseX, mouseY);
        const lanes = this.getShippingLaneData();
        const preloadThreshold = 8 / this.zoom; // Larger radius for preloading

        for (const lane of lanes) {
            for (let i = 0; i < lane.coords.length - 1; i++) {
                const p1 = lane.coords[i];
                const p2 = lane.coords[i + 1];
                const dist = this.distanceToLineSegment(lat, lon, p1[0], p1[1], p2[0], p2[1]);

                if (dist < preloadThreshold) {
                    // Preload this lane's news
                    window.conflictNewsService.preloadZone(lane.id);
                    break;
                }
            }
        }
    }

    /**
     * Draw shipping lane info card with dynamic risk assessment and live news
     * Uses real-time geopolitical risk scoring + news feed
     */
    drawShippingLaneCard(lane, mouseX, mouseY) {
        if (!lane) return;

        // Get dynamic risk assessment from service
        let riskData = null;
        if (window.shippingLaneRiskService) {
            riskData = window.shippingLaneRiskService.calculateRiskScore(lane.id);
        }

        // Get cached news for this shipping lane (also triggers fetch if not cached)
        let news = null;
        if (window.conflictNewsService) {
            news = window.conflictNewsService.getCachedNews(lane.id);
        }

        const padding = 14;
        const cardWidth = 280;
        const lineHeight = 14;

        // Calculate height based on content
        let cardHeight = 56; // Base: name + trade volume + risk score
        if (riskData && riskData.primaryThreat) {
            cardHeight += 16; // Threat line
        }
        // Add space for news items (up to 2)
        const newsToShow = news ? news.slice(0, 2) : [];
        if (newsToShow.length > 0) {
            cardHeight += 8 + (newsToShow.length * lineHeight); // Separator + news items
        }

        // Position card near mouse but keep on screen
        let cardX = mouseX + 20;
        let cardY = mouseY - cardHeight / 2;

        // Keep card on screen
        if (cardX + cardWidth > this.canvas.width - 10) {
            cardX = mouseX - cardWidth - 20;
        }
        if (cardY < 10) cardY = 10;
        if (cardY + cardHeight > this.canvas.height - 10) {
            cardY = this.canvas.height - cardHeight - 10;
        }

        // Pure black background - true OLED black
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.96)';
        this.ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

        // Risk-based accent line colors
        const riskColors = {
            'CRITICAL': 'rgba(255, 40, 40, 1)',
            'HIGH': 'rgba(255, 80, 60, 0.95)',
            'ELEVATED': 'rgba(255, 180, 60, 0.9)',
            'LOW': 'rgba(60, 220, 130, 0.85)'
        };

        const riskLevel = riskData ? riskData.level : 'LOW';
        const riskScore = riskData ? riskData.score : 0;

        // Left accent bar
        this.ctx.fillStyle = riskColors[riskLevel] || 'rgba(0, 255, 255, 0.7)';
        this.ctx.fillRect(cardX, cardY, 3, cardHeight);

        let y = cardY + 18;

        // Route name - bright white
        this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        this.ctx.font = 'bold 11px Courier New';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(lane.name.toUpperCase(), cardX + padding, y);

        // Risk score - top right
        if (riskData) {
            this.ctx.fillStyle = riskColors[riskLevel];
            this.ctx.font = 'bold 13px Courier New';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(riskScore.toString(), cardX + cardWidth - padding, y);
        }

        y += 14;

        // Trade volume - light gray
        this.ctx.fillStyle = 'rgba(180, 180, 180, 0.9)';
        this.ctx.font = '9px Courier New';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(lane.tradeVolume, cardX + padding, y);

        // Risk label - right aligned
        if (riskData) {
            this.ctx.fillStyle = 'rgba(140, 140, 140, 0.85)';
            this.ctx.font = '8px Courier New';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(riskData.label, cardX + cardWidth - padding, y);
        }

        y += 16;

        // Primary threat - if exists
        if (riskData && riskData.primaryThreat) {
            this.ctx.fillStyle = riskColors[riskLevel];
            this.ctx.font = '9px Courier New';
            this.ctx.textAlign = 'left';
            let threatText = riskData.primaryThreat;
            if (threatText.length > 38) {
                threatText = threatText.substring(0, 35) + '...';
            }
            this.ctx.fillText(threatText, cardX + padding, y);
            y += 14;
        }

        // News feed section
        if (newsToShow.length > 0) {
            // Subtle separator line
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(cardX + padding, y - 4, cardWidth - padding * 2, 1);

            y += 6;

            // News items
            newsToShow.forEach((item, index) => {
                // Truncate title to fit
                let title = item.title;
                const maxLen = 36;
                if (title.length > maxLen) {
                    title = title.substring(0, maxLen - 3) + '...';
                }

                // News title - white
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.font = '9px Courier New';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(title, cardX + padding, y);

                // Time ago - right aligned, dim
                this.ctx.fillStyle = 'rgba(120, 120, 120, 0.8)';
                this.ctx.font = '8px Courier New';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(item.timeAgo || '', cardX + cardWidth - padding, y);

                y += lineHeight;
            });
        } else if (window.conflictNewsService && !news) {
            // Show loading indicator if news is being fetched
            this.ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
            this.ctx.font = '8px Courier New';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('Loading intel...', cardX + padding, y + 4);
        }

        // Reset text align
        this.ctx.textAlign = 'left';
    }

    /**
     * Helper: Wrap text within a max width
     */
    wrapText(text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = this.ctx.measureText(testLine);

            if (metrics.width > maxWidth && i > 0) {
                this.ctx.fillText(line, x, y);
                line = words[i] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, x, y);
    }

    /**
     * Draw strategic location labels - neon style for OLED
     */
    drawLabels() {
        // Scale font size with zoom level
        const labelFontSize = Math.max(7, Math.min(13, 9 * Math.sqrt(this.zoom)));
        // Electric cyan for labels
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        this.ctx.font = `${labelFontSize}px Courier New`;
        this.ctx.textAlign = 'center';

        const labels = [
            {text: 'STRAIT OF HORMUZ', lat: 26.5, lon: 56.25},
            {text: 'SUEZ CANAL', lat: 30, lon: 32},
            {text: 'STRAIT OF MALACCA', lat: 1.5, lon: 103},
            {text: 'PANAMA CANAL', lat: 9, lon: -79.5},
            {text: 'PERSIAN GULF', lat: 28, lon: 51}
        ];

        // Only draw labels if zoomed in enough (zoom > 2.0)
        if (this.zoom > 2.0) {
            labels.forEach(label => {
                const {x, y} = this.toCanvas(label.lat, label.lon);
                this.ctx.fillText(label.text, x, y);
            });
        }

        this.ctx.textAlign = 'left';
    }

    /**
     * Draw conflict zones (occupied territories, contested areas)
     */
    drawConflictZones(conflictData) {
        if (!conflictData) return;

        const conflicts = conflictData.getVisibleConflicts(this.zoom);

        conflicts.forEach(conflict => {
            if (conflict.occupiedTerritories) {
                conflict.occupiedTerritories.forEach(territory => {
                    this.drawConflictTerritory(territory);
                });
            }

            // Draw frontlines if available
            if (conflict.frontlines && conflict.frontlines.length > 0) {
                this.drawFrontline(conflict.frontlines);
            }
        });

        // Draw potential conflict zones
        const potentials = conflictData.getPotentialConflicts();
        potentials.forEach(potential => {
            this.drawPotentialConflictZone(potential);
        });
    }

    /**
     * Draw a single conflict territory polygon
     * Style: Very subtle fill, barely visible - just enough to indicate area
     */
    drawConflictTerritory(territory) {
        // Extract RGB from color and create very subtle version
        const colorMatch = territory.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!colorMatch) return;

        const [, r, g, b] = colorMatch;

        // Very subtle fill - barely visible
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.08)`;
        // Subtle dashed border
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
        this.ctx.lineWidth = 0.5;
        this.ctx.setLineDash([4, 4]);

        this.ctx.beginPath();
        territory.coordinates.forEach((coord, i) => {
            const [lat, lon] = coord;
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

        this.ctx.setLineDash([]);
    }

    /**
     * Draw frontline - clean, minimal style
     * Style: Single thin line with subtle direction indicators
     */
    drawFrontline(frontlineCoords) {
        if (frontlineCoords.length < 2) return;

        // Clean thin line - electric pink for OLED
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = 'rgba(255, 20, 147, 0.6)'; // Electric pink

        // Draw main frontline as smooth path
        this.ctx.beginPath();
        frontlineCoords.forEach((segment, i) => {
            const coord = segment.coords || segment;
            const [lat, lon] = coord;
            const {x, y} = this.toCanvas(lat, lon);

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();

        // Draw small direction dots at zoom > 5.0 (very subtle)
        if (this.zoom > 5.0) {
            frontlineCoords.forEach((segment, i) => {
                if (i === 0 || !segment.direction || segment.direction === 'static') return;

                const coord = segment.coords || segment;
                const [lat, lon] = coord;
                const {x, y} = this.toCanvas(lat, lon);

                // Small dot to indicate pressure point - electric colors
                const dotColor = segment.direction === 'russian_advance'
                    ? 'rgba(255, 20, 147, 0.8)' // Electric pink
                    : 'rgba(0, 191, 255, 0.8)'; // Electric cyan

                this.ctx.fillStyle = dotColor;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
    }

    /**
     * Draw potential conflict zone (radius-based)
     * Style: Very subtle dashed circle - barely visible
     */
    drawPotentialConflictZone(potential) {
        const {x, y} = this.toCanvas(potential.coordinates[0], potential.coordinates[1]);

        // Only draw if on screen
        if (x < -200 || x > this.canvas.width + 200 || y < -200 || y > this.canvas.height + 200) {
            return;
        }

        // Calculate radius in pixels (approximate)
        const kmPerDegree = 111;
        const radiusInDegrees = potential.radius / kmPerDegree;
        const {x: x2} = this.toCanvas(potential.coordinates[0] + radiusInDegrees, potential.coordinates[1]);
        const radiusPixels = Math.abs(x2 - x) * this.zoom;

        // Extract color and make very subtle
        const colorMatch = potential.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!colorMatch) return;
        const [, r, g, b] = colorMatch;

        // Very subtle dashed circle - no fill
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
        this.ctx.lineWidth = 0.5;
        this.ctx.setLineDash([6, 6]);

        this.ctx.beginPath();
        this.ctx.arc(x, y, radiusPixels, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    /**
     * Draw real-time Ukraine frontline from DeepState data
     * Style: Clear, professional military map aesthetic
     * Shows occupied territory boundary and fill
     */
    drawUkraineFrontline(frontlineData) {
        if (!frontlineData || !frontlineData.occupiedTerritory) return;

        const polygons = frontlineData.getOccupiedTerritoryPolygons();
        if (polygons.length === 0) return;

        // Draw occupied territory fill first (very subtle)
        this.ctx.fillStyle = 'rgba(120, 40, 40, 0.15)';
        polygons.forEach(polygon => {
            if (polygon.length < 3) return;

            this.ctx.beginPath();
            polygon.forEach((coord, i) => {
                // GeoJSON is [lon, lat], we need to convert
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
        });

        // Draw the frontline (boundary) - clear, visible line
        const frontlines = frontlineData.getFrontlineCoordinates();

        // Line style based on zoom level
        const lineWidth = Math.max(1, 1.5 * Math.sqrt(this.zoom));

        frontlines.forEach(frontline => {
            if (frontline.length < 2) return;

            // Main frontline - electric pink for OLED
            this.ctx.strokeStyle = 'rgba(255, 20, 147, 0.9)';
            this.ctx.lineWidth = lineWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.ctx.beginPath();
            let pointsDrawn = 0;

            frontline.forEach((coord, i) => {
                const [lon, lat] = coord;
                const {x, y} = this.toCanvas(lat, lon);

                // Skip points that are way off screen for performance
                const margin = 100;
                const isOnScreen = x > -margin && x < this.canvas.width + margin &&
                                   y > -margin && y < this.canvas.height + margin;

                if (pointsDrawn === 0) {
                    this.ctx.moveTo(x, y);
                    pointsDrawn++;
                } else {
                    this.ctx.lineTo(x, y);
                    pointsDrawn++;
                }
            });

            this.ctx.stroke();

            // Add subtle glow effect at higher zoom
            if (this.zoom > 2.0) {
                this.ctx.strokeStyle = 'rgba(255, 20, 147, 0.3)';
                this.ctx.lineWidth = lineWidth + 2;
                this.ctx.stroke();
            }
        });

        // Draw "FRONT LINE" label at appropriate zoom
        if (this.zoom > 3.0 && frontlines.length > 0 && frontlines[0].length > 100) {
            // Pick a point along the main frontline for the label
            const mainFrontline = frontlines[0];
            const labelIndex = Math.floor(mainFrontline.length * 0.3);
            const [lon, lat] = mainFrontline[labelIndex];
            const {x, y} = this.toCanvas(lat, lon);

            const fontSize = Math.max(8, Math.min(12, 9 * Math.sqrt(this.zoom)));
            this.ctx.fillStyle = 'rgba(255, 20, 147, 0.9)';
            this.ctx.font = `bold ${fontSize}px Courier New`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('FRONT LINE', x, y - 8);
            this.ctx.textAlign = 'left';
        }

        // Draw data source attribution
        if (this.zoom > 1.5) {
            const status = frontlineData.getStatus();
            if (status.lastUpdate) {
                const updateStr = status.lastUpdate.toLocaleDateString();
                this.ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
                this.ctx.font = '8px Courier New';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(`Frontline data: DeepStateMap (${updateStr})`, this.canvas.width - 10, this.canvas.height - 10);
                this.ctx.textAlign = 'left';
            }
        }
    }

    /**
     * Draw cities - minimal dark mode style with collision detection
     * Style: Small dots, labels positioned to avoid overlap
     */
    drawCities(conflictData, labelBoxes = []) {
        if (!conflictData) return labelBoxes;

        const cities = conflictData.getVisibleCities(this.zoom);

        this.ctx.textAlign = 'left';
        cities.forEach(city => {
            const {x, y} = this.toCanvas(city.lat, city.lon);

            // Only draw if on screen
            if (x < -50 || x > this.canvas.width + 50 || y < -50 || y > this.canvas.height + 50) {
                return;
            }

            // Very subtle city marker - electric teal for OLED
            const markerSize = city.strategic ? 2.5 : 2;
            this.ctx.fillStyle = city.strategic ? 'rgba(64, 224, 208, 0.8)' : 'rgba(100, 200, 200, 0.5)'; // Electric teal
            this.ctx.beginPath();
            this.ctx.arc(x, y, markerSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Only show city names at higher zoom (strategic at 3.0+, others at 4.0+)
            const showLabel = (city.strategic && this.zoom > 3.0) || (!city.strategic && this.zoom > 4.0);
            if (showLabel) {
                const fontSize = Math.max(6, Math.min(10, 6 + this.zoom * 0.3));
                this.ctx.font = `${fontSize}px Courier New`;
                const textWidth = this.ctx.measureText(city.name).width;
                const textHeight = fontSize;

                // Try different positions
                const positions = [
                    { dx: 4, dy: -2 },
                    { dx: 4, dy: textHeight + 2 },
                    { dx: -textWidth - 4, dy: -2 },
                    { dx: -textWidth - 4, dy: textHeight + 2 }
                ];

                let bestPos = null;
                for (const pos of positions) {
                    const labelX = x + pos.dx;
                    const labelY = y + pos.dy;
                    const box = {
                        x: labelX - 2,
                        y: labelY - textHeight,
                        width: textWidth + 4,
                        height: textHeight + 4
                    };

                    const hasCollision = labelBoxes.some(existing =>
                        box.x < existing.x + existing.width &&
                        box.x + box.width > existing.x &&
                        box.y < existing.y + existing.height &&
                        box.y + box.height > existing.y
                    );

                    if (!hasCollision) {
                        bestPos = { labelX, labelY, box };
                        break;
                    }
                }

                if (bestPos) {
                    this.ctx.fillStyle = city.strategic ? 'rgba(64, 224, 208, 0.7)' : 'rgba(100, 200, 200, 0.5)'; // Electric teal
                    this.ctx.fillText(city.name, bestPos.labelX, bestPos.labelY);
                    labelBoxes.push(bestPos.box);
                }
            }
        });

        this.ctx.textAlign = 'left';
        return labelBoxes;
    }

    /**
     * Draw battle zones - with visual hierarchy based on importance and activity
     * Style: Size and brightness vary by importance; activity level shown with subtle indicators
     * Includes label collision detection to prevent overlap
     * Returns labelBoxes for use by other rendering methods
     */
    drawBattleZones(conflictData, existingLabelBoxes = []) {
        const labelBoxes = [...existingLabelBoxes];
        if (!conflictData || this.zoom < 2.5) return labelBoxes;

        const conflicts = conflictData.getVisibleConflicts(this.zoom);

        // Collect all battle zones and sort by importance (low first, high last - so high draws on top)
        const allZones = [];
        conflicts.forEach(conflict => {
            const battleZones = conflictData.getVisibleBattleZones(this.zoom, conflict);
            allZones.push(...battleZones);
        });

        // Sort: low importance first, high importance last (renders on top)
        const importanceOrder = { 'low': 0, 'medium': 1, 'high': 2 };
        allZones.sort((a, b) => {
            const aOrder = importanceOrder[a.importance] || 1;
            const bOrder = importanceOrder[b.importance] || 1;
            return aOrder - bOrder;
        });

        // Track label positions for collision detection (includes existing)

        // First pass: draw all markers
        allZones.forEach(zone => {
            const {x, y} = this.toCanvas(zone.center[0], zone.center[1]);

            // Only draw if on screen
            if (x < -50 || x > this.canvas.width + 50 || y < -50 || y > this.canvas.height + 50) {
                return;
            }

            // Visual hierarchy - importance determines size and opacity
            const importance = zone.importance || 'medium';
            let baseSize, baseOpacity;
            if (importance === 'high') {
                baseSize = 4;
                baseOpacity = 1.0;
            } else if (importance === 'medium') {
                baseSize = 3;
                baseOpacity = 0.8;
            } else {
                baseSize = 2;
                baseOpacity = 0.6;
            }

            // Activity level affects color intensity and adds glow for 'hot' zones
            const activityLevel = zone.activityLevel || 'active';
            let activityMultiplier = 1.0;
            let showActivityGlow = false;
            if (activityLevel === 'hot') {
                activityMultiplier = 1.2;
                showActivityGlow = true;
            } else if (activityLevel === 'static') {
                activityMultiplier = 0.7;
            }

            // Color based on control status - Electric/neon colors for OLED
            let r, g, b;
            if (zone.status && zone.status.includes('Russian')) {
                r = 255; g = 20; b = 147; // Electric pink (Deep Pink)
            } else if (zone.status && zone.status.includes('Ukrainian')) {
                r = 0; g = 191; b = 255; // Electric cyan (Deep Sky Blue)
            } else {
                r = 255; g = 165; b = 0; // Electric orange
            }

            // Scale marker size with zoom - larger at high zoom
            const markerSize = Math.max(2, baseSize * Math.sqrt(this.zoom) * 0.5);
            const opacity = baseOpacity * activityMultiplier;

            // Draw activity glow for 'hot' zones
            if (showActivityGlow && this.zoom > 3.0) {
                const glowSize = markerSize * 2;
                this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.3})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(x, y, glowSize, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Main marker
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, markerSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Store zone info for label pass
            zone._screenX = x;
            zone._screenY = y;
            zone._markerSize = markerSize;
            zone._opacity = opacity;
            zone._r = r;
            zone._g = g;
            zone._b = b;
        });

        // Second pass: draw labels with collision detection (high importance first)
        const labelZones = allZones.filter(zone => zone._screenX !== undefined).reverse();

        labelZones.forEach(zone => {
            const x = zone._screenX;
            const y = zone._screenY;
            const markerSize = zone._markerSize;
            const opacity = zone._opacity;
            const r = zone._r;
            const g = zone._g;
            const b = zone._b;
            const importance = zone.importance || 'medium';
            const activityLevel = zone.activityLevel || 'active';

            // Label visibility based on importance and zoom - more aggressive at high zoom
            const showLabel = (importance === 'high' && this.zoom > 3.5) ||
                             (importance === 'medium' && this.zoom > 6.0) ||
                             (importance === 'low' && this.zoom > 10.0);

            if (!showLabel) return;

            // Calculate font size - scales better with zoom
            const fontSize = Math.max(7, Math.min(14, 6 + this.zoom * 0.4));
            const fontWeight = importance === 'high' ? 'bold ' : '';

            // Measure text for collision box
            this.ctx.font = `${fontWeight}${fontSize}px Courier New`;
            const textWidth = this.ctx.measureText(zone.name).width;
            const textHeight = fontSize;

            // Try different label positions to avoid overlap
            const positions = [
                { dx: markerSize + 4, dy: 3 },           // Right
                { dx: markerSize + 4, dy: -textHeight }, // Upper right
                { dx: -textWidth - 4, dy: 3 },           // Left
                { dx: -textWidth - 4, dy: -textHeight }, // Upper left
                { dx: markerSize + 4, dy: textHeight + 6 }, // Lower right
            ];

            let bestPos = null;
            for (const pos of positions) {
                const labelX = x + pos.dx;
                const labelY = y + pos.dy;
                const box = {
                    x: labelX - 2,
                    y: labelY - textHeight,
                    width: textWidth + 4,
                    height: textHeight + 4
                };

                // Check collision with existing labels
                const hasCollision = labelBoxes.some(existing =>
                    box.x < existing.x + existing.width &&
                    box.x + box.width > existing.x &&
                    box.y < existing.y + existing.height &&
                    box.y + box.height > existing.y
                );

                if (!hasCollision) {
                    bestPos = { labelX, labelY, box };
                    break;
                }
            }

            // Only draw if we found a non-colliding position (or it's high importance)
            if (bestPos || importance === 'high') {
                const labelX = bestPos ? bestPos.labelX : x + markerSize + 4;
                const labelY = bestPos ? bestPos.labelY : y + 3;
                const box = bestPos ? bestPos.box : {
                    x: labelX - 2,
                    y: labelY - textHeight,
                    width: textWidth + 4,
                    height: textHeight + 4
                };

                // Draw label
                this.ctx.fillStyle = `rgba(220, 220, 220, ${opacity * 0.9})`;
                this.ctx.font = `${fontWeight}${fontSize}px Courier New`;
                this.ctx.textAlign = 'left';
                this.ctx.fillText(zone.name, labelX, labelY);

                // Show status indicator for high-importance hot zones at high zoom
                if (importance === 'high' && this.zoom > 8.0 && activityLevel === 'hot') {
                    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
                    this.ctx.font = `${fontSize - 2}px Courier New`;
                    this.ctx.fillText('● ACTIVE', labelX, labelY + fontSize + 2);
                    box.height += fontSize + 4;
                }

                // Add to collision tracking
                labelBoxes.push(box);
            }
        });

        this.ctx.textAlign = 'left';
        return labelBoxes;
    }

    /**
     * Draw military installations (bases, nuclear facilities, spaceports)
     */
    drawMilitaryInstallations(installationsData) {
        if (!installationsData) return;

        const visible = installationsData.getVisibleInstallations(this.zoom);
        const rgb = this.colors.primaryRgb || '0, 255, 65';

        // Draw bases
        this.drawMilitaryBases(visible.bases, rgb);

        // Draw nuclear facilities
        this.drawNuclearFacilities(visible.facilities, rgb);

        // Draw spaceports
        this.drawSpaceports(visible.spaceports, rgb);
    }

    /**
     * Draw military bases - neon style for OLED
     */
    drawMilitaryBases(bases, rgb) {
        if (!bases) return;

        bases.forEach(base => {
            const {x, y} = this.toCanvas(base.lat, base.lon);

            // Only draw if on screen
            if (x < -50 || x > this.canvas.width + 50 || y < -50 || y > this.canvas.height + 50) {
                return;
            }

            // Electric neon colors for OLED
            let markerColor;
            if (base.nuclear) {
                markerColor = 'rgba(255, 215, 0, 1)'; // Electric gold
            } else if (base.type === 'navy') {
                markerColor = 'rgba(0, 191, 255, 0.9)'; // Electric cyan
            } else if (base.type === 'air_force') {
                markerColor = 'rgba(135, 206, 255, 0.9)'; // Electric sky blue
            } else {
                markerColor = 'rgba(0, 255, 128, 0.8)'; // Electric green
            }

            // Scale marker size with zoom
            const baseSize = base.nuclear ? 4 : 3;
            const markerSize = baseSize * Math.sqrt(this.zoom) * 0.7;

            // Simple square marker with subtle glow for nuclear
            this.ctx.fillStyle = markerColor;
            this.ctx.strokeStyle = markerColor;
            this.ctx.lineWidth = Math.max(1, this.zoom * 0.3);

            // Draw simple square
            this.ctx.fillRect(x - markerSize/2, y - markerSize/2, markerSize, markerSize);

            // Nuclear bases get subtle glow
            if (base.nuclear && this.zoom > 2) {
                this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x - markerSize, y - markerSize, markerSize * 2, markerSize * 2);
            }

            // Draw label at higher zoom
            if (this.zoom > 2.5 || (base.nuclear && this.zoom > 1.8)) {
                const baseFontSize = Math.max(6, Math.min(11, 8 * Math.sqrt(this.zoom)));
                this.ctx.fillStyle = markerColor;
                this.ctx.font = base.nuclear ? `bold ${baseFontSize}px Courier New` : `${baseFontSize}px Courier New`;
                this.ctx.textAlign = 'left';
                this.ctx.fillText(base.name, x + 8, y - 2);

                // Show category at high zoom
                if (this.zoom > 4 && base.category) {
                    const catFontSize = Math.max(5, Math.min(9, 6 * Math.sqrt(this.zoom)));
                    this.ctx.font = `${catFontSize}px Courier New`;
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                    this.ctx.fillText(`[${base.category}]`, x + 8, y + 8);
                }
            }
        });

        this.ctx.textAlign = 'left';
    }

    /**
     * Draw nuclear facilities - neon style for OLED
     */
    drawNuclearFacilities(facilities, rgb) {
        if (!facilities) return;

        facilities.forEach(facility => {
            const {x, y} = this.toCanvas(facility.lat, facility.lon);

            // Only draw if on screen
            if (x < -50 || x > this.canvas.width + 50 || y < -50 || y > this.canvas.height + 50) {
                return;
            }

            // Electric neon colors for OLED
            let markerColor;
            if (facility.type === 'weapons') {
                markerColor = 'rgba(255, 50, 100, 1)'; // Electric red-pink
            } else if (facility.type === 'enrichment') {
                markerColor = 'rgba(255, 165, 0, 1)'; // Electric orange
            } else if (facility.type === 'reprocessing') {
                markerColor = 'rgba(180, 100, 255, 1)'; // Electric purple
            } else {
                markerColor = 'rgba(50, 255, 150, 0.9)'; // Electric green
            }

            // Scale marker size with zoom
            const baseSize = facility.type === 'weapons' ? 4 : 3;
            const markerSize = baseSize * Math.sqrt(this.zoom) * 0.7;

            // Circle marker with glow for weapons facilities
            this.ctx.fillStyle = markerColor;
            this.ctx.strokeStyle = markerColor;
            this.ctx.lineWidth = Math.max(1, this.zoom * 0.3);

            this.ctx.beginPath();
            this.ctx.arc(x, y, markerSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Weapons facilities get a glow
            if (facility.type === 'weapons' && this.zoom > 2) {
                this.ctx.strokeStyle = 'rgba(255, 50, 100, 0.4)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(x, y, markerSize * 1.8, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Draw label
            if (this.zoom > 2.5 || facility.type === 'weapons') {
                const facilityFontSize = Math.max(6, Math.min(10, 7 * Math.sqrt(this.zoom)));
                this.ctx.fillStyle = markerColor;
                this.ctx.font = `${facilityFontSize}px Courier New`;
                this.ctx.textAlign = 'left';
                this.ctx.fillText(facility.name, x + 8, y - 2);
            }
        });

        this.ctx.textAlign = 'left';
    }

    /**
     * Draw spaceports - neon style for OLED
     */
    drawSpaceports(spaceports, rgb) {
        if (!spaceports) return;

        spaceports.forEach(port => {
            const {x, y} = this.toCanvas(port.lat, port.lon);

            // Only draw if on screen
            if (x < -50 || x > this.canvas.width + 50 || y < -50 || y > this.canvas.height + 50) {
                return;
            }

            const markerColor = 'rgba(0, 255, 255, 1)'; // Electric cyan
            // Scale marker size with zoom
            const baseSize = 3;
            const markerSize = baseSize * Math.sqrt(this.zoom) * 0.7;

            // Simple triangle pointing up with glow
            this.ctx.fillStyle = markerColor;
            this.ctx.strokeStyle = markerColor;
            this.ctx.lineWidth = Math.max(1, this.zoom * 0.3);

            this.ctx.beginPath();
            this.ctx.moveTo(x, y - markerSize);
            this.ctx.lineTo(x - markerSize, y + markerSize);
            this.ctx.lineTo(x + markerSize, y + markerSize);
            this.ctx.closePath();
            this.ctx.fill();

            // Add glow effect at higher zoom
            if (this.zoom > 2) {
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }

            // Draw label at higher zoom
            if (this.zoom > 2.5) {
                const portFontSize = Math.max(6, Math.min(10, 7 * Math.sqrt(this.zoom)));
                this.ctx.fillStyle = markerColor;
                this.ctx.font = `${portFontSize}px Courier New`;
                this.ctx.textAlign = 'left';
                this.ctx.fillText(port.name, x + 8, y - 2);
            }
        });

        this.ctx.textAlign = 'left';
    }

    /**
     * Draw nuclear-capable aircraft with trajectory trails
     * Style: Clean radar/ATC aesthetic - no pulsing, no glow, just data
     */
    drawNuclearAircraft(aircraft, installationsData) {
        if (!aircraft) return;

        aircraft.forEach(ac => {
            const {x, y} = this.toCanvas(ac.lat, ac.lon);

            // Get trajectory trail if available
            const trail = installationsData?.getTrail?.(ac.eventId) || [];

            // Draw trajectory trail first (behind aircraft)
            if (trail.length > 1) {
                this.drawTrajectoryTrail(trail, ac);
            }

            // Only draw aircraft marker if on screen
            if (x < -50 || x > this.canvas.width + 50 || y < -50 || y > this.canvas.height + 50) {
                return;
            }

            // Electric neon colors for OLED
            let markerColor, trailColor;
            if (ac.nuclear) {
                markerColor = 'rgba(255, 20, 147, 1)'; // Electric pink for nuclear-capable
                trailColor = '255, 20, 147';
            } else if (ac.nuclearC2) {
                markerColor = 'rgba(255, 215, 0, 1)'; // Electric gold for command
                trailColor = '255, 215, 0';
            } else if (ac.nuclearSupport) {
                markerColor = 'rgba(255, 165, 0, 1)'; // Electric orange for support
                trailColor = '255, 165, 0';
            } else {
                markerColor = 'rgba(0, 191, 255, 1)'; // Electric cyan
                trailColor = '0, 191, 255';
            }

            // Scale marker size with zoom - minimum 12px for visibility
            const baseSize = ac.nuclear || ac.nuclearC2 ? 14 : 12;
            const markerSize = Math.max(12, baseSize * Math.sqrt(this.zoom));
            const headingRad = (ac.heading || 0) * Math.PI / 180 - Math.PI / 2;

            // Draw aircraft as filled dart/arrow - classic radar track symbol
            this.ctx.strokeStyle = markerColor;
            this.ctx.fillStyle = markerColor;
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            // Dart/arrow pointing in direction of travel
            this.ctx.beginPath();

            // Nose (front point) - extends forward
            const noseX = x + Math.cos(headingRad) * markerSize;
            const noseY = y + Math.sin(headingRad) * markerSize;

            // Left wing (swept back at ~140 degrees from nose)
            const wingAngle = 2.4;
            const leftWingX = x + Math.cos(headingRad + wingAngle) * markerSize * 0.6;
            const leftWingY = y + Math.sin(headingRad + wingAngle) * markerSize * 0.6;

            // Tail center (notch behind center)
            const tailX = x + Math.cos(headingRad + Math.PI) * markerSize * 0.2;
            const tailY = y + Math.sin(headingRad + Math.PI) * markerSize * 0.2;

            // Right wing (swept back)
            const rightWingX = x + Math.cos(headingRad - wingAngle) * markerSize * 0.6;
            const rightWingY = y + Math.sin(headingRad - wingAngle) * markerSize * 0.6;

            this.ctx.moveTo(noseX, noseY);
            this.ctx.lineTo(leftWingX, leftWingY);
            this.ctx.lineTo(tailX, tailY);
            this.ctx.lineTo(rightWingX, rightWingY);
            this.ctx.closePath();
            this.ctx.fill();

            // Speed/heading leader line extending from nose
            const leaderLength = markerSize * 1.2;
            this.ctx.strokeStyle = markerColor;
            this.ctx.lineWidth = 1.5;
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(noseX, noseY);
            this.ctx.lineTo(
                noseX + Math.cos(headingRad) * leaderLength,
                noseY + Math.sin(headingRad) * leaderLength
            );
            this.ctx.stroke();
            this.ctx.globalAlpha = 1.0;

            // Draw callsign label
            const labelFontSize = Math.max(7, Math.min(12, 9 * Math.sqrt(this.zoom)));
            this.ctx.fillStyle = markerColor;
            this.ctx.font = ac.nuclear ? `bold ${labelFontSize}px Courier New` : `${labelFontSize}px Courier New`;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(ac.callsign, x + 10, y - 6);

            // Aircraft type and altitude
            if (this.zoom > 1.5) {
                const typeFontSize = Math.max(6, Math.min(10, 7 * Math.sqrt(this.zoom)));
                this.ctx.font = `${typeFontSize}px Courier New`;
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                const altText = ac.altitude ? ` FL${Math.round(ac.altitude / 100)}` : '';
                this.ctx.fillText(`[${ac.type}${altText}]`, x + 10, y + 4);
            }

            // Mission at high zoom
            if (this.zoom > 3 && ac.mission) {
                const missionFontSize = Math.max(5, Math.min(9, 6 * Math.sqrt(this.zoom)));
                this.ctx.font = `${missionFontSize}px Courier New`;
                this.ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
                this.ctx.fillText(ac.mission, x + 10, y + 12);
            }
        });

        this.ctx.textAlign = 'left';
    }

    /**
     * Draw trajectory trail for an aircraft
     * Style: Clean, thin line that fades - like radar history
     */
    drawTrajectoryTrail(trail, ac) {
        if (trail.length < 2) return;

        // Muted trail colors matching the new aircraft style
        let trailColor;
        if (ac.nuclear) {
            trailColor = '220, 80, 80';
        } else if (ac.nuclearC2) {
            trailColor = '220, 180, 60';
        } else if (ac.nuclearSupport) {
            trailColor = '200, 140, 80';
        } else {
            trailColor = '130, 180, 220';
        }

        // Draw trail as simple fading line
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (let i = 1; i < trail.length; i++) {
            const prev = trail[i - 1];
            const curr = trail[i];

            const prevPos = this.toCanvas(prev.lat, prev.lon);
            const currPos = this.toCanvas(curr.lat, curr.lon);

            // Skip if segment is off screen
            if (prevPos.x < -100 && currPos.x < -100) continue;
            if (prevPos.x > this.canvas.width + 100 && currPos.x > this.canvas.width + 100) continue;
            if (prevPos.y < -100 && currPos.y < -100) continue;
            if (prevPos.y > this.canvas.height + 100 && currPos.y > this.canvas.height + 100) continue;

            // Fade from old to new - visible trail
            const progress = i / trail.length;
            const opacity = 0.2 + progress * 0.6; // More visible: 0.2 to 0.8

            this.ctx.strokeStyle = `rgba(${trailColor}, ${opacity})`;
            this.ctx.lineWidth = 2; // Slightly thicker for visibility

            this.ctx.beginPath();
            this.ctx.moveTo(prevPos.x, prevPos.y);
            this.ctx.lineTo(currPos.x, currPos.y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw all submarines with trails and markers
     * Style: Subtle, minimal submarine icons with nationality colors
     */
    drawSubmarines(submarines, installationsData) {
        if (!submarines || submarines.length === 0) return;

        // Electric neon colors by country for OLED
        const countryColors = {
            'USA': { fill: '0, 191, 255', stroke: '0, 255, 255' },        // Electric cyan
            'UK': { fill: '100, 149, 237', stroke: '135, 206, 255' },     // Electric cornflower
            'France': { fill: '65, 105, 225', stroke: '100, 149, 237' },   // Electric royal blue
            'Russia': { fill: '255, 20, 147', stroke: '255, 105, 180' },   // Electric pink
            'China': { fill: '255, 215, 0', stroke: '255, 255, 0' },       // Electric gold
            'India': { fill: '255, 165, 0', stroke: '255, 200, 0' },       // Electric orange
            'Israel': { fill: '0, 191, 255', stroke: '135, 206, 255' },    // Electric cyan
            'North Korea': { fill: '255, 50, 50', stroke: '255, 100, 100' } // Electric red
        };

        submarines.forEach(sub => {
            const {x, y} = this.toCanvas(sub.lat, sub.lon);

            // Get trajectory trail if available
            const trail = installationsData?.getTrail?.(sub.eventId) || [];

            // Draw trajectory trail first (behind submarine)
            if (trail.length > 1) {
                this.drawSubmarineTrail(trail, sub, countryColors);
            }

            // Only draw submarine marker if on screen
            if (x < -50 || x > this.canvas.width + 50 || y < -50 || y > this.canvas.height + 50) {
                return;
            }

            // Get colors for this submarine's country
            const colors = countryColors[sub.country] || { fill: '70, 120, 180', stroke: '100, 150, 210' };

            // Small, subtle marker size - grows slightly with zoom
            const baseSize = 6;
            const markerSize = Math.max(5, baseSize * Math.sqrt(this.zoom) * 0.8);
            const headingRad = ((sub.heading || 0) * Math.PI / 180) - Math.PI / 2;

            // Draw submarine shape - small elongated oval
            this.ctx.fillStyle = `rgba(${colors.fill}, 0.85)`;
            this.ctx.strokeStyle = `rgba(${colors.stroke}, 0.9)`;
            this.ctx.lineWidth = 1;

            // Submarine body (elongated ellipse)
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(headingRad);

            // Hull - subtle
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, markerSize * 1.4, markerSize * 0.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Small conning tower
            this.ctx.fillStyle = `rgba(${colors.stroke}, 0.9)`;
            this.ctx.fillRect(-markerSize * 0.1, -markerSize * 0.7, markerSize * 0.25, markerSize * 0.25);

            // Short bow indicator
            this.ctx.strokeStyle = `rgba(${colors.stroke}, 0.5)`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(markerSize * 1.4, 0);
            this.ctx.lineTo(markerSize * 2, 0);
            this.ctx.stroke();

            this.ctx.restore();

            // Only show labels at higher zoom levels
            if (this.zoom > 2.0) {
                // Small label
                const labelFontSize = Math.max(6, Math.min(10, 7 * Math.sqrt(this.zoom)));
                this.ctx.fillStyle = `rgba(${colors.stroke}, 0.8)`;
                this.ctx.font = `${labelFontSize}px Courier New`;
                this.ctx.textAlign = 'left';
                this.ctx.fillText(sub.name, x + markerSize + 6, y - 2);

                // Type info at higher zoom
                if (this.zoom > 3.0) {
                    const infoFontSize = Math.max(5, Math.min(8, 6 * Math.sqrt(this.zoom)));
                    this.ctx.font = `${infoFontSize}px Courier New`;
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    this.ctx.fillText(`[${sub.type}]`, x + markerSize + 6, y + 6);
                }
            }

            // Country flag only at very high zoom
            if (this.zoom > 3.5 && sub.flag) {
                const flagSize = Math.max(10, 12 * Math.sqrt(this.zoom));
                this.ctx.font = `${flagSize}px sans-serif`;
                this.ctx.fillText(sub.flag, x - markerSize - 14, y + 4);
            }
        });

        this.ctx.textAlign = 'left';
    }

    /**
     * Draw submarine trail - subtle dashed underwater style
     */
    drawSubmarineTrail(trail, sub, countryColors) {
        if (trail.length < 2) return;

        const colors = countryColors[sub.country] || { fill: '80, 120, 160', stroke: '100, 150, 190' };

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.setLineDash([4, 3]); // Subtle dash

        for (let i = 1; i < trail.length; i++) {
            const prev = trail[i - 1];
            const curr = trail[i];

            const prevPos = this.toCanvas(prev.lat, prev.lon);
            const currPos = this.toCanvas(curr.lat, curr.lon);

            // Skip if segment is off screen
            if (prevPos.x < -100 && currPos.x < -100) continue;
            if (prevPos.x > this.canvas.width + 100 && currPos.x > this.canvas.width + 100) continue;
            if (prevPos.y < -100 && currPos.y < -100) continue;
            if (prevPos.y > this.canvas.height + 100 && currPos.y > this.canvas.height + 100) continue;

            // Subtle fade
            const progress = i / trail.length;
            const opacity = 0.1 + progress * 0.25;

            this.ctx.strokeStyle = `rgba(${colors.stroke}, ${opacity})`;
            this.ctx.lineWidth = 1 + progress * 0.5;

            this.ctx.beginPath();
            this.ctx.moveTo(prevPos.x, prevPos.y);
            this.ctx.lineTo(currPos.x, currPos.y);
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]); // Reset dash
    }

    /**
     * Draw submarine with trail (legacy - kept for compatibility)
     */
    drawSubmarineWithTrail(sub, trail) {
        const {x, y} = this.toCanvas(sub.lat, sub.lon);

        // Draw underwater trail
        if (trail && trail.length > 1) {
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            for (let i = 1; i < trail.length; i++) {
                const prev = trail[i - 1];
                const curr = trail[i];

                const prevPos = this.toCanvas(prev.lat, prev.lon);
                const currPos = this.toCanvas(curr.lat, curr.lon);

                const progress = i / trail.length;
                const opacity = progress * 0.4;

                this.ctx.strokeStyle = `rgba(0, 200, 255, ${opacity})`;
                this.ctx.lineWidth = 1 + progress;
                this.ctx.setLineDash([4, 4]); // Dashed for underwater

                this.ctx.beginPath();
                this.ctx.moveTo(prevPos.x, prevPos.y);
                this.ctx.lineTo(currPos.x, currPos.y);
                this.ctx.stroke();
            }
            this.ctx.setLineDash([]);
        }

        // Only draw if on screen
        if (x < -50 || x > this.canvas.width + 50 || y < -50 || y > this.canvas.height + 50) {
            return;
        }

        // Rest of submarine drawing is handled elsewhere
    }

    /**
     * Draw convoy with trail - neon style for OLED
     */
    drawConvoyWithTrail(convoy, trail) {
        const {x, y} = this.toCanvas(convoy.lat, convoy.lon);

        // Draw ground trail - electric orange
        if (trail && trail.length > 1) {
            this.ctx.lineCap = 'round';

            for (let i = 1; i < trail.length; i++) {
                const prev = trail[i - 1];
                const curr = trail[i];

                const prevPos = this.toCanvas(prev.lat, prev.lon);
                const currPos = this.toCanvas(curr.lat, curr.lon);

                const progress = i / trail.length;
                const opacity = progress * 0.7;

                this.ctx.strokeStyle = `rgba(255, 165, 0, ${opacity})`; // Electric orange
                this.ctx.lineWidth = 2 + progress * 2;

                this.ctx.beginPath();
                this.ctx.moveTo(prevPos.x, prevPos.y);
                this.ctx.lineTo(currPos.x, currPos.y);
                this.ctx.stroke();
            }
        }
    }
}

// Export for use in main application
window.GeoJSONMapRenderer = GeoJSONMapRenderer;
