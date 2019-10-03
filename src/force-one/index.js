import { IP, IP_UA } from './constants'
import client from './client'
import * as server from './server'
import * as adapters from './adapters'

export const forceOne = (io, rule) => {

    if (!('io' in io)) {

        if (!io.___exAuthHandling)
            return server.ioHandler(io, rule);

        return io.___exNoMutiplicity = rule;

    } else
        return client(io, rule);

};

forceOne.adapters = adapters;
forceOne.IP = IP;
forceOne.IP_UA = IP_UA;
