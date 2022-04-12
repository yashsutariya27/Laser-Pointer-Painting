let CANVAS_HEIGHT;
let CANVAS_WIDTH;
const STROKE_WIDTH = 20
let strokesMap = {};

const varyBrightness = 5;
const varyColour = sourceColour => {
	const amount = Math.round(Math.random() * 2 * varyBrightness);
	return sourceColour.map(color => amount > varyBrightness ? color * amount : color / amount)
};

const makeBrush = (size, colour) => {
	const brush = [];
	let bristleCount = Math.round(size / 3);
	const gap = STROKE_WIDTH / bristleCount;
	for (let i = 0; i < bristleCount; i++) {
		const distance =
			i === 0 ? 0 : gap * i + (Math.random() * gap) / 2 - gap / 2;
		brush.push({
			distance,
			thickness: Math.random() * 2 + 2,
			colour: varyColour(colour)
		});
	}
	return brush;
};

const angleDiff = (angleA, angleB) => {
	const twoPi = Math.PI * 2;
	const diff =
		((angleA - (angleB > 0 ? angleB : angleB + twoPi) + Math.PI) % twoPi) -
		Math.PI;
	return diff < -Math.PI ? diff + twoPi : diff;
};

const getBearing = (origin, destination) =>
	(Math.atan2(destination[1] - origin[1], destination[0] - origin[0]) -
		Math.PI / 2) %
	(Math.PI * 2);

const getNewAngle = (origin, destination) => {
	if (!origin) {
		return 0;
	}
	const bearing = getBearing(origin, destination);
	return origin[2] - angleDiff(origin[2], bearing);
};

const rotatePoint = (distance, angle, origin) => [
	origin[0] + distance * Math.cos(angle),
	origin[1] + distance * Math.sin(angle)
];

const randomColor = () => Math.round(255 * Math.random());

/// Actions
const createBrushBristles = (bristles, coord, origin) => {
	const oldAngle = origin[2];
	const newAngle = getNewAngle(origin, coord)
	return bristles.map(bristle => {
		let bristleOrigin = rotatePoint(
			bristle.distance - STROKE_WIDTH / 2,
			oldAngle,
			origin
		);

		let bristleDestination = rotatePoint(
			bristle.distance - STROKE_WIDTH / 2,
			newAngle,
			coord
		);

		const controlPoint = rotatePoint(
			bristle.distance - STROKE_WIDTH / 2,
			newAngle,
			origin
		);

		return [bristleOrigin, bristleDestination, controlPoint];
	});
};

const addBlobs = ({ blobs }) => {
	for (const { creationFrameCount, id, h, w, x, y } of blobs) {
		const uid = `${id}_${creationFrameCount}`;
		let history = strokesMap[uid];

		const centreX = (x + (w / 2)) * CANVAS_WIDTH;
		const centreY = (y + (h / 2)) * CANVAS_HEIGHT;

		if (!history) {
			const color = [randomColor(), randomColor(), randomColor()];

			strokesMap[uid] = {
				brush: makeBrush(3, color, STROKE_WIDTH),
				bristles: [],
				color,
				coords: [],
				creationFrameCount,
				initialCoord: [centreX, centreY, 0],
				uid,
			};

			continue;
		}

		const previousCoord = history.coords.length > 0 ? history.coords.at(-1) : history.initialCoord;

		const coord = [
			centreX,
			centreY,
			getNewAngle(previousCoord, [centreX, centreY]),
		]
		const bristleCoords = createBrushBristles(history.brush, coord, previousCoord)
		strokesMap[uid] = {
			...history,
			coords: [
				...history.coords,
				coord
			],
			bristles: [
				...history.bristles,
				bristleCoords
			]
		}
	}

	self.postMessage(Object.values(strokesMap));
}

const setup = ({ HEIGHT, WIDTH }) => {
	CANVAS_HEIGHT = HEIGHT;
	CANVAS_WIDTH = WIDTH;
}

self.onmessage = ({ data: { action, ...rest } }) => {
	if (action === 'addBlobs') {
		addBlobs(rest)
	}
	if (action === 'setup') {
		setup(rest)
	}
}