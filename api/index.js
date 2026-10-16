const F1LiveClient = require('./f1/f1LiveClient');
// import RFactor2LiveClient from './rfactor2/rfactor2LiveClient';

const f1client = new F1LiveClient();
// const rfactor2client = new RFactor2LiveClient();

const clients = {
  [f1client.clientId]: f1client,
  //[rfactor2client.clientId]: rfactor2client,
};

module.exports = clients;
