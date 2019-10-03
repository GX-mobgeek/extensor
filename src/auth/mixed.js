import watchPackets from '../watch-packets'
import { socketHandler } from '../force-one/server'
import atach from './atachs'

export const server = (
    io,
    socket,
    next,
    { timeout = false },
    step1,
    step2) => {

    step1(result => {

        next();
        watchPackets(socket);

        socket.emit('__authResult', result);

        if (!result)
            return setTimeout(() => socket.disconnect(), 10);

        let _timeout;

        if (timeout !== false) {
            _timeout = setTimeout(() => {

                socket.disconnect();

            }, timeout);
        }

        socket.on('__authorize', (data, ack) => {
            step2(data, (result, atachs) => {
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

            }, socket);

        });

    }, socket);

}

export const client = (socket, step1) => {

    socket.on('__authResult', result => {

        if (!result)
            return step1(false);

        step1((data, result) => {

            socket.emit('__authorize', data, response => {
                result(response);
            });

        });

    });

}