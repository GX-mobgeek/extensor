import Socket from 'socket.io-client'
import { buildParser, withAuth } from '../src'
import schemas from './schemas'
import slugify from 'slugify'
import bytes from 'bytes'

const parser = buildParser(schemas);

const defaultIo = Socket('http://localhost:9001');

const extendedIo = Socket('http://localhost:9002',{
    parser
});

const stringBytes = str => new Blob([str]).size;
const simulePacket = content => `42["message",${JSON.stringify(content)}]`;

const miscStruct = {
    "_id": "5d943988c49f5734ad22d8b4",
    "index": 0,
    "guid": "96cd84c6-72a6-4707-9309-37419ffe9751",
    "isActive": false,
    "balance": 2020.21,
    "picture": "http://placehold.it/32x32",
    "age": 24,
    "eyeColor": "brown",
    "name": {
      "first": "Brady",
      "last": "Meyer"
    },
    "range": [0,1,2,3,4,5,6,7,8,9],
    "friends": [
        {
          "id": 0,
          "name": "Eva Potts"
        },
        {
          "id": 1,
          "name": "Dorsey Lowe"
        },
        {
          "id": 2,
          "name": "Brandi Lott"
        }
    ]
}

document.addEventListener("DOMContentLoaded", () => {

    let userName = 'ferco0';
    function getName() {

        userName = prompt("You ID");

        if (!userName || userName === '')
            return getName();

        return userName;
    }

    //getName();

    userName = slugify(userName);

    let defaultMsgSender;
    let extendedMsgSender;

    let defaultMiscSender;
    let extendedMiscSender;

    let sendMsg = data => {
        defaultMsgSender(data);
        extendedMsgSender(data);
    };

    let sendMisc = () => {
        defaultMiscSender();
        extendedMiscSender();
    }

    const btnMsg = document.getElementById('msg-send-button');
    const btnMisc = document.getElementById('misc-send-button');
    const msgContent = document.getElementById('text-box');

    btnMsg.addEventListener("click", e => {

        e.preventDefault();

        let content = msgContent.value.trim();
        let ts = Math.round(Date.now() / 1000);

       sendMsg({ content, ts });

        msgContent.value = '';

    });

    btnMisc.addEventListener('click', e => {

        e.preventDefault();

        sendMisc();

    });

    createClient('default',
        userName,
        defaultIo,
        msgSender => { defaultMsgSender = msgSender; },
        miscSender => { defaultMiscSender = miscSender });

    createClient('extended',
        userName,
        extendedIo,
        msgSender => { extendedMsgSender = msgSender; },
        miscSender => { extendedMiscSender = miscSender} );

});


function createClient(id, userName, io, sentMsg, sendMisc){

    withAuth( io, { method: withAuth.CREDENTIAL }, authorize => {

        authorize(userName, result => {
            result && init(io);
        })

    });

    function init(io) {

        const msgsBox = document.getElementById(`msgs-box-${id}`);
        const byteLength = document.getElementById(`bytelength-${id}`);
        let currLength = 0;

        io.emit('entry', '', (messages, bytesLength) => {

            messages.map(({ author, content }) =>
                rendMsg(author === userName ? 'You' : author, content)
            );

            bytesLength = parseInt(bytesLength);

            byteLength.textContent = bytes(bytesLength);
            currLength = bytesLength;

            rendMsg('You', 'get in.');
        });


        io.on('entry', name => rendMsg('Server', `${name} get in.`));
        io.on('leave', name => rendMsg('Server', `${name} left.`));
        
        function rendMsg(author, content) {
            let node = document.createElement('li');
            let text = document.createTextNode(content);
    
            node.className = 'msg-item';
            node.innerHTML = `<b>${author}</b>: `;
            node.appendChild(text);

            msgsBox.appendChild(node);
        }

        sentMsg( data => {
            rendMsg("You", data.content);

            let messageByteLength;
            let simuledSent = { ...data, author: userName }
            if (id === 'extended') {
                messageByteLength = parser.schemas.sentMessage.encode(simuledSent).byteLength;
            }
            else{
                messageByteLength = stringBytes( simulePacket(simuledSent) )
            }

            currLength += parseInt(messageByteLength);

            byteLength.textContent = bytes(currLength);

            io.emit("message", data );

        });

        sendMisc( () => {

            let length;
            if (id === 'extended') {
                length = parser.schemas.miscStruct.encode(miscStruct).byteLength;
            }
            else{
                length = stringBytes( simulePacket(miscStruct) )
            }

            currLength += parseInt(length);

            byteLength.textContent = bytes(currLength);

            io.emit("miscStruct", miscStruct );
            if(id === 'default')
                io.emit("miscStruct", parser.schemas.miscStruct.encode(miscStruct) );

        });

        io.on('sentMessage', ({ author, content }) => {
            rendMsg(author, content);
        });

        io.on('computeLength', length => {

            currLength += parseInt(length);
            byteLength.textContent = bytes(currLength);

        })

    }
}