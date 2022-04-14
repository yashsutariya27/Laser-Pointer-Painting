const LOWEST_MASS = 0.0000001;
const HIGHEST_MASS = 0.2;
const LOWEST_AREA = 0.0000001;
const HIGHEST_AREA = 0.1;

const CAMERA_RES = 1920 / 1080;

const WIDTH = window.innerWidth;
const HEIGHT = window.innerWidth / CAMERA_RES;
const LIFESPAN = 100;

const activeStrokes = {};
let saveWorker;


var socket = io.connect('http://10.112.10.93:3000');

let currentId = null;
socket.on('reload', id => {
	if (currentId && currentId !== id) {
		window.location.reload()
		return;
	}
	currentId = id;
});

function setup() {
	setupCanvas();
	setupSaveWorker();
	window.setTimeout(() => {
		setupCamera().then(() => {
			setupTracking();
		})
	}, 3000);
}

const setupCanvas = () => {
	createCanvas(WIDTH, HEIGHT);
}

const setupCamera = () => new Promise(resolve => {
	capture = createCapture(VIDEO, () => {
		capture.size(640, 340);
		capture.hide();
		resolve();
	});
});

const setupSaveWorker = () => {
	saveWorker = new Worker('/saveWorker.js');
}

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

const drawStrokes = strokes => {
	for (const { chalkCoords, color, coords, lastSeenFrame, uid } of strokes) {
		const alpha = lastSeenFrame === frameCount ? 255 : 255 * (1 - ((frameCount - lastSeenFrame) / LIFESPAN));
		if (alpha <= 0) {
			saveWorker.postMessage(JSON.stringify(activeStrokes[uid]))
			delete (activeStrokes[uid]);
			continue;
		}

		stroke(color[0], color[1], color[2], alpha);
		noFill();
		strokeWeight(5);
		strokeCap(ROUND);

		beginShape();
		for (var i = 1; i < coords.length - 1; i++) {
			vertex(coords[i].x, coords[i].y)
		}
		endShape();
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

		const activeStroke = activeStrokes[uid] ?? { chalkCoords: [], creationFrameCount, coords: [], uid, color: [randomColor(), randomColor(), randomColor()] };

		activeStrokes[uid] = {
			...activeStroke,
			coords: [...activeStroke.coords, { x: centreX, y: centreY }],
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
