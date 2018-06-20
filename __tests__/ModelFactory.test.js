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
$spy = []
$.spy = (...args) => {
  args.forEach(it => $spy.push(it))
}
$.root = '..';
$.corei18n = 'en';
$.logger = {
    error: message => { throw new Error(message) },
    throw: message => { throw new Error(message) }
}
let app = { _modelRegister: {} }
describe('ModelFactory tests', () => {
  let spy = []; // nefarious mock mongoose spy
  beforeEach(() => {
    require('mongoose').setSchemaToClass(spy);
  });
  modelFactory.init(app, $);

  test('builder was called against models and their types', () => {
    expect(builderCalls[0]).toBe('models/type');
    expect(builderCalls[1]).toBe('buildTypeCallback Called');
  });

  test('mongooseEnums was upgraded', () => {
    const mongoose = require('mongoose');
    expect(mongoose.upgradeMongooseCalled).toBe(true);
  });

  test('loadSchemas fired and it\'s output meant that buildModel was called twice', () => {
    expect($spy[0]).toBe('loadSchemas called');
    // nested schemas loaded numerically
    expect($spy[1]).toEqual({'nested': 'mock nested schema 1'});
    expect($spy[2]).toEqual({'nested': 'mock nested schema 2'});
    expect($spy[3]).toEqual({'basic': 'mock basic schema 1'});
    expect($spy[4]).toEqual({'basic': 'mock basic schema 2'});
  })

  test('connection fails', () => {
    const modelFactory1 = ModelFactory({ connectionString: 'connectionFail' });
    expect(() => { modelFactory1.init(app, $) }).toThrow('failed');
  })

  test('no mongoose types exist so only the models are built, the types are ignored', () => {
    for (i = builderCalls.length; i > 0; i--) builderCalls.pop()
    $.root = 'false'
    const modelFactory2 = ModelFactory().init(app, $);
    // builderCalls is empty where it would have had: 'models/type' and 'buildTypeCallback Called' in it.
    expect(builderCalls.length).toBe(0);
  });

  test('model register calls', () => {
    app = { _modelRegister: {} }
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

  test('mongoose plugins are called', () => {
    const spy = []
    const modelFactory4 = ModelFactory({
      plugins: [(mongoose) => {
        return {
          init: (app, $) => {
            spy.push(app);
            spy.push($)
          }
        }
      }]
    }).init(app, $);
    expect(spy[0]).toBe(app)
    expect(spy[1]).toBe($)
  });
});
