
const http = require('http');
const Socket = require('socket.io');
const { buildParser, withAuth } = require('../lib');
const fs = require('fs');
const path = require('path');
const DEFAULT_PORT = 9001;
const EXTENDED_PORT = 9002;
const schemas = require('./schemas.js')

const server = http.createServer((req, res) => {

    if (req.url == '/style.css') {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        return res.end(fs.readFileSync(path.join(__dirname, 'style.css')));
    }

    if (req.url == '/dist/client.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        return res.end(fs.readFileSync(path.join(__dirname, './dist/client.js')));
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));

});

const server2 = http.createServer();

const parser = buildParser(schemas);

const dio = Socket(server);

const eio = Socket(server2, {
    parser
});

ioServerHandler('[Default]', dio);
ioServerHandler('[Extended]', eio);

const stringBytes = (str) => Buffer.from(str).byteLength;

const simulePacket = content => `42["message",${JSON.stringify(content)}]`;

const computeLength = (title, packet, schema) => {

    let byteLength;
    if (title === '[Extended]') {
        byteLength = parser.schemas[schema].encode(packet).byteLength;
    }
    else {
        byteLength = stringBytes(simulePacket(packet))
    }

    return byteLength;

}

function ioServerHandler(title, io) {

    withAuth(io,
        { method: withAuth.CREDENTIAL },
        (userName, next) => {
            next(true, { userName })
        }
    );

    let messages = [];
    let miscData = [];

    io.on('connection', socket => {

        console.log(title, 'socket connected', socket.id);

        socket.on('entry', (_, ack) => {

            let msgByteLength = 0;
            let miscByteLength = 0;

            if (title === '[Extended]') {
                messages.map(message => {
                    msgByteLength += parser.schemas.sentMessage.encode(message).byteLength;
                });

                miscData.map(data => {
                    miscByteLength += parser.schemas.miscStruct.encode(data).byteLength;
                });

            } else {
                messages.map(message => {
                    let packet = simulePacket(message);
                    msgByteLength += stringBytes(packet)
                });

                miscData.map(data => {
                    let packet = simulePacket(data);
                    miscByteLength += stringBytes(packet)
                });

            }

            ack(messages, msgByteLength + miscByteLength);

            messages.push({
                author: socket.userName,
                content: 'get int.',
                ts: Math.round(Date.now() / 1000)
            });

            socket.broadcast.emit('entry', socket.userName);

        });

        socket.on("message", packet => {

            packet = { ...packet, author: socket.userName };

            messages.push(packet)
            socket.broadcast.emit('sentMessage', packet);
            socket.broadcast.emit('computeLength', computeLength( title, packet, 'sentMessage' ));

        });


        socket.on("miscStruct", packet => {

            miscData.push(packet);
            socket.broadcast.emit('computeLength', computeLength( title, packet, 'miscStruct' ));

        });

        socket.on('disconnect', () => {

            if (!socket.userName)
                return;

            let message = {
                author: socket.userName,
                content: 'left.',
                ts: Math.round(Date.now() / 1000)
            }

            messages.push(message);

            socket.broadcast.emit('leave', socket.userName);

        });

    });
}

server.listen(DEFAULT_PORT, 'localhost', () => {
    console.log(`Default io listening on ${DEFAULT_PORT}`);
});

server2.listen(EXTENDED_PORT, 'localhost', () => {
    console.log(`Extendend io listening on ${EXTENDED_PORT}`);
});
