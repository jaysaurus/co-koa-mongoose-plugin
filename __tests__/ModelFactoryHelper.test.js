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
    const statics = helper.bindClientModelToSchema(log, 'test', model, schema);
    // virtual tests
    expect(observer.length).toBe(2);
    expect(typeof observer[0]).toBe('function');
    expect(typeof observer[1]).toBe('function');

    // model tests
    expect(statics.length).toBe(1);
    expect(statics[0]).toBe('mockStatic');
    expect(schema.methods).toEqual(model.methods);
    expect(schema.index).toEqual(model.index);

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
        }
      },
      type: 'FK',
    }
    const helper =
      ModelFactoryHelper()
        .injectSchemaObjectIds(
          require('../__mocks__/TreeAlgorithm'), // using the real deal
          fakeSchema);

    expect(fakeSchema.test0).toBe(String);
    expect(fakeSchema.type).toBe('OUTPUT');
    expect(fakeSchema.test1.type).toBe('OUTPUT');
    expect(fakeSchema.test1.ignore).toBe('ignored');
    expect(fakeSchema.test1.test2.type).toBe('OUTPUT');
    expect(fakeSchema.test1.test2.test3.type).toBe('OUTPUT');
  });
});
