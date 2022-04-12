let context = null;
let hasOpenStroke = false;

const handleSetup = (canvas) => {
	context = canvas.getContext('2d');
}

const rand = () => Math.round(Math.random() * 255);
const handleStroke = isDrawing => {
	hasOpenStroke = isDrawing;
	if (!isDrawing) {
		context.closePath();
		return;
	}
	context.beginPath();
	context.strokeStyle = `rgb(${rand()}, ${rand()}, ${rand()})`;
}

const handleDrawing = (x, y) => {
	if (!context) {
		return;
	}
	context.lineTo(x, y);
	context.stroke();
}

const handleMessageFromMain = ({ data }) => {
	if (data.x && hasOpenStroke) {
		handleDrawing(data.x, data.y)
		return;
	}
	if (data.isDrawing !== undefined) {
		handleStroke(data.isDrawing);
		return;
	}
	if (data.canvas) {
		handleSetup(data.canvas)
		return;
	}
};


self.onmessage = handleMessageFromMain