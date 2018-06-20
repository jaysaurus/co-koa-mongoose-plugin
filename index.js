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
    const _activeSchemas = {};
    const helper = ModelFactoryHelper();

    const build = (app, $, echo) => {
      const _builder = $(':builder');
      if (fs.existsSync(`${$.root}/api/models/types`)) {
        _builder.build('models/type', helper.buildTypeCallback(echo));
      }
      const schemas = loadSchemas($, _builder, echo);
      debugger;
      Object.keys(schemas.nested)
        .sort((a, b) => a - b)
        .forEach((key) => {
          buildModel({ $, echo, key, schemas, type: 'nested' });
        });
      schemas.basic.forEach((it, i) => {
        buildModel({ $, echo, key: i, schemas, type: 'basic' });
      });
    };

    const buildModel = ({ $, echo, key, schemas, type }) => {
      const { m, modelName } = schemas[type][key];
      if (m.hasOwnProperty('schema')) {
        helper.injectSchemaObjectIds($(':tree'), m.schema, _activeSchemas, echo);
        const schema = new mongoose.Schema(m.schema, m.options);
        if (m.index) schema.index(m.index);
        helper.bindClientModelToSchema(echo, modelName, m, schema);
        const Model = mongoose.model(modelName, schema);
        Object.keys(schema.statics).forEach(func => { // bind Model class as 'this' to statics
          Model[func] = Model[func].bind(Model);
        });
        _activeSchemas[modelName] = schema;
      } else echo.throw('noSchema', modelName);
    };

    const loadSchemas = ($, _builder, echo) => {
      const schemas = {
        basic: [],
        nested: {}
      };
      _builder.build('Model',
        (modelCallback, modelName) => {
          const m = modelCallback($);
          if (m && m.hasOwnProperty('_modelType')) {
            if (m._modelType === 'mongoose') {
              if (m.hasOwnProperty('_nest')) {
                if (typeof m._nest !== 'number') {
                  echo.error('invalidNestType', modelName);
                }
                schemas.nested[m._nest] = { m, modelName };
              } else schemas.basic.push({ m, modelName });
            }
          }
        });
      return schemas;
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
