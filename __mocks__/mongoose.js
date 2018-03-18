module.exports = {
  connect (string) {
    const obj = {};
    obj.catch = function (next) {
      if (string === 'connectionFail') {
        next('connection failed');
      }
    };
    return obj;
  },
  setSchemaToClass (spy) {
    this.Schema = function (clientSchema, clientOptions) {
      spy.push('instantiating the Schema object');
      this.clientOptions = clientOptions;
      this.spy = spy;
      this.index = obj => spy.push('index was called');
    };
  },
  model (modelName, schema) {
    schema.spy.push(`mongoose.model() was called for the model: "${modelName}"`);
    return {
      foo: function () { },
      bar: function () { },
      spy: []
    };
  },
  models: {
    mock: 'I am a mock model'
  },
  Schema: {
    Types: {
      ObjectId: 'OUTPUT'
    }
  },
  SchemaType: {
    call (obj, a, b, c) {
      // assumes that method is called with this set to array
      obj.push(a);
      obj.push(b);
      obj.push(c);
    },
    prototype: {}
  }
};
