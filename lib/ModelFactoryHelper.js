'use strict';

const mongoose = require('mongoose');
const stampit = require('stampit');

const ModelFactoryHelper = stampit({
  init () {
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

    this.injectSchemaObjectIds = function (treeAlgorithm, schema, _nestedSchemas, echo) {
      treeAlgorithm(schema).process((it) => {
        if (typeof it.item === 'string' &&
           (it.key === 'type' ||
            it.key === '0')) {
          let pointer = it._out;
          it._keyTree.forEach((key, i) => {
            if (typeof pointer[key] === 'object' ||
               (typeof pointer[key] === 'string' &&
                i === it._keyTree.length - 1)) {
              pointer = pointer[key]; // fastforward the pointer through linkedList
            }
          });
          switch (it.item) {
            case 'ObjectId':
            case 'ForeignKey':
            case 'FK':
              pointer[it.key] = mongoose.Schema.Types.ObjectId;
              break;
            default:
              if (it.item.match(/^nested:[A-Z]/)) {
                const name = it.item.split(':')[1];
                if (_nestedSchemas.hasOwnProperty(name)) {
                  pointer[it.key] = _nestedSchemas[name];
                } else echo.throw('nestedSchemaNotFound', name);
              }
          }
        }
      });
    };
  }
});

module.exports = () => ModelFactoryHelper();
