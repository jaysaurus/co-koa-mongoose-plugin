const echoHandler = require('echo-handler');
const fs = require('fs');
const mongoose = require('mongoose');
const MongooseTypeNumberEnums = require('mongoose-type-number-enums');
const stampit = require('stampit');

const ModelFactoryHelper = require('./lib/ModelFactoryHelper');

module.exports = stampit({
  init ({
    connectionString = 'mongodb://localhost:27017/coKoa',
    promise = global.Promise,
    plugins
  }) {
    const buildModelCallback = ($, helper, echo) => {
      return (modelCallback, modelName) => {
        const model = modelCallback($);
        if (model.hasOwnProperty('_modelType') && model._modelType === 'mongoose') {
          if (model.hasOwnProperty('schema')) {
            helper.injectSchemaObjectIds($(':tree'), model.schema);
            const schema = new mongoose.Schema(model.schema, model.options);
            if (model.index) schema.index(model.index);
            const statics = helper.bindClientModelToSchema(model, schema);
            const Model = mongoose.model(modelName, schema);
            statics.forEach(func => { // bind Model class as 'this' to statics
              Model[func] = Model[func].bind(Model);
            });
          } else echo.throw('noSchema', modelName);
        }
      };
    };

    const getConnectionString = ($, echo) => {
      if (typeof connectionString === 'string') return connectionString;
      else {
        const connection = connectionString[$.environment];
        return connection || echo.throw('invalidConnectionString', $.environment);
      }
    };

    this.init = function (app, $) {
      const _builder = $(':builder');
      const helper = ModelFactoryHelper();
      const echo = echoHandler.configure({
        factoryOverride: `${__dirname}/i18n/${$.corei18n}.pluginMessages.json`,
        logger: $.logger });
      const mongooseEnums = new MongooseTypeNumberEnums($.corei18n);
      mongoose.promise = promise;
      mongoose
        .connect(getConnectionString($, echo))
        .catch(e => { echo.error('failed', e.message); });
      mongooseEnums.upgradeMongoose(mongoose); // allow numeric Enum support by default
      if (fs.existsSync(`${$.root}/api/models/types`)) {
        _builder.build('models/type', helper.buildTypeCallback(echo));
      }
      _builder.build('Model', buildModelCallback($, helper, echo));
      app._modelRegister.mongoose =
        itemName => mongoose.models ? mongoose.models[itemName] : undefined;
      if (plugins) plugins.forEach(plugin => { plugin(mongoose).init(app, $); });
    };
  }
});
