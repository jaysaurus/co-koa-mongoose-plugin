'use strict';

const cloneDeep = require('lodash.clonedeep');
const stampit = require('stampit');

const TreeAlgorithm = stampit({
  init (_tree) {
    const tree = cloneDeep(_tree); // if we were to use the base object it would be destroyed!
    let keyTree = [];

    function processNextItem (action, keys, member, stack) {
      let nextItem = member[keys[keys.length - 1]];
      if (typeof nextItem === 'object') {       // test last member of member object is an object
        let nextKeys = Object.keys(nextItem);
        processObjectNode(keys, member, nextItem, nextKeys, stack);
      } else {
        action({
          key: keys[keys.length - 1],
          item: nextItem,
          _keyTree: keyTree,
          _out: _tree
        });
        delete member[(keys[keys.length - 1])];
      }
    }

    function processObjectNode (keys, member, nextItem, nextKeys, stack) {
      if (nextKeys.length) {
        keyTree.push(keys[keys.length - 1]);
        stack.push(nextItem);                   // ... EITHER add it to the stack for the next iteration
      } else {
        delete member[(keys[keys.length - 1])]; // ... OR delete it from member and remove it from stack because it's empty
        if (!member || Object.keys(member).length < 1) {
          stack.pop();
          keyTree.pop();
        }
      }
    }

    this.process = function (action) {
      Object.keys(tree).reduce((stack, key) => {
        stack.push(tree[key]);
        keyTree.push(key);
        while (stack.length > 0) {                          // until the main stack is empty
          let member = stack[stack.length - 1];             // get the last member of main stack
          if (typeof member === 'object') {                 // if the last member of main stack is an object...
            let keys = Object.keys(member);                 // fetch object's keys
            if (keys.length > 0) {                          // if object isn't empty ...
              processNextItem(action, keys, member, stack); // ... append a child object to the stack / perform an action / delete the object and pop from stack because it's been consumed
            } else {
              keyTree.pop();
              stack.pop();                                  // ... pop from stack because it's been consumed
            }
          } else {
            action({ key: key, item: member, _keyTree: [], _out: _tree }); // process top level object
            stack.pop(); // empty stack
          }
        }
        return stack;
      }, []);
    };
  }
});

module.exports = tree => TreeAlgorithm(tree);
