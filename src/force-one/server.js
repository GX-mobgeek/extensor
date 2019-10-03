import slugify from 'slugify'
import watchPackets from '../watch-packets'
import { IP, IP_UA } from './constants'

const refs = [IP, IP_UA];

function getId(socket, ref) {

    if (typeof ref === 'number') {

        if (refs.indexOf(ref) === -1)
            throw new Error('Invalid method of multiple connections identify');

        let { headers } = socket.handshake;

        let ip = (
            headers['x-real-ip'] ||
            headers['x-forwarded-for'] ||
            socket.handshake.address
        );

        switch (ref) {
            case IP:
                return ip;
            case IP_UA:
                let userAgent = slugify(headers['user-agent']);
                return `${ip}${userAgent}`;

        }

    }

    if (!(ref in socket))
        throw new Error(`Identify "${ref}" not found in socket: ${socket.id}`);

    return socket[ref];

}

export const socketHandler = (socket, {
    adapter,
    id = IP,
    onTry,
    storagePrefix = '___exIoNMNS',
    connectionTimeout = 2
}) => {

    if (connectionTimeout < 2)
        throw new Error("Minimum connection alive state timeout is 2 minutes");

    return new Promise(async (resolve, reject) => {

        try {
            let refId = getId(socket, id);

            let conn = await adapter.get(`${storagePrefix}${refId}`);

            if (conn === 1) {

                socket.emit('__multipleNotAlloweed', 1);
                socket.disconnect();

                resolve(false);

                return onTry && onTry();
            }

            let interval;

            await adapter.set(`${storagePrefix}${refId}`, 1, connectionTimeout);

            interval = setInterval((prefix, refId) => {

                adapter.set(`${prefix}${refId}`, 1, connectionTimeout);

            }, (connectionTimeout - 1) * 60 * 1000, storagePrefix, refId);

            socket.on('disconnect', () => {

                clearInterval(interval);
                adapter.del(`${storagePrefix}${refId}`);

            });

            resolve(true);


        } catch (e) {
            reject(e);
        }

    })
};

export const ioHandler = (io, rules) => {

    rules.connectionTimeout |= 2;

    if (rules.connectionTimeout < 2)
        throw new Error("Minimum connection alive state timeout is 2 minutes");


    io.use(async (socket, next) => {

        next();

        try {

            if (!io.___exAuthHandling) {
                watchPackets(socket);
                socket.___authorized = true;
            }

            await socketHandler(socket, rules);

        } catch (e) {

            socket.disconnect();
            throw new Error(e);

        }

    });

}
