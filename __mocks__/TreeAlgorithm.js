'use strict';

const cloneDeep = require('lodash.clonedeep');
const stampit = require('stampit');

module.exports = stampit({
  init (_tree) {
    const tree = cloneDeep(_tree); // if we were to use the base object it would be destroyed!
    let keyTree = [];

    function processNextItem (action, keys, member, stack) {
      let nextItem = member[keys[0]];
      if (typeof nextItem === 'object') { // test first member of member object is an object
        let nextKeys = Object.keys(nextItem);
        processObjectNode(keys, member, nextItem, nextKeys, stack);
      } else {
        action({
          key: keys[0],
          item: nextItem,
          _keyTree: Object.assign([], keyTree).reverse(), // correct keyTree to read from left-to-right
          _out: _tree
        });
        delete member[(keys[0])];
      }
    }

    function processObjectNode (keys, member, nextItem, nextKeys, stack) {
      if (nextKeys.length) {
        keyTree.unshift(keys[0]);
        stack.unshift(nextItem); // ... EITHER add it to the stack for the next iteration
      } else {
        delete member[(keys[0])]; // ... OR delete it from member and remove it from stack because it's empty
        if (!member || Object.keys(member).length < 1) {
          stack.shift();
          keyTree.shift();
        }
      }
    }

    this.process = function (action) {
      Object.keys(tree).reduce((stack, key) => {
        stack.unshift(tree[key]);
        keyTree.unshift(key);
        while (stack.length > 0) { // ------------------------ until the main stack is empty
          let member = stack[0]; // -------------------------- get the first member of main stack
          if (typeof member === 'object') { // --------------- if the first member of main stack is an object...
            let keys = Object.keys(member); // --------------- fetch object's keys
            // console.log(keys);
            if (keys.length > 0) { // ------------------------ if object isn't empty ...
              processNextItem(action, keys, member, stack); // ... prepend a child object to the stack / perform an action / delete the object and shift from stack because it's been consumed
            } else {
              keyTree.shift();
              stack.shift(); // ------------------------------ ... shift from stack because it's been consumed
            }
          } else {
            action({ key, item: member, _keyTree: [], _out: _tree }); // process top level object
            keyTree.shift();
            stack.shift(); // ------------------------------- empty stack
          }
        }
        return stack;
      }, []);
    };
  }
});
