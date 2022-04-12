var socket = io.connect('http://localhost:3000');

let currentId = null;
socket.on('reload', id => {
	if (currentId && currentId !== id) {
		window.location.reload()
		return;
	}
	currentId = id;
});

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas.style.backgroundColor = 'black';

let drawingWorker = null;
const setupDrawingWorker = () => {
	drawingWorker = new Worker('/drawing.js');
	const offscreen = canvas.transferControlToOffscreen();
	drawingWorker.postMessage({ canvas: offscreen }, [offscreen]);

}

const setupCursorInput = () => {
	let isDrawing = false;
	window.addEventListener('click', () => {
		isDrawing = !isDrawing
		drawingWorker.postMessage({ isDrawing })
	})
	window.addEventListener('mousemove', ({ clientX, clientY }) => {
		drawingWorker.postMessage({
			x: clientX,
			y: clientY,
		})
	})
}

const setupInputWorker = () => {
	const worker = new Worker('/input.js');
	worker.onmessage = (x, y) => {
		drawingWorker.postMessage({ x, y })
	}
}

const setupCaptureInterval = () => {
	window.setInterval(() => {
		socket.emit('capture', canvas.toDataURL())
	}, 1000)
}

//setupInputWorker();
setupCursorInput();
setupDrawingWorker();
setupCaptureInterval();
