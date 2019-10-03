import watchPackets from '../watch-packets'
import { socketHandler } from '../force-one/server'
import atach from './atachs'

export const server = (
    io,
    socket,
    next,
    { timeout = false },
    handler) => {

    next();

    watchPackets(socket);

    let _timeout;
    if (timeout !== false) {
        _timeout = setTimeout(() => {

            socket.disconnect();

        }, timeout);
    }

    socket.on('__authorize', (data, ack) => {

        handler(data, (result, atachs) => {

            if (result) {
                socket.___authorized = true;

                if (timeout !== false)
                    clearTimeout(_timeout);

                if (atachs)
                    atach(socket, atachs);

                if (io.___exNoMutiplicity)
                    socketHandler(socket, io.___exNoMutiplicity);

            }

            ack(result);

        }, socket)

    });

}

export const client = (socket, handler) => {

    handler((data, result) => {
        socket.emit('__authorize', data, response => {
            result(response);
        });

    });

}