module.exports = function () {
  return {
    bindClientModelToSchema (echo, modelName, model, schema) {
      schema.spy.push('bindClientModelToSchema was called');
      return ['foo', 'bar'];
    },
    buildModel ({ $, echo, key, schemas, type }) {
      $.spy({
        [type]: schemas[type][key]
      });
    },
    buildTypeCallback (echo) {
      return 'buildTypeCallback Called';
    },
    getConnectionString ($, echo, connectionString) {
      if (typeof connectionString === 'string') return connectionString;
      else {
        const connection = connectionString[$.environment];
        return connection || echo.throw('invalidConnectionString', $.environment);
      }
    },
    injectSchemaObjectIds (tree, schema) {
      if (schema.error) throw new Error('error');
      else if (schema.spy) schema.spy.push('injectSchemaObjectIds was called');
    },
    loadSchemas ($, _builder, echo) {
      $.spy('loadSchemas called');
      return {
        basic: ['mock basic schema 1', 'mock basic schema 2'],
        nested: {
          2: 'mock nested schema 2',
          1: 'mock nested schema 1'
        }
      };
    }
  };
};
