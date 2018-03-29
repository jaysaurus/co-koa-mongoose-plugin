module.exports = function () {
  return {
    bindClientModelToSchema (echo, modelName, model, schema) {
      schema.spy.push('bindClientModelToSchema was called');
      return ['foo', 'bar'];
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
    }
  };
};
