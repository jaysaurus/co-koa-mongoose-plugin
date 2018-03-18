<a title="Co.Koa on github" href="https://jaysaurus.github.io/Co.Koa">
<img alt="Co.Koa header" title="Co.Koa" style="margin: 0 15%; width: 70%" src="https://raw.githubusercontent.com/jaysaurus/Co.Koa/master/siteStrapCoKoa.png?sanitize=true" />
</a>

# co-koa-mongoose-plugin

As of Co.Koa@1.5.0, the mongoose api is fully decoupled into a plugin. For details on how to use this plugin once it has been installed please visit the [Models](http://cokoajs.com/miniSite/documentation/Model.html) page of the Co.Koa [documentation](http://cokoajs.com/)

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
