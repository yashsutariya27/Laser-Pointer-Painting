import express from 'express';
import http from 'http';
import { Server } from "socket.io";
import { URL } from 'url'; // in Browser, the URL in native accessible on window
import { Buffer } from 'buffer';
import { writeFileSync } from 'fs';

const __dirname = new URL('.', import.meta.url).pathname;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/src'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html',);
});


server.listen(3000, () => {
	console.log('listening on *:3000');
	server.emit('reload')
});

let id = Math.random();
io.on('connection', function (client) {
	io.emit('reload', id)

	client.on('capture', uri => {
		const data = uri.replace(/^data:image\/\w+;base64,/, "");
		writeFileSync('capture.jpg', new Buffer(data, 'base64'));
	});
});
