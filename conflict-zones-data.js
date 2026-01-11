/**
 * Conflict Zones and Cities Data for OSINT Monitor
 * Real-time tracking of active conflicts, occupied territories, and major cities
 */

class ConflictZonesData {
    constructor() {
        this.activeConflicts = [];
        this.potentialConflicts = [];
        this.majorCities = [];
        this.initializeData();
    }

    initializeData() {
        // Active conflict zones with current status
        this.activeConflicts = [
            {
                id: 'ukraine-2022',
                name: 'Ukraine War',
                country: 'Ukraine',
                status: 'active',
                severity: 'HIGH',
                startDate: '2022-02-24',
                description: 'Russian invasion of Ukraine',
                occupiedTerritories: [
                    {
                        region: 'Crimea',
                        coordinates: [
                            [45.5, 32.5], [45.5, 36.5], [44.4, 36.5], [44.4, 32.5], [45.5, 32.5]
                        ],
                        status: 'occupied',
                        since: '2014-03-18',
                        color: 'rgba(255, 20, 147, 0.25)', // Electric pink (occupied)
                        battleZones: [
                            {
                                name: 'Sevastopol',
                                center: [44.6, 33.5],
                                type: 'naval_base',
                                status: 'Russian-controlled',
                                strategic: true,
                                since: '2014-03-18',
                                importance: 'high',
                                activityLevel: 'active',
                                description: 'Major naval base - Black Sea Fleet HQ'
                            },
                            {
                                name: 'Simferopol',
                                center: [44.95, 34.1],
                                type: 'administrative',
                                status: 'Russian-controlled',
                                strategic: true,
                                since: '2014-03-18',
                                importance: 'high',
                                activityLevel: 'static',
                                description: 'Crimean capital - administrative center'
                            },
                            {
                                name: 'Kerch Bridge',
                                center: [45.3, 36.5],
                                type: 'infrastructure',
                                status: 'Damaged/Operational',
                                strategic: true,
                                since: '2018-05-15',
                                importance: 'high',
                                activityLevel: 'active',
                                description: 'Key supply route - attacked Oct 2022, Jul 2023'
                            },
                            {
                                name: 'Saky Air Base',
                                center: [45.1, 33.6],
                                type: 'military_airbase',
                                status: 'Russian-controlled',
                                strategic: true,
                                since: '2014-03-18',
                                importance: 'high',
                                activityLevel: 'active',
                                description: 'Major air base - explosions Aug 2022'
                            },
                            {
                                name: 'Belbek Air Base',
                                center: [44.69, 33.58],
                                type: 'military_airbase',
                                status: 'Russian-controlled',
                                strategic: true,
                                since: '2014-03-18',
                                importance: 'medium',
                                activityLevel: 'active',
                                description: 'Fighter base near Sevastopol'
                            },
                            {
                                name: 'Yevpatoria',
                                center: [45.2, 33.37],
                                type: 'port_city',
                                status: 'Russian-controlled',
                                since: '2014-03-18',
                                importance: 'medium',
                                activityLevel: 'static',
                                description: 'Western coastal city'
                            },
                            {
                                name: 'Feodosia',
                                center: [45.03, 35.38],
                                type: 'port_city',
                                status: 'Russian-controlled',
                                since: '2014-03-18',
                                importance: 'medium',
                                activityLevel: 'active',
                                description: 'Port city - naval logistics hub'
                            },
                            {
                                name: 'Dzhankoi',
                                center: [45.71, 34.39],
                                type: 'railway_hub',
                                status: 'Russian-controlled',
                                strategic: true,
                                since: '2014-03-18',
                                importance: 'medium',
                                activityLevel: 'active',
                                description: 'Key railway junction - supply route'
                            },
                            {
                                name: 'Kerch',
                                center: [45.35, 36.47],
                                type: 'port_city',
                                status: 'Russian-controlled',
                                since: '2014-03-18',
                                importance: 'medium',
                                activityLevel: 'static',
                                description: 'Eastern port city - ferry terminal'
                            }
                        ]
                    },
                    {
                        region: 'Donetsk Oblast (Eastern)',
                        coordinates: [
                            [48.5, 37.5], [48.5, 38.8], [47.0, 38.8], [47.0, 37.5], [48.5, 37.5]
                        ],
                        status: 'contested',
                        since: '2022-02-24',
                        color: 'rgba(255, 20, 147, 0.2)', // Electric pink (contested)
                        battleZones: [
                            // Active front - Bakhmut axis
                            {
                                name: 'Bakhmut',
                                center: [48.6, 38.0],
                                type: 'urban_warfare',
                                status: 'Russian-controlled',
                                intensity: 'extreme',
                                activityLevel: 'hot',
                                since: '2022-05-24',
                                controlChanged: '2023-05-20',
                                casualties: 'Very High',
                                duration: this.calculateDuration('2022-05-24'),
                                importance: 'high'
                            },
                            {
                                name: 'Chasiv Yar',
                                center: [48.61, 37.85],
                                type: 'urban_warfare',
                                status: 'Contested',
                                intensity: 'extreme',
                                activityLevel: 'hot',
                                since: '2024-01-15',
                                casualties: 'High',
                                duration: this.calculateDuration('2024-01-15'),
                                importance: 'high'
                            },
                            {
                                name: 'Klishchiivka',
                                center: [48.52, 37.96],
                                type: 'village',
                                status: 'Contested',
                                intensity: 'high',
                                activityLevel: 'active',
                                since: '2023-09-15',
                                duration: this.calculateDuration('2023-09-15'),
                                importance: 'medium'
                            },
                            {
                                name: 'Andriivka',
                                center: [48.48, 37.99],
                                type: 'village',
                                status: 'Ukrainian-controlled',
                                intensity: 'medium',
                                activityLevel: 'active',
                                since: '2023-09-15',
                                duration: this.calculateDuration('2023-09-15'),
                                importance: 'low'
                            },
                            // Avdiivka sector
                            {
                                name: 'Avdiivka',
                                center: [48.1, 37.7],
                                type: 'urban_warfare',
                                status: 'Russian-controlled',
                                intensity: 'high',
                                activityLevel: 'static',
                                since: '2022-02-24',
                                controlChanged: '2024-02-17',
                                casualties: 'High',
                                duration: this.calculateDuration('2022-02-24'),
                                importance: 'high'
                            },
                            {
                                name: 'Tonenke',
                                center: [48.18, 37.58],
                                type: 'village',
                                status: 'Contested',
                                intensity: 'high',
                                activityLevel: 'hot',
                                since: '2024-02-20',
                                duration: this.calculateDuration('2024-02-20'),
                                importance: 'medium'
                            },
                            {
                                name: 'Berdychi',
                                center: [48.15, 37.65],
                                type: 'village',
                                status: 'Russian-controlled',
                                intensity: 'medium',
                                activityLevel: 'active',
                                since: '2024-03-01',
                                controlChanged: '2024-03-08',
                                duration: this.calculateDuration('2024-03-01'),
                                importance: 'low'
                            },
                            {
                                name: 'Semenivka',
                                center: [48.2, 37.62],
                                type: 'village',
                                status: 'Contested',
                                intensity: 'high',
                                activityLevel: 'hot',
                                since: '2024-02-25',
                                duration: this.calculateDuration('2024-02-25'),
                                importance: 'medium'
                            },
                            // Pokrovsk direction
                            {
                                name: 'Pokrovsk',
                                center: [48.28, 37.18],
                                type: 'urban_center',
                                status: 'Ukrainian-controlled',
                                intensity: 'medium',
                                activityLevel: 'active',
                                since: '2024-06-01',
                                strategic: true,
                                duration: this.calculateDuration('2024-06-01'),
                                importance: 'high'
                            },
                            {
                                name: 'Selydove',
                                center: [48.15, 37.3],
                                type: 'urban_warfare',
                                status: 'Contested',
                                intensity: 'high',
                                activityLevel: 'hot',
                                since: '2024-08-01',
                                duration: this.calculateDuration('2024-08-01'),
                                importance: 'high'
                            },
                            // Rear areas
                            {
                                name: 'Donetsk City',
                                center: [48.0, 37.8],
                                type: 'urban_center',
                                status: 'Russian-controlled',
                                intensity: 'medium',
                                activityLevel: 'static',
                                since: '2014-05-11',
                                casualties: 'Very High',
                                duration: this.calculateDuration('2014-05-11'),
                                importance: 'medium'
                            },
                            {
                                name: 'Mariupol',
                                center: [47.1, 37.5],
                                type: 'urban_warfare',
                                status: 'Russian-controlled',
                                intensity: 'low',
                                activityLevel: 'static',
                                since: '2022-05-20',
                                casualties: 'Catastrophic',
                                duration: this.calculateDuration('2022-02-24'),
                                importance: 'medium'
                            },
                            // Vuhledar sector
                            {
                                name: 'Vuhledar',
                                center: [47.78, 37.25],
                                type: 'urban_warfare',
                                status: 'Russian-controlled',
                                intensity: 'high',
                                activityLevel: 'active',
                                since: '2022-11-01',
                                controlChanged: '2024-10-01',
                                duration: this.calculateDuration('2022-11-01'),
                                importance: 'high'
                            },
                            {
                                name: 'Velyka Novosilka',
                                center: [47.85, 36.82],
                                type: 'urban_center',
                                status: 'Ukrainian-controlled',
                                intensity: 'medium',
                                activityLevel: 'active',
                                since: '2023-06-01',
                                duration: this.calculateDuration('2023-06-01'),
                                importance: 'medium'
                            }
                        ]
                    },
                    {
                        region: 'Luhansk Oblast',
                        coordinates: [
                            [49.5, 38.2], [49.5, 40.2], [48.0, 40.2], [48.0, 38.2], [49.5, 38.2]
                        ],
                        status: 'contested',
                        since: '2022-02-24',
                        color: 'rgba(255, 20, 147, 0.2)',
                        battleZones: [
                            {
                                name: 'Lysychansk',
                                center: [48.92, 38.44],
                                type: 'urban_warfare',
                                status: 'Russian-controlled',
                                intensity: 'low',
                                activityLevel: 'static',
                                since: '2022-07-03',
                                casualties: 'Very High',
                                duration: this.calculateDuration('2022-05-01'),
                                importance: 'medium'
                            },
                            {
                                name: 'Sievierodonetsk',
                                center: [48.95, 38.49],
                                type: 'urban_warfare',
                                status: 'Russian-controlled',
                                intensity: 'low',
                                activityLevel: 'static',
                                since: '2022-06-25',
                                casualties: 'Very High',
                                duration: this.calculateDuration('2022-05-01'),
                                importance: 'medium'
                            },
                            // Kreminna-Svatove axis (active front)
                            {
                                name: 'Kreminna',
                                center: [49.05, 38.22],
                                type: 'urban_warfare',
                                status: 'Contested',
                                intensity: 'high',
                                activityLevel: 'hot',
                                since: '2022-04-18',
                                casualties: 'High',
                                duration: this.calculateDuration('2022-04-18'),
                                importance: 'high'
                            },
                            {
                                name: 'Torske',
                                center: [49.0, 37.85],
                                type: 'village',
                                status: 'Ukrainian-controlled',
                                intensity: 'high',
                                activityLevel: 'hot',
                                since: '2022-10-15',
                                duration: this.calculateDuration('2022-10-15'),
                                importance: 'medium'
                            },
                            {
                                name: 'Dibrova',
                                center: [49.02, 38.0],
                                type: 'village',
                                status: 'Contested',
                                intensity: 'high',
                                activityLevel: 'active',
                                since: '2023-01-15',
                                duration: this.calculateDuration('2023-01-15'),
                                importance: 'low'
                            },
                            {
                                name: 'Svatove',
                                center: [49.41, 38.16],
                                type: 'urban_center',
                                status: 'Russian-controlled',
                                intensity: 'medium',
                                activityLevel: 'active',
                                since: '2022-02-26',
                                strategic: true,
                                duration: this.calculateDuration('2022-02-26'),
                                importance: 'high'
                            },
                            {
                                name: 'Kupiansk',
                                center: [49.71, 37.62],
                                type: 'urban_center',
                                status: 'Contested',
                                intensity: 'high',
                                activityLevel: 'hot',
                                since: '2024-01-01',
                                strategic: true,
                                duration: this.calculateDuration('2024-01-01'),
                                importance: 'high'
                            },
                            {
                                name: 'Synkivka',
                                center: [49.65, 37.55],
                                type: 'village',
                                status: 'Contested',
                                intensity: 'high',
                                activityLevel: 'hot',
                                since: '2023-10-01',
                                duration: this.calculateDuration('2023-10-01'),
                                importance: 'medium'
                            }
                        ]
                    },
                    {
                        region: 'Zaporizhzhia Oblast (Southern)',
                        coordinates: [
                            [47.5, 35.0], [47.5, 36.5], [46.5, 36.5], [46.5, 35.0], [47.5, 35.0]
                        ],
                        status: 'contested',
                        since: '2022-02-24',
                        color: 'rgba(255, 20, 147, 0.2)',
                        battleZones: [
                            {
                                name: 'Zaporizhzhia NPP',
                                center: [47.51, 34.58],
                                type: 'critical_infrastructure',
                                status: 'Russian-controlled',
                                intensity: 'medium',
                                activityLevel: 'static',
                                since: '2022-03-04',
                                strategic: true,
                                duration: this.calculateDuration('2022-03-04'),
                                importance: 'high'
                            },
                            {
                                name: 'Enerhodar',
                                center: [47.5, 34.65],
                                type: 'urban_center',
                                status: 'Russian-controlled',
                                intensity: 'low',
                                activityLevel: 'static',
                                since: '2022-03-04',
                                duration: this.calculateDuration('2022-03-04'),
                                importance: 'medium'
                            },
                            // Robotyne salient (2023 counteroffensive area)
                            {
                                name: 'Robotyne',
                                center: [47.46, 35.83],
                                type: 'village',
                                status: 'Contested',
                                intensity: 'high',
                                activityLevel: 'active',
                                since: '2023-08-28',
                                casualties: 'High',
                                duration: this.calculateDuration('2023-06-04'),
                                importance: 'high'
                            },
                            {
                                name: 'Verbove',
                                center: [47.42, 35.88],
                                type: 'village',
                                status: 'Contested',
                                intensity: 'high',
                                activityLevel: 'active',
                                since: '2023-09-15',
                                duration: this.calculateDuration('2023-09-15'),
                                importance: 'medium'
                            },
                            {
                                name: 'Novoprokopivka',
                                center: [47.48, 35.78],
                                type: 'village',
                                status: 'Contested',
                                intensity: 'medium',
                                activityLevel: 'active',
                                since: '2023-09-01',
                                duration: this.calculateDuration('2023-09-01'),
                                importance: 'low'
                            },
                            {
                                name: 'Tokmak',
                                center: [47.25, 35.7],
                                type: 'urban_center',
                                status: 'Russian-controlled',
                                intensity: 'low',
                                activityLevel: 'static',
                                since: '2022-02-28',
                                strategic: true,
                                duration: this.calculateDuration('2022-02-28'),
                                importance: 'high'
                            },
                            {
                                name: 'Melitopol',
                                center: [46.85, 35.37],
                                type: 'urban_center',
                                status: 'Russian-controlled',
                                intensity: 'low',
                                activityLevel: 'static',
                                since: '2022-02-26',
                                strategic: true,
                                duration: this.calculateDuration('2022-02-26'),
                                importance: 'high'
                            }
                        ]
                    },
                    {
                        region: 'Kherson Oblast (Eastern)',
                        coordinates: [
                            [47.0, 33.0], [47.0, 35.0], [46.0, 35.0], [46.0, 33.0], [47.0, 33.0]
                        ],
                        status: 'contested',
                        since: '2022-02-24',
                        color: 'rgba(255, 20, 147, 0.2)',
                        battleZones: [
                            {
                                name: 'Kherson City',
                                center: [46.64, 32.62],
                                type: 'urban_center',
                                status: 'Ukrainian-controlled',
                                intensity: 'medium',
                                activityLevel: 'active',
                                since: '2022-11-11',
                                liberated: true,
                                duration: this.calculateDuration('2022-03-02'),
                                importance: 'high'
                            },
                            // Dnipro River crossings (Krynky bridgehead area)
                            {
                                name: 'Krynky',
                                center: [46.73, 33.37],
                                type: 'village',
                                status: 'Contested',
                                intensity: 'extreme',
                                activityLevel: 'hot',
                                since: '2023-10-17',
                                casualties: 'Very High',
                                duration: this.calculateDuration('2023-10-17'),
                                importance: 'high'
                            },
                            {
                                name: 'Antonivka',
                                center: [46.68, 32.72],
                                type: 'village',
                                status: 'Ukrainian-controlled',
                                intensity: 'medium',
                                activityLevel: 'active',
                                since: '2022-11-11',
                                duration: this.calculateDuration('2022-11-11'),
                                importance: 'medium'
                            },
                            {
                                name: 'Oleshky',
                                center: [46.61, 32.77],
                                type: 'urban_center',
                                status: 'Russian-controlled',
                                intensity: 'medium',
                                activityLevel: 'active',
                                since: '2022-02-27',
                                duration: this.calculateDuration('2022-02-27'),
                                importance: 'medium'
                            },
                            {
                                name: 'Nova Kakhovka',
                                center: [46.75, 33.37],
                                type: 'urban_center',
                                status: 'Russian-controlled',
                                intensity: 'medium',
                                activityLevel: 'static',
                                since: '2022-02-25',
                                strategic: true,
                                duration: this.calculateDuration('2022-02-25'),
                                importance: 'high'
                            },
                            {
                                name: 'Dnipro River Line',
                                center: [46.7, 33.2],
                                type: 'crossing_point',
                                status: 'Contested',
                                intensity: 'high',
                                activityLevel: 'hot',
                                since: '2022-11-11',
                                strategic: true,
                                duration: this.calculateDuration('2022-11-11'),
                                importance: 'high'
                            }
                        ]
                    }
                ],
                frontlines: [
                    // Approximate frontline coordinates with direction indicators
                    {coords: [49.5, 37.8], direction: 'static'},
                    {coords: [48.8, 37.5], direction: 'russian_advance'},
                    {coords: [48.0, 37.2], direction: 'static'},
                    {coords: [47.5, 36.5], direction: 'static'},
                    {coords: [47.0, 35.5], direction: 'ukrainian_pressure'},
                    {coords: [46.8, 34.5], direction: 'static'}
                ],
                casualties: 'High',
                lastUpdate: new Date().toISOString()
            },
            {
                id: 'gaza-2023',
                name: 'Israel-Gaza Conflict',
                country: 'Gaza Strip',
                status: 'active',
                severity: 'HIGH',
                startDate: '2023-10-07',
                description: 'Israel-Hamas war',
                occupiedTerritories: [
                    {
                        region: 'Gaza Strip',
                        coordinates: [
                            [31.6, 34.2], [31.6, 34.6], [31.2, 34.6], [31.2, 34.2], [31.6, 34.2]
                        ],
                        status: 'conflict_zone',
                        since: '2023-10-07',
                        color: 'rgba(255, 69, 0, 0.4)' // Orange-red
                    },
                    {
                        region: 'West Bank',
                        coordinates: [
                            [32.5, 34.9], [32.5, 35.6], [31.3, 35.6], [31.3, 34.9], [32.5, 34.9]
                        ],
                        status: 'occupied',
                        since: '1967-06-05',
                        color: 'rgba(255, 140, 0, 0.3)' // Dark orange
                    }
                ],
                casualties: 'Very High',
                lastUpdate: new Date().toISOString()
            },
            {
                id: 'syria-civil-war',
                name: 'Syrian Civil War',
                country: 'Syria',
                status: 'active',
                severity: 'MEDIUM',
                startDate: '2011-03-15',
                description: 'Multi-faction civil war',
                occupiedTerritories: [
                    {
                        region: 'Northwestern Syria (Idlib)',
                        coordinates: [
                            [36.5, 36.0], [36.5, 37.0], [35.5, 37.0], [35.5, 36.0], [36.5, 36.0]
                        ],
                        status: 'opposition_controlled',
                        since: '2015-03-28',
                        color: 'rgba(255, 215, 0, 0.3)' // Gold
                    },
                    {
                        region: 'Northeastern Syria (SDF)',
                        coordinates: [
                            [37.0, 40.0], [37.0, 42.5], [35.5, 42.5], [35.5, 40.0], [37.0, 40.0]
                        ],
                        status: 'autonomous',
                        since: '2016-03-17',
                        color: 'rgba(255, 255, 0, 0.25)' // Yellow
                    }
                ],
                casualties: 'Very High',
                lastUpdate: new Date().toISOString()
            },
            {
                id: 'sudan-2023',
                name: 'Sudan Conflict',
                country: 'Sudan',
                status: 'active',
                severity: 'HIGH',
                startDate: '2023-04-15',
                description: 'SAF vs RSF conflict',
                occupiedTerritories: [
                    {
                        region: 'Khartoum',
                        coordinates: [
                            [16.0, 32.0], [16.0, 33.0], [15.0, 33.0], [15.0, 32.0], [16.0, 32.0]
                        ],
                        status: 'contested',
                        since: '2023-04-15',
                        color: 'rgba(255, 20, 147, 0.2)'
                    },
                    {
                        region: 'Darfur',
                        coordinates: [
                            [14.5, 22.0], [14.5, 27.0], [10.0, 27.0], [10.0, 22.0], [14.5, 22.0]
                        ],
                        status: 'contested',
                        since: '2023-04-15',
                        color: 'rgba(255, 20, 147, 0.2)'
                    }
                ],
                casualties: 'High',
                lastUpdate: new Date().toISOString()
            },
            {
                id: 'myanmar-civil-war',
                name: 'Myanmar Civil War',
                country: 'Myanmar',
                status: 'active',
                severity: 'MEDIUM',
                startDate: '2021-02-01',
                description: 'Military junta vs resistance forces',
                occupiedTerritories: [
                    {
                        region: 'Northwestern Myanmar',
                        coordinates: [
                            [25.0, 93.0], [25.0, 95.0], [20.0, 95.0], [20.0, 93.0], [25.0, 93.0]
                        ],
                        status: 'contested',
                        since: '2021-02-01',
                        color: 'rgba(255, 165, 0, 0.3)'
                    }
                ],
                casualties: 'High',
                lastUpdate: new Date().toISOString()
            }
        ];

        // Potential conflict zones (high tension areas)
        this.potentialConflicts = [
            {
                id: 'taiwan-strait',
                name: 'Taiwan Strait',
                region: 'East Asia',
                tensionLevel: 'VERY HIGH',
                description: 'China-Taiwan tensions',
                coordinates: [24.0, 120.5],
                radius: 200, // km
                color: 'rgba(255, 215, 0, 0.25)',
                indicators: [
                    'Increased military exercises',
                    'Naval deployments',
                    'Air space incursions'
                ]
            },
            {
                id: 'south-china-sea',
                name: 'South China Sea',
                region: 'Southeast Asia',
                tensionLevel: 'HIGH',
                description: 'Territorial disputes',
                coordinates: [12.0, 114.0],
                radius: 500,
                color: 'rgba(255, 255, 0, 0.2)',
                indicators: [
                    'Naval patrols',
                    'Island militarization',
                    'Freedom of navigation operations'
                ]
            },
            {
                id: 'kashmir',
                name: 'Kashmir',
                region: 'South Asia',
                tensionLevel: 'HIGH',
                description: 'India-Pakistan border tensions',
                coordinates: [34.0, 76.0],
                radius: 150,
                color: 'rgba(255, 215, 0, 0.25)',
                indicators: [
                    'Border skirmishes',
                    'Military buildup',
                    'Ceasefire violations'
                ]
            },
            {
                id: 'korean-dmz',
                name: 'Korean DMZ',
                region: 'East Asia',
                tensionLevel: 'MEDIUM',
                description: 'North-South Korea border',
                coordinates: [38.0, 127.5],
                radius: 100,
                color: 'rgba(255, 255, 0, 0.2)',
                indicators: [
                    'Ballistic missile tests',
                    'Military exercises',
                    'Propaganda campaigns'
                ]
            },
            {
                id: 'iran-israel',
                name: 'Iran-Israel Shadow War',
                region: 'Middle East',
                tensionLevel: 'HIGH',
                description: 'Proxy conflicts and cyber warfare',
                coordinates: [32.0, 35.0],
                radius: 300,
                color: 'rgba(255, 140, 0, 0.25)',
                indicators: [
                    'Proxy attacks',
                    'Cyber operations',
                    'Nuclear program tensions'
                ]
            }
        ];

        // Major world cities (shown when zoomed in)
        this.majorCities = [
            // Europe
            {name: 'Kyiv', country: 'Ukraine', lat: 50.45, lon: 30.52, population: 2884000, strategic: true},
            {name: 'Moscow', country: 'Russia', lat: 55.75, lon: 37.62, population: 12500000, strategic: true},
            {name: 'London', country: 'UK', lat: 51.51, lon: -0.13, population: 9000000, strategic: true},
            {name: 'Paris', country: 'France', lat: 48.85, lon: 2.35, population: 2161000, strategic: true},
            {name: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.40, population: 3645000, strategic: true},
            {name: 'Warsaw', country: 'Poland', lat: 52.23, lon: 21.01, population: 1790000, strategic: false},

            // Middle East
            {name: 'Tel Aviv', country: 'Israel', lat: 32.08, lon: 34.78, population: 451000, strategic: true},
            {name: 'Tehran', country: 'Iran', lat: 35.69, lon: 51.42, population: 8694000, strategic: true},
            {name: 'Baghdad', country: 'Iraq', lat: 33.31, lon: 44.36, population: 7000000, strategic: true},
            {name: 'Damascus', country: 'Syria', lat: 33.51, lon: 36.29, population: 1754000, strategic: true},
            {name: 'Riyadh', country: 'Saudi Arabia', lat: 24.71, lon: 46.67, population: 7000000, strategic: true},

            // Asia
            {name: 'Beijing', country: 'China', lat: 39.90, lon: 116.40, population: 21540000, strategic: true},
            {name: 'Shanghai', country: 'China', lat: 31.23, lon: 121.47, population: 24280000, strategic: true},
            {name: 'Tokyo', country: 'Japan', lat: 35.68, lon: 139.65, population: 13960000, strategic: true},
            {name: 'Seoul', country: 'South Korea', lat: 37.57, lon: 126.98, population: 9776000, strategic: true},
            {name: 'Pyongyang', country: 'North Korea', lat: 39.04, lon: 125.76, population: 3038000, strategic: true},
            {name: 'Taipei', country: 'Taiwan', lat: 25.03, lon: 121.57, population: 2646000, strategic: true},
            {name: 'Delhi', country: 'India', lat: 28.61, lon: 77.21, population: 32941000, strategic: true},
            {name: 'Mumbai', country: 'India', lat: 19.08, lon: 72.88, population: 20411000, strategic: false},

            // Americas
            {name: 'Washington DC', country: 'USA', lat: 38.91, lon: -77.04, population: 705749, strategic: true},
            {name: 'New York', country: 'USA', lat: 40.71, lon: -74.01, population: 8336000, strategic: true},
            {name: 'Los Angeles', country: 'USA', lat: 34.05, lon: -118.24, population: 3979000, strategic: false},
            {name: 'Caracas', country: 'Venezuela', lat: 10.49, lon: -66.88, population: 2935000, strategic: true},

            // Africa
            {name: 'Khartoum', country: 'Sudan', lat: 15.50, lon: 32.53, population: 5185000, strategic: true},
            {name: 'Cairo', country: 'Egypt', lat: 30.04, lon: 31.24, population: 20900000, strategic: true}
        ];
    }

    /**
     * Get conflict zones that should be visible at current zoom level
     */
    getVisibleConflicts(zoom) {
        // Always show active conflicts
        return this.activeConflicts;
    }

    /**
     * Get potential conflict zones
     */
    getPotentialConflicts() {
        return this.potentialConflicts;
    }

    /**
     * Get cities visible at current zoom level
     */
    getVisibleCities(zoom, bounds = null) {
        // Show strategic cities at zoom > 2.0
        // Show all major cities at zoom > 3.0
        if (zoom < 2.0) {
            return [];
        } else if (zoom < 3.0) {
            return this.majorCities.filter(city => city.strategic);
        } else {
            return this.majorCities;
        }
    }

    /**
     * Check if a point is inside a conflict zone
     */
    getConflictZoneAtPoint(lat, lon) {
        // Check active conflicts
        for (const conflict of this.activeConflicts) {
            if (conflict.occupiedTerritories) {
                for (const territory of conflict.occupiedTerritories) {
                    if (this.isPointInPolygon(lat, lon, territory.coordinates)) {
                        return {
                            type: 'active',
                            conflict: conflict,
                            territory: territory
                        };
                    }
                }
            }
        }

        // Check potential conflicts (radius-based)
        for (const potential of this.potentialConflicts) {
            const distance = this.haversineDistance(
                lat, lon,
                potential.coordinates[0], potential.coordinates[1]
            );
            if (distance <= potential.radius) {
                return {
                    type: 'potential',
                    conflict: potential,
                    distance: distance
                };
            }
        }

        return null;
    }

    /**
     * Ray casting algorithm for point-in-polygon
     */
    isPointInPolygon(lat, lon, coordinates) {
        let inside = false;
        for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
            const [lati, loni] = coordinates[i];
            const [latj, lonj] = coordinates[j];

            const intersect = ((loni > lon) !== (lonj > lon)) &&
                            (lat < (latj - lati) * (lon - loni) / (lonj - loni) + lati);

            if (intersect) inside = !inside;
        }
        return inside;
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    haversineDistance(lat1, lon1, lat2, lon2) {
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
     * Calculate duration from a start date to now
     */
    calculateDuration(startDateStr) {
        const start = new Date(startDateStr);
        const now = new Date();
        const diffMs = now - start;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
            return `${diffDays} days`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months > 1 ? 's' : ''}`;
        } else {
            const years = Math.floor(diffDays / 365);
            const remainingMonths = Math.floor((diffDays % 365) / 30);
            if (remainingMonths > 0) {
                return `${years}y ${remainingMonths}m`;
            }
            return `${years} year${years > 1 ? 's' : ''}`;
        }
    }

    /**
     * Get battle zones visible at current zoom level
     * Filters by importance at different zoom levels for visual hierarchy
     */
    getVisibleBattleZones(zoom, conflict) {
        // Minimum zoom threshold
        if (zoom < 2.5) return [];

        const battleZones = [];
        if (conflict.occupiedTerritories) {
            conflict.occupiedTerritories.forEach(territory => {
                if (territory.battleZones) {
                    territory.battleZones.forEach(zone => {
                        // Filter by importance at lower zoom levels
                        const importance = zone.importance || 'medium';

                        // Show high importance at zoom >= 2.5
                        // Show medium importance at zoom >= 3.5
                        // Show low importance at zoom >= 5.0
                        let shouldShow = false;
                        if (importance === 'high' && zoom >= 2.5) shouldShow = true;
                        if (importance === 'medium' && zoom >= 3.5) shouldShow = true;
                        if (importance === 'low' && zoom >= 5.0) shouldShow = true;

                        // Also show 'hot' activity zones regardless of importance at zoom >= 3.0
                        if (zone.activityLevel === 'hot' && zoom >= 3.0) shouldShow = true;

                        if (shouldShow) {
                            battleZones.push({
                                ...zone,
                                territoryRegion: territory.region,
                                territoryColor: territory.color
                            });
                        }
                    });
                }
            });
        }
        return battleZones;
    }
}

// Export for use in main application
window.ConflictZonesData = ConflictZonesData;
