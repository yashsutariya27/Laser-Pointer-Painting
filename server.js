const { join } = require('path');
const { Server } = require("socket.io");
const http = require('http');
const express = require('express')
const app = express()

const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
	res.sendFile(join(__dirname, '/index.html'));
})

app.get('/test', (req, res) => {
	res.sendFile(join(__dirname, '/test.html'));
})

app.get('/debug', (req, res) => {
	res.sendFile(join(__dirname, '/debug.html'));
})

app.use(express.static('.'))

server.listen(3000, () => {
	console.log('listening on *:3000');
	server.emit('reload')
});

let id = Math.random();
io.on('connection', function (socket) {
	io.emit('reload', id)
	socket.on('debug', (args) => {
		io.emit('debug', args)
	});
	socket.on('debugX', (args) => {
		io.emit('debugX', args)
	});
});
