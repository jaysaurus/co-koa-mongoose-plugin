const echoHandler = jest.genMockFromModule('echo-handler');
echoHandler.configure = function (conf) {
  return {
    error (file, ...args) {
      conf.logger.error(file);
      args.forEach(arg => {
        conf.logger.error(arg);
      });
    },

    log (file, ...args) {
      conf.logger.log(file);
      args.forEach(arg => {
        conf.logger.log(arg);
      });
    },

    throw (file, ...calls) {
      throw new Error(`${file}: ${calls}`);
    },

    raw (file, ...calls) {
      return file;
    }
  };
};
module.exports = echoHandler;
