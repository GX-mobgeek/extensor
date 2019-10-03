import schemapack from 'schemapack'
import ParserError from './error'

const schema = schemapack.build({
    _id: 'varuint',
    data: 'buffer',
    id: 'varint',
    nsp: 'string'
});

const TYPES = {
    CONNECT: 0,
    DISCONNECT: 1,
    EVENT: 2,
    ACK: 3,
    ERROR: 4,
    BINARY_EVENT: 5,
    BINARY_ACK: 6
};

const errorPacket = {
    type: TYPES.ERROR,
    data: 'parser error'
};


const createEncoder = (map, idmap, schemas) => {
    

    function EncodeError(packet, e){
        this.message = '';
    }

    return class Encoder {
        encode(packet, callback) {

            switch (packet.type) {
                case TYPES.EVENT:
                case TYPES.BINARY_EVENT:
                    if (packet.type === TYPES.EVENT && !(packet.data[0] in map))
                        return callback([this.json(packet)]);

                    return callback([this.pack(packet)]);
                default:
                    return callback([this.json(packet)]);
            }
        }
        json(packet) {
            try {
                return JSON.stringify(packet);
            } catch (e) {
                throw new Error(e);
            }
        }
        pack(packet) {

            try {
                if (packet.type === TYPES.BINARY_EVENT && !(packet.data[0] in map))
                    throw new Error('Binary event must be specified on schemas');

                let eventName = packet.data[0];
                let eventSchema = schemas[eventName];

                let flatPacket = {
                    _id: map[eventName].id,
                    data: eventSchema.encode(packet.data[1]),
                    nsp: packet.nsp,
                    id: !('id' in packet) ? -1 : packet.id
                };

                return schema.encode(flatPacket);

            } catch (e) {

                throw new ParserError('Encode', packet, map, false, e);
                //return this.json(errorPacket);
            }
        }
    }
}

export default createEncoder;