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
    const _nestedSchemas = {};

    const helper = ModelFactoryHelper();

    const build = (app, $, echo) => {
      const _builder = $(':builder');
      if (fs.existsSync(`${$.root}/api/models/types`)) {
        _builder.build('models/type', helper.buildTypeCallback(echo));
      }
      [ m => m._modelType === 'mongoose' && m.hasOwnProperty('_nest'),
        m => m._modelType === 'mongoose' ].forEach((callback, i) => {
        _builder.build(
          'Model',
          buildModelCallback($, echo, callback), i === 1);
      });
    };

    const buildModelCallback = ($, echo, condition) => {
      return (modelCallback, modelName) => {
        const model = modelCallback($);
        if (model.hasOwnProperty('_modelType') && condition(model)) {
          if (model.hasOwnProperty('schema')) {
            try {
              helper.injectSchemaObjectIds(
                $(':tree'), model.schema, _nestedSchemas, echo);
              const schema = new mongoose.Schema(model.schema, model.options);
              if (model.index) schema.index(model.index);
              helper.bindClientModelToSchema(echo, modelName, model, schema);
              if (!_nestedSchemas.hasOwnProperty(modelName)) {
                const Model = mongoose.model(modelName, schema);
                Object.keys(schema.statics).forEach(func => { // bind Model class as 'this' to statics
                  Model[func] = Model[func].bind(Model);
                });
              }
              if (model.hasOwnProperty('_nest')) {
                _nestedSchemas[modelName] = schema;
              }
            } catch (e) {
              echo.throw('modelError', modelName, e.message);
            }
          } else echo.throw('noSchema', modelName);
        }
      };
    };

    const registerModels = (app, mongoose) => {
      app._modelRegister.mongoose =
        itemName => mongoose.models
          ? mongoose.models[itemName]
          : undefined;
    };

    const registerPlugins = (app, $, mongoose) => {
      if (plugins) {
        plugins.forEach(plugin => {
          plugin(mongoose).init(app, $);
        });
      }
    };

    this.init = function (app, $) {
      const echo = echoHandler.configure({
        factoryOverride: `${__dirname}/i18n/${$.corei18n}.pluginMessages.json`,
        logger: $.logger });
      const mongooseEnums = new MongooseTypeNumberEnums($.corei18n);
      mongoose.promise = promise;
      mongoose
        .connect(helper.getConnectionString($, echo, connectionString))
        .catch(e => { echo.error('failed', e.message); });
      mongooseEnums.upgradeMongoose(mongoose); // allow numeric Enum support by default
      build(app, $, echo);
      registerModels(app, mongoose);
      registerPlugins(app, $, mongoose);
      $.getMongooseTypes = () => mongoose.Types;
    };
  }
});
