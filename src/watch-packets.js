const defaultAuthorized = [
    '__authorize',
    '__authResult',
    '__multipleNotAlloweed',
];

export default (socket, authorize = defaultAuthorized) => {
    socket.___authorized = false;

    socket.use((packet, next) => {

        if (!!~authorize.indexOf(packet[0]) || socket.___authorized)
            return next();

    });
}