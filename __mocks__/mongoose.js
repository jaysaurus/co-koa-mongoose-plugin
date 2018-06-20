const m = {
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
    return {
      foo: { bind () {} },
      bar: { bind () {} },
      spy: []
    };
  },
  models: {
    mock: 'I am a mock model'
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
m.Schema = function (schema, options) {
  schema('Mongoose schema initialised');
  this.index = function (i) {
    i('mongoose schema index called');
  };
  this.statics =
    {
      foo: function () { },
      bar: function () { }
    };
};
m.Schema.Types = {
  ObjectId: 'OUTPUT'
};
module.exports = m;
