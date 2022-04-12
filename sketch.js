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

	setupCamera().then(() => {
		setupTracking();
	})
}

const setupCanvas = () => {
	createCanvas(WIDTH, HEIGHT);
}

const setupCamera = () => new Promise(resolve => {
	capture = createCapture(VIDEO, () => {
		capture.size(640, 480);
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
	myVida.imageFilterThreshold = 0.2;
	myVida.handleBlobsFlag = true;
	myVida.trackBlobsFlag = true;
	myVida.approximateBlobPolygonsFlag = false;
	myVida.pointsPerApproximatedBlobPolygon = 8;

	myVida.normMinBlobMass = 0.00000001;  // uncomment if needed
	myVida.normMinBlobArea = 0.00000001;  // uncomment if needed

	myVida.setBackgroundImage(capture);
	frameRate(30);
}

const randomColor = () => Math.round(255 * Math.random());

let brushDiameter = 5;
const drawChalk = (x, y, chalk) => {
	vertex(x, y)
	fill(0, 0, 0)
	chalk.map(([a, b, c, d]) => rect(a, b, c, d));
}

const drawStrokes = strokes => {
	for (const { chalkCoords, coords, lastSeenFrame, uid } of strokes) {
		const alpha = lastSeenFrame === frameCount ? 255 : 255 * (1 - ((frameCount - lastSeenFrame) / LIFESPAN));
		if (alpha <= 0) {
			saveWorker.postMessage(JSON.stringify(activeStrokes[uid]))
			delete (activeStrokes[uid]);
			continue;
		}

		stroke(255, 0, 0, alpha);
		noFill();
		strokeWeight(brushDiameter);
		strokeCap(ROUND);

		beginShape();
		for (var i = 1; i < coords.length - 1; i++) {
			drawChalk(coords[i].x, coords[i].y, chalkCoords[i])
		}
		endShape();
	}
}

const updateActiveStrokes = blobs => {
	for (const { creationFrameCount, id, normRectH: h, normRectW: w, normRectX: x, normRectY: y } of blobs) {
		const uid = `${id}_${creationFrameCount}`;
		const centreX = (x + (w / 2)) * WIDTH;
		const centreY = (y + (h / 2)) * HEIGHT;

		const activeStroke = activeStrokes[uid] ?? { chalkCoords: [], creationFrameCount, coords: [], uid };
		const { coords } = activeStroke;
		const chalk = [];
		const xLast = coords.length > 0 ? coords.at(-1) : centreX
		const yLast = coords.length > 0 ? coords.at(-1) : centreY

		// Chalk Effect
		var length = Math.round(Math.sqrt(Math.pow(centreX - xLast, 2) + Math.pow(centreY - yLast, 2)) / (5 / brushDiameter));
		var xUnit = (centreX - xLast) / length;
		var yUnit = (centreY - yLast) / length;
		for (var i = 0; i < length; i++) {
			var xCurrent = xLast + (i * xUnit);
			var yCurrent = yLast + (i * yUnit);
			var xRandom = xCurrent + (Math.random() - 0.5) * brushDiameter * 1.2;
			var yRandom = yCurrent + (Math.random() - 0.5) * brushDiameter * 1.2;
			chalk.push([xRandom, yRandom, Math.random() * 2 + 2, Math.random() + 1]);
		}

		activeStrokes[uid] = {
			...activeStroke,
			chalkCoords: [...activeStroke.chalkCoords, chalk],
			coords: [...activeStroke.coords, { x: centreX, y: centreY }],
			lastSeenFrame: frameCount
		}
	}
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