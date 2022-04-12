const CAMERA_RES = 1920 / 1080;

const WIDTH = window.innerWidth;
const HEIGHT = window.innerWidth / CAMERA_RES;
const LIFESPAN = 250;

function setup() {
	setupCanvas();
	setupDrawingWorker();

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


let strokes = [];

let calculationWorker;
const setupDrawingWorker = () => {
	calculationWorker = new Worker('/strokesWorker.js');
	calculationWorker.postMessage({
		action: 'setup',
		HEIGHT,
		WIDTH,
	})
	calculationWorker.onmessage = ({ data: updatedStrokes }) => {
		strokes = updatedStrokes;
	}
}

const randomColor = () => Math.round(255 * Math.random());


const strokeBristle = ([ox, oy], [dx, dy], [cx, cy], bristle) => {
	noFill();
	strokeJoin(ROUND)
	strokeCap(ROUND);
	strokeWeight(bristle.thickness);
	beginShape();
	vertex(ox, oy);
	quadraticVertex(cx, cy, dx, dy);
	endShape();

	drawingContext.shadowBlur = bristle.thickness / 2;
	drawingContext.strokeStyle = bristle.colour;
	drawingContext.shadowColor = bristle.colour;

	return;

};

function draw() {
	if (typeof myVida === 'undefined') {
		return;
	}

	myVida.update(capture);
	background(0, 0, 0)

	const blobs = myVida.getBlobs()
	const simpleBlobs = blobs.map(({ creationFrameCount, id, normRectH: h, normRectW: w, normRectX: x, normRectY: y }) => ({ creationFrameCount, id, h, w, x, y }))
	calculationWorker.postMessage({ action: 'addBlobs', blobs: simpleBlobs });

	noFill()
	let iteration = 0;
	for (const { creationFrameCount, color: [r, g, b], coords, bristles, brush } of strokes) {
		beginShape();

		const alpha = 255 * (1 - ((frameCount - creationFrameCount) / LIFESPAN));

		if (alpha === 0) { }
		stroke(r, g, b, alpha);

		drawingContext.shadowColor = `rgb(${r}, ${g}, ${b})`;
		strokeCap(ROUND);

		for (var i = 0; i < bristles.length; i++) {
			for (var y = 0; y < bristles[i].length; y++) {
				const [bristleOrigin, bristleDestination, controlPoint] = bristles[i][y];
				strokeBristle(bristleOrigin, bristleDestination, controlPoint, brush[y]);
				iteration++
			}
		}
		endShape();
	}
}