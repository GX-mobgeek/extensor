export default function onMultipleClientWarm(io, cb) {

    io.on('__multipleNotAlloweed', () => {
        io.on('disconnect', cb)

    });

}