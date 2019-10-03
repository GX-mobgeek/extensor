import schemapack from 'schemapack'

const simpleSchemas = {};

export default function buildSchemas(map) {
    let schemas = {};
    let idmap = {};

    Object.keys(map).map(event => {

        let item = map[event];

        if ((typeof item.id === 'undefined') || !item.schema)
            throw new Error(`Undefined ID or schema for event ${event}`);

        if (typeof item.schema === 'string' && !(item.schema in simpleSchemas))
            simpleSchemas[item.schema] = schemapack.build(item.schema);

        schemas[event] = typeof item.schema === 'string' ?
            simpleSchemas[item.schema]
            :
            schemapack.build(item.schema);

        idmap[item.id] = event;

    });

    return { schemas, idmap };

}
