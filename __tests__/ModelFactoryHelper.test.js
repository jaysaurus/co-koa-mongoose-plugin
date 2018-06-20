const ModelFactoryHelper = require('../lib/ModelFactoryHelper.js');
// const mongoose = require('mongoose');
jest.mock('mongoose');

describe('ModelFactoryHelper tests', () => {
  test('bindClientModelToSchema binds client\'s model to a mongoose schema', ()=> {
    const observer = [];
    const errorSpy = [];
    const throwSpy = [];
    const log = {
      error: (e, ...args) => { errorSpy.push({ e, args }) },
      throw: (e, ...args) => { throwSpy.push({ e, args }) }
    }
    const model = {
      index: {
        foo: 'foo',
        bar: 'bar'
      },
      methods: {
        foz: 'foz',
        baz: 'baz'
      },
      virtuals: {
        mockVirtual: {
          get () {},
          set (a) {},
          ignore: 123 // proof invalid props are ignored
        }
      },
      statics: {
        mockStatic: 1
      },
      hooks: 'ignore'
    }
    const schema = {
      index: {},
      methods: {},
      statics: {},
      virtual (arg) {
        return {
          get (a) {
            observer.push(a);
          },
          set (a) {
            observer.push(a);
          }
        }
      },
      hooks: 'ignore'
    }

    const helper = ModelFactoryHelper();
    helper.bindClientModelToSchema(log, 'test', model, schema);
    // virtual tests
    expect(observer.length).toBe(2);
    expect(typeof observer[0]).toBe('function');
    expect(typeof observer[1]).toBe('function');

    // model tests
    expect(schema.methods).toEqual(model.methods);
    expect(schema.index).toEqual(model.index);
    expect(schema.statics).toEqual(model.statics);

    // get/set missing, exit gracefully
    delete model.virtuals.mockVirtual.set
    helper.bindClientModelToSchema(log, 'test', model, schema);
    expect(observer.length).toBe(3);
    expect(typeof observer[2]).toBe('function');
  });
  test('bindClientModelToSchema binds client\'s hooks to a mongoose schema and handles duff validators/hooks', ()=> {
    const errorSpy = [];
    const throwSpy = [];
    const log = {
      error: (e, ...args) => { errorSpy.push({ e, args }) },
      throw: (e, ...args) => { throwSpy.push({ e, args }) }
    }
    const model = {
      virtuals: {
        badVirtualObject: 'test',
        mockVirtual: {
          badVirtualMethod () {},
          set: 123 // proof invalid props are ignored
        }
      },
      hooks: {
        pre: {
          save () {
            return 'saveFunction'
          },
          find: 'badHookPreType',
          badHookPreMethod () {},

        },
        post: 'badHookType',
        badHookMethod () {}
      }
    }
    const hooks = []
    const schema = {
      index: {},
      methods: {},
      statics: {},
      virtual (arg) {
        return {
          get (a) {
            observer.push(a);
          },
          set (a) {
            observer.push(a);
          }
        }
      },
      pre (name, func) {
        hooks.push({ name, func });
      }
    }

    const helper = ModelFactoryHelper();
    const statics = helper.bindClientModelToSchema(log, 'test', model, schema);

    // virtual tests
    expect(hooks.length).toBe(1);
    expect(hooks[0].func()).toBe('saveFunction');
    expect(hooks[0].name).toBe('save');

    // virtual doesn't conform to object type
    expect(errorSpy[0].e).toBe('invalidComp');
    expect(errorSpy[0].args[1]).toBe('virtuals.badVirtualObject');

    // virtual method doesn't conform to method types
    expect(errorSpy[1].e).toBe('notAFunc');
    expect(errorSpy[1].args[1]).toBe('virtuals.mockVirtual');
    expect(errorSpy[1].args[2]).toBe('badVirtualMethod');

    // virtual method isn't a function
    expect(errorSpy[2].e).toBe('notAFunc');
    expect(errorSpy[2].args[1]).toBe('virtuals.mockVirtual');
    expect(errorSpy[2].args[2]).toBe('set');

    // hook pre is supplied something other than a function
    expect(errorSpy[3].e).toBe('notAFunc');
    expect(errorSpy[3].args[1]).toBe('pre');
    expect(errorSpy[3].args[2]).toBe('find');

    // hook pre is supplied an unexpected method type
    expect(errorSpy[4].e).toBe('notSupported');
    expect(errorSpy[4].args[1]).toBe('pre');
    expect(errorSpy[4].args[2]).toBe('badHookPreMethod');

    // hook post is supplied but not a function
    expect(errorSpy[5].e).toBe('notAnObj');
    expect(errorSpy[5].args[1]).toBe('post');

    // hook is supplied an unexpected method type
    expect(errorSpy[6].e).toBe('invalidComp');
    expect(errorSpy[6].args[1]).toBe('badHookMethod');
    expect(errorSpy[6].args[2]).toBe('Hook');
  });

  test('buildModel successful behaviour', () => {
    const _activeSchemas = {};
    const helper = ModelFactoryHelper({_activeSchemas});
    const spy = []
    helper.injectSchemaObjectIds = function () {
      spy.push('injectSchemaObjectIds called')
    }
    helper.bindClientModelToSchema = function () {
      spy.push('bindClientModelToSchema called')
    }
    const $ = () => {};
    const echoSpy = {};
    const indexSpy = [];
    const schemaSpy = [];
    const echo = { throw: function (a, b) { return {[a]: b} } }
    schemas = {
      mock: {
        key: {
          m: {
            schema: (it) => schemaSpy.push(it),
            index: (it) => indexSpy.push(it)
          },
          modelName: 'MockModel'
        }
      }
    }
    helper.buildModel({$, echo, key: 'key', schemas, type: 'mock'});
    expect(indexSpy).toEqual(['mongoose schema index called']);
    expect(schemaSpy).toEqual(['Mongoose schema initialised']);
    expect(_activeSchemas).toHaveProperty('MockModel');
    expect(_activeSchemas.MockModel).toHaveProperty('index');
    expect(_activeSchemas.MockModel).toHaveProperty('statics');
    expect(_activeSchemas.MockModel.statics).toHaveProperty('foo');
    expect(_activeSchemas.MockModel.statics).toHaveProperty('bar');
  });
  test('buildModel gracefully ignores index if undefined', () => {
    const _activeSchemas = {};
    const helper = ModelFactoryHelper({_activeSchemas});
    const spy = []
    helper.injectSchemaObjectIds = function () {
      spy.push('injectSchemaObjectIds called')
    }
    helper.bindClientModelToSchema = function () {
      spy.push('bindClientModelToSchema called')
    }
    const $ = () => {};
    const echoSpy = {};
    const indexSpy = [];
    const schemaSpy = [];
    const echo = { throw: function (a, b) { return {[a]: b} } }
    schemas = {
      mock: {
        key: {
          m: {
            schema: (it) => schemaSpy.push(it),
          },
          modelName: 'MockModel'
        }
      }
    }
    helper.buildModel({$, echo, key: 'key', schemas, type: 'mock'});
    expect(indexSpy).toEqual([]);
    expect(schemaSpy).toEqual(['Mongoose schema initialised']);
    expect(_activeSchemas).toHaveProperty('MockModel');
    expect(_activeSchemas.MockModel).toHaveProperty('index');
    expect(_activeSchemas.MockModel).toHaveProperty('statics');
    expect(_activeSchemas.MockModel.statics).toHaveProperty('foo');
    expect(_activeSchemas.MockModel.statics).toHaveProperty('bar');
  });
  test('buildModel fails because noSchema', () => {
    schemas = {
      mock: {
        key: {
          m: {
            // uh oh no schema
          },
          modelName: 'MockModel'
        }
      }
    }
    let echoSpy = {}
    const echo = { throw: function (a, b) { echoSpy = {[a]: b} } }
    const helper = ModelFactoryHelper();
    helper.buildModel({ $: undefined, echo, key: 'key', schemas, type: 'mock' })
    expect(echoSpy['noSchema']).toBe('MockModel');
  })

  test('buildTypeCallback assigns new type to mongoose', () => {
    const callback = ModelFactoryHelper().buildTypeCallback();
    const mockgoose = callback({}, 'MockName');
    expect(typeof mockgoose.Schema.Types['MockName']).toBe('function')
    const spy = []
    const spyCall = { push (i) { spy.push(i) } };
    const result = mockgoose.Schema.Types['MockName'].call(spy, 'mockKey', 'mockOption');
    expect(spy.length).toBe(3);
    expect(spy[0]).toBe('mockKey');
    expect(spy[1]).toBe('mockOption');
    expect(spy[2]).toBe('MockName');
  });
  test('buildTypeCallback is supplied an invalid filename', () => {
    const spy = [];
    const callback =
      ModelFactoryHelper()
        .buildTypeCallback({
          throw (a,b) { spy.push(a); spy.push(b) } });
    const mockgoose = callback({}, 'mockName');
    expect(spy.length).toBe(2);
    expect(spy[0]).toBe('invalidTypeName');
    expect(spy[1]).toBe('mockName');
  });

  test('getConnectionString tests', () => {
    const helper = ModelFactoryHelper();
    expect(helper.getConnectionString(0,0, 'connectionString')).toBe('connectionString');
    expect( // environment driven test
      helper
        .getConnectionString(
          { environment: 'test' }, 0,
          { test: 'connectionString2' }))
        .toBe('connectionString2');

    let observer = '';
    helper
      .getConnectionString(
        { environment: 'test' },
        { 'throw' (result) { observer = result; } },
        { junk: 'connectionString2' })
    expect(observer)
        .toBe('invalidConnectionString');
  });

  test('INTEGRATION TEST: injectSchemaObjectIds parses ObjectId, ForeignKey and FK', () => {
    const fakeSchema = {
      test0: String,
      test1: {
        type: 'ObjectId',
        ignore: 'ignored',
        other: 1,
        test2: {
          type: 'ForeignKey',
          test3: {
            type: 'FK'
          }
        },
      },
      test4: 'nested:Mock',
      test5: 'nested:InvalidSchema',
      other () { },
      type: 'FK'
    }
    const _activeSchemas = {
      'Mock': 'I am a nested schema'
    }
    const echoSpy = {};
    const echo = {
      throw: function (type, name) {
        echoSpy[type] = name
      }
    }
    const helper =
      ModelFactoryHelper({_activeSchemas})
        .injectSchemaObjectIds(
          require('../__mocks__/TreeAlgorithm'), // using the real deal
          fakeSchema,
          echo);

    expect(fakeSchema.test0).toBe(String);
    expect(fakeSchema.type).toBe('OUTPUT');
    expect(fakeSchema.test1.type).toBe('OUTPUT');
    expect(fakeSchema.test1.ignore).toBe('ignored');
    expect(fakeSchema.test1.test2.type).toBe('OUTPUT');
    expect(fakeSchema.test1.test2.test3.type).toBe('OUTPUT');
    expect(fakeSchema.test4).toBe('I am a nested schema')
    expect(echoSpy['nestedSchemaNotFound']).toBe('InvalidSchema');
  });

  test('loadSchemas successful basic object', () => {
    const loadSchemasCallback = {}
    const _builder = { build: (name, callback) => {
        modelCallback = function () {
          return {
            _modelType: 'mongoose',
          }
        }
        callback(modelCallback, 'Mock')
      }
    }
    const helper = ModelFactoryHelper();
    const result = helper.loadSchemas({}, _builder);

    expect(result.basic.length).toBe(1);
    expect(result.basic[0].m).toEqual({ _modelType: 'mongoose' });
    expect(result.basic[0].modelName).toEqual('Mock');

  });
  test('loadSchemas successful nested object', () => {
    const loadSchemasCallback = {}
    const _builder = { build: (name, callback) => {
        modelCallback = function () {
          return {
            _modelType: 'mongoose',
            _nest: 0
          }
        }
        callback(modelCallback, 'Mock')
      }
    }
    const helper = ModelFactoryHelper();
    const result = helper.loadSchemas({}, _builder);

    expect(result.nested[0]).toEqual({
      m: {
        _modelType: 'mongoose',
        _nest: 0
      },
      modelName: 'Mock'
    });
  });
  test('loadSchemas gracefully disregard non mongoose models', () => {
    const loadSchemasCallback = {}
    const _builder = { build: (name, callback) => {
        modelCallback = function () {
          return {
            _modelType: 'not-mongoose',
          }
        }
        callback(modelCallback, 'Mock')
      }
    }
    const helper = ModelFactoryHelper();
    const result = helper.loadSchemas({}, _builder);

    expect(result.nested).toEqual({});
    expect(result.basic).toEqual([]);

  });
  test('loadSchemas gracefully disregard objects with no _modelType', () => {
    const loadSchemasCallback = {}
    const _builder = { build: (name, callback) => {
        modelCallback = function () {
          return {
          }
        }
        callback(modelCallback, 'Mock')
      }
    }
    const helper = ModelFactoryHelper();
    const result = helper.loadSchemas({}, _builder);

    expect(result.nested).toEqual({});
    expect(result.basic).toEqual([]);

  });
  test('loadSchemas erroneous nested object', () => {
    const loadSchemasCallback = {}
    const _builder = { build: (name, callback) => {
        modelCallback = function () {
          return {
            _modelType: 'mongoose',
            _nest: false
          }
        }
        callback(modelCallback, 'Mock')
      }
    }
    const helper = ModelFactoryHelper();
    echoSpy = {};
    const result = helper.loadSchemas({}, _builder, { error (a, b) {echoSpy[a] = b}});

    expect(echoSpy['invalidNestType']).toEqual('Mock');
  });
});
