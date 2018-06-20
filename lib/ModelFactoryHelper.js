'use strict';

const mongoose = require('mongoose');
const stampit = require('stampit');

module.exports = stampit({
  init ({_activeSchemas = {}}) {
    function bindHooks (echo, modelName, schema, hooks) {
      if (typeof hooks === 'object') {
        const hookTypes = ['pre', 'post'];
        Object.keys(hooks).forEach(hook => {
          if (hookTypes.indexOf(hook) > -1) {
            if (typeof hooks[hook] === 'object') {
              const events = ['count', 'find', 'findOne', 'findOneAndRemove', 'findOneAndUpdate', 'update', 'save', 'validate'];
              Object.keys(hooks[hook]).forEach(func => {
                if (events.indexOf(func) > -1) {
                  if (typeof hooks[hook][func] === 'function') {
                    schema[hook](func, hooks[hook][func]);
                  } else echo.error('notAFunc', modelName, hook, func);
                } else echo.error('notSupported', modelName, hook, func);
              });
            } else echo.error('notAnObj', modelName, hook);
          } else echo.error('invalidComp', modelName, hook, 'Hook', hookTypes.toString().replace(',', '/'));
        });
      }
    }

    function bindVirtuals (echo, modelName, schema, virtuals) {
      const methods = ['get', 'set'];
      Object.keys(virtuals).forEach(key => {
        const virtual = schema.virtual(key);
        if (typeof virtuals[key] === 'object') {
          Object.keys(virtuals[key]).forEach(getSet => {
            if (methods.indexOf(getSet) > -1 && typeof virtuals[key][getSet] === 'function') {
              virtual[getSet](virtuals[key][getSet]);
            } else echo.error('notAFunc', modelName, `virtuals.${key}`, getSet);
          });
        } else echo.error('invalidComp', modelName, `virtuals.${key}`, 'Virtual', methods.toString().replace(',', '/'));
      });
    }

    this.bindClientModelToSchema = function (echo, modelName, model, schema) {
      return Object.keys(model).forEach(key => {
        switch (key) {
          case 'index':
          case 'methods':
            Object.assign(schema[key], model[key]);
            break;
          case 'statics':
            Object.assign(schema[key], model[key]);
            break;
          case 'virtuals':
            bindVirtuals(echo, modelName, schema, model[key]);
            break;
          case 'hooks':
            bindHooks(echo, modelName, schema, model[key]);
            break;
        }
      });
    };

    this.buildModel = function ({ $, echo, key, schemas, type }) {
      const { m, modelName } = schemas[type][key];
      if (m.hasOwnProperty('schema')) {
        this.injectSchemaObjectIds($(':tree'), m.schema, echo);
        const schema = new mongoose.Schema(m.schema, m.options);
        if (m.index) schema.index(m.index);
        this.bindClientModelToSchema(echo, modelName, m, schema);
        const Model = mongoose.model(modelName, schema);
        Object.keys(schema.statics).forEach(func => { // bind Model class as 'this' to statics
          Model[func] = Model[func].bind(Model);
        });
        _activeSchemas[modelName] = schema;
      } else echo.throw('noSchema', modelName);
    };

    this.buildTypeCallback = function (echo) {
      return function (type, typeName) {
        const tName = typeName.replace('models', '');
        function newType (key, options) {
          mongoose.SchemaType.call(this, key, options, tName);
        }
        if (tName[0] === tName[0].toUpperCase()) {
          newType.prototype = Object.create(mongoose.SchemaType.prototype);
          newType.prototype.cast = type;
          mongoose.Schema.Types[tName] = newType;
          return mongoose;
        } else echo.throw('invalidTypeName', tName);
      };
    };

    this.getConnectionString = ($, echo, connectionString) => {
      if (typeof connectionString === 'string') return connectionString;
      else {
        const connection = connectionString[$.environment];
        return connection || echo.throw('invalidConnectionString', $.environment);
      }
    };

    this.injectSchemaObjectIds = function (treeAlgorithm, schema, echo) {
      treeAlgorithm(schema).process((it) => {
        let pointer = it._out;
        it._keyTree.forEach((key, i) => {
          if (typeof pointer[key] === 'object' ||
             (typeof pointer[key] === 'string' &&
              i === it._keyTree.length - 1)) {
            pointer = pointer[key]; // fastforward the pointer through linkedList
          }
        });
        // due to limitations of JS references, the below cannot be meaningfully decoupled
        if (typeof it.item === 'string') {
          switch (it.item) {
            case 'ObjectId':
            case 'ForeignKey':
            case 'FK':
              pointer[it.key] = mongoose.Schema.Types.ObjectId;
              break;
            default:
              if (it.item.match(/^nested:[A-Z]/)) {
                const name = it.item.split(':')[1];
                if (_activeSchemas.hasOwnProperty(name)) {
                  pointer[it.key] = _activeSchemas[name];
                } else echo.throw('nestedSchemaNotFound', name);
              }
          }
        }
      });
    };

    this.loadSchemas = ($, _builder, echo) => {
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
  }
});
