const CAMERA_RES = 1920 / 1080;

const WIDTH = window.innerWidth;
const HEIGHT = window.innerWidth / CAMERA_RES;
const LIFESPAN = 250;

function setup() {
	setupCanvas();

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


const activeStrokes = {};

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

const drawStrokes = strokes => {
	for (const { creationFrameCount, coords } of strokes) {
		const [{ x: originX, y: originY }, ...points] = coords;
		const alpha = 255 * (1 - ((frameCount - creationFrameCount) / LIFESPAN));
		stroke(255, 0, 0, alpha);
		noFill();
		strokeWeight(5);

		beginShape();
		vertex(originX, originY);

		for (var i = 0; i < points.length - 1; i++) {
			var x_mid = (points[i].x + points[i + 1].x) / 2;
			var y_mid = (points[i].y + points[i + 1].y) / 2;
			var cp_x1 = (x_mid + points[i].x) / 2;
			var cp_x2 = (x_mid + points[i + 1].x) / 2;
			quadraticVertex(cp_x1, points[i].y, x_mid, y_mid);
			quadraticVertex(cp_x2, points[i + 1].y, points[i + 1].x, points[i + 1].y);
		}
		endShape();
	}
}

const updateActiveStrokes = blobs => {
	for (const { creationFrameCount, id, normRectH: h, normRectW: w, normRectX: x, normRectY: y } of blobs) {
		const uid = `${id}_${creationFrameCount}`;
		const centreX = (x + (w / 2)) * WIDTH;
		const centreY = (y + (h / 2)) * HEIGHT;

		const activeStroke = activeStrokes[uid] ?? { creationFrameCount, coords: [], uid };

		activeStrokes[uid] = {
			...activeStroke,
			coords: [...activeStroke.coords, { x: centreX, y: centreY }]
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