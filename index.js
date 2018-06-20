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
    const helper = ModelFactoryHelper();

    const build = (app, $, echo) => {
      const _builder = $(':builder');
      if (fs.existsSync(`${$.root}/api/models/types`)) {
        _builder.build('models/type', helper.buildTypeCallback(echo));
      }
      const schemas = helper.loadSchemas($, _builder, echo);
      Object.keys(schemas.nested)
        .sort((a, b) => a - b)
        .forEach((key) => {
          helper.buildModel({ $, echo, key, schemas, type: 'nested' });
        });
      schemas.basic.forEach((it, i) => {
        helper.buildModel({ $, echo, key: i, schemas, type: 'basic' });
      });
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
