module.exports = function () {
  return {
    bindClientModelToSchema (modelName, schema) {
      schema.spy.push('bindClientModelToSchema was called');
      return ['foo', 'bar'];
    },
    buildTypeCallback (echo) {
      return 'buildTypeCallback Called';
    },
    injectSchemaObjectIds (tree, schema) {
      if (schema.error) throw new Error('error');
      else if (schema.spy) schema.spy.push('injectSchemaObjectIds was called');
    }
  };
};
