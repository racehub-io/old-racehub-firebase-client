const BaseClient = require('../baseClient');
const clientTypes = require('../constants/clientTypes.json');
// import userSettings from '../../../userSettings';

class F1LiveClient extends BaseClient {

  constructor() {
    const receivePort = 30501 //userSettings.get('recorders_F1_inport');
    const forwardPort = 30500 //userSettings.get('recorders_F1_outport');
    const verbose = true;
    super({receivePort, forwardPort, verbose});
    this.clientType = clientTypes.F1;
  }
}

module.exports = F1LiveClient;
