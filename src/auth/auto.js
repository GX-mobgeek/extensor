import { socketHandler } from '../force-one/server'
import atach from './atachs'

export const server = (io, socket, next, handler) => {

    handler((result, atachs) => {

        next();

        socket.emit('__authResult', result);

        socket.___authorized = result;

        if (!result)
            return setTimeout(() => socket.disconnect(), 10);

        if (atachs)
            atach(socket, atachs);

        if (io.___exNoMutiplicity)
            socketHandler(socket, io.___exNoMutiplicity);

    }, socket);

}

export const client = (socket, handler) => {

    socket.on('__authResult', result => handler(result));

}