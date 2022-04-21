const LOWEST_MASS = 0.0000001;
const HIGHEST_MASS = 0.2;
const LOWEST_AREA = 0.0000001;
const HIGHEST_AREA = 0.1;

const CAMERA_RES = 1920 / 1080;

const WIDTH = window.innerWidth;
const HEIGHT = window.innerWidth / CAMERA_RES;
const LIFESPAN = 50;

const activeStrokes = {};

//var socket = io.connect('http://10.112.10.93:3000');
var socket = io.connect('http://localhost:3000');

let currentId = null;
socket.on('reload', id => {
	if (currentId && currentId !== id) {
		window.location.reload()
		return;
	}
	currentId = id;
});

let ctx
async function setup() {
	const canvas = setupCanvas();

	caveHand = await new Promise((resolve) => loadImage('caveHand.png', resolve));
	softBrush = await new Promise((resolve) => loadImage('softBrush.png', resolve));

	brushSize = windowHeight / 9;
	cursors = Object.fromEntries(earthTone.map(({ color: name, hex }) => {
		cursor = createGraphics(brushSize, brushSize)
		cursor.tint(color(hex));
		cursor.image(softBrush, 0, 0, brushSize, brushSize)
		cursor.image(caveHand, 0, 0, brushSize, brushSize)
		return [name, cursor];
	}));

	colorMode(HSB);
	angleMode(DEGREES)

	window.setTimeout(() => {
		setupCamera().then(() => {
			setupTracking();
		})
	}, 3000);
}

const setupCanvas = () => {
	const canvas = createCanvas(WIDTH, HEIGHT);
	return canvas;
}

const setupCamera = () => new Promise(resolve => {
	capture = createCapture(VIDEO, () => {
		capture.size(640, 340);
		capture.hide();
		resolve();
	});
});

const setupTracking = () => {
	myVida = new Vida(this);
	myVida.progressiveBackgroundFlag = false;
	myVida.imageFilterThreshold = 0.1;
	myVida.handleBlobsFlag = true;
	myVida.trackBlobsFlag = true;
	myVida.approximateBlobPolygonsFlag = false;
	myVida.pointsPerApproximatedBlobPolygon = 1;

	myVida.normMinBlobMass = LOWEST_MASS;
	myVida.normMaxBlobMass = HIGHEST_MASS;
	myVida.normMinBlobArea = LOWEST_AREA;
	myVida.normMaxBlobArea = HIGHEST_AREA;

	myVida.setBackgroundImage(capture);
	frameRate(60);
}

const randomColor = () => Math.round(255 * Math.random());

// FROM SKETCH

const earthTone = [
	{ hex: '#9B8F77', hsb: '40, 23%, 61%', color: 'gobi' },
	{ hex: '#9F8B84', hsb: '16, 17%, 62%', color: 'mocha' },
	{ hex: '#CCBDB6', hsb: '19, 11%, 80%', color: 'dusk' },
	{ hex: '#CBC2BB', hsb: '26, 8%, 80%', color: 'limestone' },
	{ hex: '#CCC4B7', hsb: '37, 10%, 80%', color: 'dolomite' },
	{ hex: '#919596', hsb: '192, 3%, 59%', color: 'shale' },
	{ hex: '#ACAFB6', hsb: '222, 5%, 71%', color: 'graphite' }
]

// Works for inverted canvas coordinate system
const getAngle = (originX, originY, targetX, targetY) => {
	var dx = originX - targetX;
	var dy = originY - targetY;
	var theta = Math.atan2(-dy, -dx); // [0, Ⲡ] then [-Ⲡ, 0]; clockwise; 0° = east
	theta *= 180 / Math.PI;           // [0, 180] then [-180, 0]; clockwise; 0° = east
	if (theta < 0) theta += 360;      // [0, 360]; clockwise; 0° = east

	return theta;
}

const drawStrokes = strokes => {
	for (const { creationFrameCount, color: tintColor, coords, lastSeenFrame, uid } of strokes) {
		const alpha = lastSeenFrame === frameCount ? 1 : 1 * (1 - ((frameCount - lastSeenFrame) / LIFESPAN));
		if (alpha <= 0) {
			if (lastSeenFrame - creationFrameCount > 6 && coords.length > 2) {
				socket.emit('commitShape', activeStrokes[uid], WIDTH, HEIGHT);
			}
			delete (activeStrokes[uid]);
			console.log('delete', uid, activeStrokes)
			continue;
		}

		for (var i = 1; i < coords.length; i++) {
			push()
			translate(coords[i].x, coords[i].y);
			imageMode(CENTER);
			if (i === coords.length - 1) {
				rotate(coords[i].angle)
			} else {
				rotate(coords[i].angle)
			}
			image(cursors[tintColor], 0, 0, brushSize, brushSize)
			pop()
		}
	}
}

const updateActiveStrokes = blobs => {
	for (const { creationFrameCount, id, normRectH: h, normRectW: w, normRectX: x, normRectY: y } of blobs) {
		const uid = `${id}_${creationFrameCount}`;

		const halfWidth = WIDTH / 2;
		const rawX = (x + (w / 2)) * WIDTH;

		const distanceFromCentre = rawX - halfWidth;
		const adjustedDistanceFromCentre = distanceFromCentre > 0 ? distanceFromCentre * 0.66666666666 : distanceFromCentre / 1.3333333333
		const centreX = halfWidth + adjustedDistanceFromCentre;
		const centreY = (y + (h / 2)) * HEIGHT;

		const activeStroke = activeStrokes[uid] ?? { chalkCoords: [], creationFrameCount, coords: [], uid, color: earthTone[Math.round((earthTone.length - 1) * Math.random())].color };

		activeStrokes[uid] = {
			...activeStroke,
			coords: [...activeStroke.coords, {
				x: centreX,
				y: centreY,
				angle: activeStroke.coords.length > 0 ? getAngle(centreX, centreY, activeStroke.coords.at(-1).x, activeStroke.coords.at(-1).y) : 0,
			}],
			lastSeenFrame: frameCount
		}
	}
	socket.emit('debug', blobs.map(({ creationFrameCount, id, normMass, normRectW, normRectH }) => ({ mass: normMass, area: (normRectW * normRectH), uid: `${id}_${creationFrameCount}` })))
}

function draw() {
	if (typeof myVida === 'undefined') {
		return;
	}

	myVida.update(capture);
	background(0, 0, 0)

	const blobs = myVida.getBlobs()
	updateActiveStrokes(blobs);
	drawStrokes(Object.values(activeStrokes));
}
