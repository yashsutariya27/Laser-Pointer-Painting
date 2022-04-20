require('dotenv').config()
const { join } = require('path');
const { Server } = require("socket.io");
const http = require('http');
const express = require('express')
const { createClient } = require('@supabase/supabase-js');

const app = express()

const server = http.createServer(app);
const io = new Server(server);

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_ANON_KEY,
);

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
	socket.on('commitShape', async ({ color, creationFrameCount, lastSeenFrame, coords }, width, height) => {
		const { data, error } = await supabase
			.from('shapes')
			.insert(
				[
					{
						color,
						start: creationFrameCount,
						end: lastSeenFrame,
						coords: JSON.stringify(coords.map(({ x, y }) => ({ x: x / width, y: y / height }))),
					}
				]
			);
		console.log(error ?? data);
	});
});
