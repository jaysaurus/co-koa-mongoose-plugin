[![Build Status](https://travis-ci.org/jaysaurus/co-koa-mongoose-plugin.svg?branch=master)](https://travis-ci.org/jaysaurus/co-koa-mongoose-plugin.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/jaysaurus/co-koa-mongoose-plugin/badge.svg?branch=master)](https://coveralls.io/repos/github/jaysaurus/co-koa-mongoose-plugin/badge.svg?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/jaysaurus/co-koa-mongoose-plugin.svg)](https://greenkeeper.io/)
[![Test For Vulnerabilities](https://snyk.io/test/github/jaysaurus/co-koa-mongoose-plugin/badge.svg?targetFile=package.json)](https://snyk.io/test/github/jaysaurus/co-koa-mongoose-plugin?targetFile=package.json)


<a title="Co.Koa on github" href="https://jaysaurus.github.io/Co.Koa">
<img alt="Co.Koa header" title="Co.Koa" style="margin: 0 15%; width: 70%" src="https://raw.githubusercontent.com/jaysaurus/Co.Koa/master/siteStrapCoKoa.png?sanitize=true" />
</a>

# co-koa-mongoose-plugin

As of Co.Koa@1.5.0 the mongoose API has been fully decoupled into a plugin. For details on how to use this plugin once it has been installed please visit the [Models](http://cokoajs.com/miniSite/documentation/Model.html) page of the Co.Koa [documentation](http://cokoajs.com/)

## installation

add co-koa-mongoose-plugin to a Co.Koa project instance via:

```
npm i co-koa-mongoose-plugin --save
```

within your app.js add the co-koa-mongoose-plugin as a requirement and pass the SessionPlugin call as below:

```javascript
const fs = require('fs');
const mongoosePlugin = require('co-koa-mongoose-plugin');

if (fs.existsSync('./node_modules')) {
  const CoKoa = require('co-koa-core');
  try {
    const coKoa = CoKoa(__dirname).launch(mongoosePlugin()); // <= HERE!
    ...
```

The `mongoosePlugin` can optionally be called with a configuration object.  The default configuration object is as below:

```javascript
SessionPlugin({
  connectionString = 'mongodb://localhost:27017/coKoa',
  promise = global.Promise,
  plugins = undefined
})
```

The **connectionString** property expects either a list of strings or an object containing environment properties matching those supplied to your Co.Koa environment at launch (see [installation & execution documentation](https://github.com/jaysaurus/Co.Koa/wiki/Installation-&-Execution#user-content-execution) for more information):
```javascript
connectionString: {
  development: 'mongodb://etc',
  test: 'mongodb://etc',
  etc: 'mongodb://etc',
}
...
```

the **promise** property expects a promise library for mongoose to use on asynchronous requests. You are strongly encouraged to supply an alternative promise library to mongoose.  At the time of writing, the global promise library is significantly slower than other promise libraries (see, for example [bluebird](https://github.com/petkaantonov/bluebird))

the **plugins** property can be supplied an array of additional Co.Koa plugins.  These should point to methods based on the boilerplate below:
```javascript
(mongoose) => {
  ...
  return {
    init (app, $) => {
      ...
    }
  }
}
```
