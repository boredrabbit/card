/**
 * Simplified World Map - Military Grade Wireframe
 * Uses simplified coordinate data for reliable rendering
 */

const WORLD_MAP_SIMPLIFIED = {
    // North America
    northAmerica: [
        [71,-168], [70,-141], [60,-141], [58,-137], [54,-130], [52,-128],
        [49,-123], [48,-124], [42,-124], [32,-117], [32,-115], [25,-97],
        [29,-95], [30,-88], [25,-80], [20,-75], [25,-80], [28,-82],
        [30,-87], [41,-73], [45,-74], [47,-67], [51,-55], [58,-64],
        [60,-65], [69,-68], [73,-68], [74,-95], [82,-70], [71,-168]
    ],

    // South America
    southAmerica: [
        [12,-72], [10,-73], [8,-79], [0,-78], [-5,-81], [-10,-78],
        [-18,-70], [-20,-70], [-34,-71], [-41,-73], [-45,-67],
        [-52,-69], [-55,-68], [-55,-67], [-50,-73], [-46,-75],
        [-33,-71], [-23,-70], [-18,-65], [-12,-77], [-8,-79],
        [-4,-81], [1,-80], [5,-77], [10,-75], [12,-72]
    ],

    // Europe
    europe: [
        [71,-10], [71,25], [70,28], [69,33], [60,31], [55,38],
        [60,49], [64,59], [69,60], [70,88], [70,105], [77,104],
        [73,142], [70,179], [66,180], [60,143], [55,73],
        [50,60], [48,48], [44,41], [43,29], [37,23], [36,-6],
        [43,-9], [51,3], [60,5], [71,-10]
    ],

    // Africa
    africa: [
        [37,-17], [37,10], [32,22], [31,32], [22,33], [15,43],
        [11,51], [4,43], [-6,39], [-11,40], [-17,26], [-26,28],
        [-29,32], [-33,29], [-34,18], [-28,15], [-22,25], [-18,12],
        [-12,18], [-4,10], [10,-3], [15,-12], [19,-12], [32,-17], [37,-17]
    ],

    // Middle East
    middleEast: [
        [37,26], [42,48], [40,53], [36,44], [29,48], [29,35], [37,26]
    ],

    // Asia
    asia: [
        [70,40], [70,80], [73,105], [77,110], [75,135], [70,140],
        [60,145], [53,142], [50,127], [42,131], [35,104], [23,88],
        [8,103], [1,104], [-10,110], [-11,120], [20,121], [25,114],
        [38,122], [43,131], [50,127], [53,142], [60,145], [70,140],
        [75,135], [77,110], [73,105], [70,80], [70,40]
    ],

    // Australia
    australia: [
        [-10,113], [-12,130], [-17,136], [-19,139], [-26,145],
        [-33,138], [-35,140], [-38,149], [-37,153], [-34,153],
        [-28,153], [-24,154], [-17,147], [-12,145], [-10,143],
        [-12,137], [-10,130], [-10,113]
    ],

    // Greenland
    greenland: [
        [83,-35], [83,-10], [77,-17], [70,-22], [70,-50], [76,-68], [80,-50], [83,-35]
    ],

    // Japan
    japan: [
        [45,142], [43,144], [41,140], [35,139], [33,130], [35,135], [40,141], [45,142]
    ],

    // British Isles
    britishIsles: [
        [59,-3], [57,-7], [50,-5], [50,2], [52,2], [55,0], [59,-3]
    ],

    // Scandinavia
    scandinavia: [
        [71,31], [70,28], [66,25], [60,25], [58,11], [63,10], [69,25], [71,31]
    ],

    // New Zealand
    newZealand: [
        [-34,173], [-41,174], [-47,168], [-41,166], [-35,168], [-34,173]
    ],

    // Madagascar
    madagascar: [
        [-12,49], [-14,51], [-25,47], [-25,44], [-12,44], [-12,49]
    ],

    // Iceland
    iceland: [
        [66,-24], [66,-13], [63,-13], [63,-24], [66,-24]
    ]
};

function drawSimplifiedWorldMap(canvas, ctx) {
    const toCanvas = (lat, lon) => ({
        x: canvas.width * ((lon + 180) / 360),
        y: canvas.height * ((90 - lat) / 180)
    });

    // Set styles for military wireframe
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.35)';
    ctx.fillStyle = 'rgba(0, 255, 65, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Draw each continent/region
    Object.values(WORLD_MAP_SIMPLIFIED).forEach(region => {
        ctx.beginPath();
        region.forEach((coord, i) => {
            const [lat, lon] = coord;
            const {x, y} = toCanvas(lat, lon);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });
}

function drawShippingLanes(canvas, ctx) {
    const toCanvas = (lat, lon) => ({
        x: canvas.width * ((lon + 180) / 360),
        y: canvas.height * ((90 - lat) / 180)
    });

    ctx.strokeStyle = 'rgba(0, 150, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);

    const routes = [
        // Suez Canal route
        [[30,32], [12,43], [36,-6], [43,-9], [50,5]],
        // Strait of Malacca
        [[1,104], [8,103], [20,121], [35,104]],
        // Transatlantic
        [[40,-74], [50,-30], [51,-6]],
        // Transpacific (US to Asia)
        [[37,-122], [20,-140], [20,140], [35,130]],
        // Venezuela to China (dark fleet route)
        [[10.5,-64], [5,-35], [-10,-25], [-20,17], [1,104], [22,114]]
    ];

    routes.forEach(route => {
        ctx.beginPath();
        route.forEach((coord, i) => {
            const [lat, lon] = coord;
            const {x, y} = toCanvas(lat, lon);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    });

    // Draw circles for critical chokepoints
    const chokepoints = [
        [26.5, 56.25, 'Hormuz'],  // Strait of Hormuz
        [9, -79.5, 'Panama'],      // Panama Canal
    ];

    chokepoints.forEach(([lat, lon, name]) => {
        const {x, y} = toCanvas(lat, lon);
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.stroke();
    });

    ctx.setLineDash([]);
}

function drawMapLabels(canvas, ctx) {
    const toCanvas = (lat, lon) => ({
        x: canvas.width * ((lon + 180) / 360),
        y: canvas.height * ((90 - lat) / 180)
    });

    ctx.fillStyle = 'rgba(0, 255, 65, 0.6)';
    ctx.font = '9px Courier New';
    ctx.textAlign = 'center';

    const labels = [
        {text: 'STRAIT OF HORMUZ', lat: 26.5, lon: 56.25},
        {text: 'SUEZ CANAL', lat: 30, lon: 32},
        {text: 'STRAIT OF MALACCA', lat: 1.5, lon: 103},
        {text: 'PANAMA CANAL', lat: 9, lon: -79.5},
        {text: 'PERSIAN GULF', lat: 28, lon: 51}
    ];

    labels.forEach(label => {
        const {x, y} = toCanvas(label.lat, label.lon);
        ctx.fillText(label.text, x, y);
    });

    ctx.textAlign = 'left';
}

// Export functions
window.drawSimplifiedWorldMap = drawSimplifiedWorldMap;
window.drawShippingLanes = drawShippingLanes;
window.drawMapLabels = drawMapLabels;
