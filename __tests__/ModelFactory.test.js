const ModelFactory = require('../index.js');
jest.mock('echo-handler');
jest.mock('fs');
jest.mock('mongoose');
jest.mock('mongoose-type-number-enums');
jest.mock('../lib/ModelFactoryHelper.js');

const logSpy = [];
const modelFactory = ModelFactory();

const builderCalls = []
function $(call) {
  return {
    build (arg1, callback) {
      builderCalls.push(arg1)
      builderCalls.push(callback)
    }
  }
}
$.root = '..';
$.corei18n = 'en';
$.logger = {
    error: message => { throw new Error(message) },
    throw: message => { throw new Error(message) }
}
const app = { _modelRegister: {} }
describe('ModelFactory tests', () => {
  let spy = []; // nefarious mock mongoose spy
  beforeEach(() => {
    require('mongoose').setSchemaToClass(spy);
  });
  modelFactory.init(app, $);

const buildModelActualCallback = builderCalls[3] // expose the second component of the tests

  test('builder was called against models and their types', () => {
    expect(builderCalls[0]).toBe('models/type');
    expect(builderCalls[1]).toBe('buildTypeCallback Called');
    expect(builderCalls[2]).toBe('Model');
    expect(typeof builderCalls[3]).toBe('function');
  });

  test('mongooseEnums was upgraded', () => {
    const mongoose = require('mongoose');
    expect(mongoose.upgradeMongooseCalled).toBe(true);
  });

  test('connection fails', () => {
    const modelFactory1 = ModelFactory({ connectionString: 'connectionFail' });
    expect(() => { modelFactory1.init(app, $) }).toThrow('failed');
  })

  test('buildModelCallback builds mongoose model', () => {
    const modelCallbackCalled = false
    const localSchemaSpy = [];
    buildModelActualCallback(
      (value) => {
        return {
          _modelType: 'mongoose',
          schema: {
            spy: localSchemaSpy
          },
          options: 'options',
          index: 'index',
        }
      }, 'mock');
      expect(localSchemaSpy[0]).toBe('injectSchemaObjectIds was called')
      expect(spy[0]).toBe('instantiating the Schema object');
      expect(spy[1]).toBe('index was called');
      expect(spy[2]).toBe('bindClientModelToSchema was called');
      expect(spy[3]).toBe('mongoose.model() was called for the model: "mock"');
  });
  test('buildModelCallback throws meaningful error if internal component presents an issue', () => {
    const modelCallbackCalled = false
    expect(() => {
      buildModelActualCallback((value) => {
        return {
          _modelType: 'mongoose',
          schema: {
            error: true
          }
        } }, 'mock');
    }).toThrow('modelError');
  });
  test('buildModelCallback throws if missing a schema', () => {
    expect(() => {
      buildModelActualCallback(
        (value) => { return { _modelType: 'mongoose' } }, 'mock');
    }).toThrow('noSchema');
  });
  test('buildModelCallback is not a mongoose model', () => {
    const localSchemaSpy = [];
    buildModelActualCallback(
      (value) => {
        return {}
      }, 'mock');
    expect(localSchemaSpy.length).toBe(0);
    buildModelActualCallback(
      (value) => {
        return { _modelType: 'mySQL' }
      }, 'mock');
    expect(localSchemaSpy.length).toBe(0);
  });
  test('buildModelCallback builds mongoose model without index', () => {
    for (i = spy.length; i > 0; i--) spy.pop()
    const modelCallbackCalled = false
    const localSchemaSpy = [];
    buildModelActualCallback(
      (value) => {
        return {
          _modelType: 'mongoose',
          schema: {
            spy: localSchemaSpy
          },
          options: 'options'
        }
      }, 'mock');
      expect(localSchemaSpy[0]).toBe('injectSchemaObjectIds was called')
      expect(spy[0]).toBe('instantiating the Schema object');
      expect(spy[1]).toBe('bindClientModelToSchema was called');
      expect(spy[2]).toBe('mongoose.model() was called for the model: "mock"');
  });

  test('no mongoose types exist so only the models are built, the types are ignored', () => {
    for (i = builderCalls.length; i > 0; i--) builderCalls.pop()
    $.root = 'false'
    const modelFactory2 = ModelFactory().init(app, $);
    expect(builderCalls.length).toBe(2);
  });

  test('no mongoose types exist so only the models are built, the types are ignored', () => {
    const modelFactory2 = ModelFactory().init(app, $);
    const mongoose = require('mongoose')
    mongoose.models = undefined
    expect(app._modelRegister.mongoose('test')).toBe(undefined);
    mongoose.models = { test: 'test' }
    const modelFactory3 = ModelFactory().init(app, $);
    expect(app._modelRegister.mongoose('test')).toBe('test');
  });

  test('getConnectionString invalid environment call', () => {
    $.environment = 'duff'
    const modelFactory3 = ModelFactory({ connectionString: {
      development: 'mongodb://localhost:27017/coKoa'
    } })
    expect(() => { modelFactory3.init(app, $); }).toThrow('invalidConnectionString')
  });
});
