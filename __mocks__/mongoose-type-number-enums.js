module.exports = function (val) {
  this.upgradeMongoose = function (mongoose) {
    mongoose.upgradeMongooseCalled = true;
  };
};
