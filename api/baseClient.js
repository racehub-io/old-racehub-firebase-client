const { app } = require("electron");
const dgram = require("dgram");

const path = require("path");
const fs = require("fs");
const os = require("os");
const zlib = require("zlib");
const { nanoid } = require("nanoid");
const { throttle } = require("lodash");

// import { store } from '../store/store';

// import {
//   clientConnect,
//   clientDisconnect,
//   clientUpdateRecorderInfo,
// } from "../actions/clients";

const DEFAULT_RECEIVE_PORT = 20777;
const DEFAULT_FORWARD_PORT = 30500;
const CLIENT_STARTED_ERROR_MESSAGE = "Client was already started";

class BaseClient {
  constructor(opts) {
    const {
      receivePort = DEFAULT_RECEIVE_PORT,
      forwardPort = DEFAULT_FORWARD_PORT,
      verbose = true,
    } = opts;

    this.receivePort = receivePort;
    this.forwardPort = forwardPort;
    this.verbose = verbose;
    this.isRunning = false;

    this.clientId = nanoid();
    this.clientType = null;

    this.lastMessage = null;
    this.messageCount = null;

    this.throttled_updateRecorderInfo = throttle(this.updateRecorderInfo, 200);
  }

  createStream() {
    const basePath = path.join(os.tmpdir(), "racehub");
    const filePath = path.join(basePath, `${Date.now()}.rhc`);
    fs.mkdirSync(basePath, { recursive: true });
    return fs.createWriteStream(filePath);
  }

  parseMessage(m) {
    this.messageCount++;
    this.lastMessage = new Date().getTime();
    this.throttled_updateRecorderInfo();
    if (this.socket) {
      this.socket.send(m, 0, m.length, this.forwardPort, "0.0.0.0");
    }
    if (this.file) {
      const ret = this.file.write(m);
    }
  }

  connect() {
    const { clientId } = this;
    this.start();
    // store.dispatch(clientConnect(clientId));
  }

  disconnect() {
    const { clientId } = this;
    this.stop();
    this.lastMessage = null;
    this.messageCount = null;
    // store.dispatch(clientDisconnect(clientId));
  }

  start() {
    if (this.isRunning) {
      return;
    }
    this.file = zlib.createGzip();
    this.file.pipe(this.createStream());
    this.socket = dgram.createSocket("udp4");
    this.socket.on("listening", () => {
      if (!this.socket) {
        return;
      }
      const address = this.socket.address();
      if (this.verbose) {
        console.log(
          `UDP socket listening on ${address.address}:${address.port}`
        );
      }
      this.socket.setBroadcast(true);
    });
    this.socket.on("message", (m) => this.parseMessage(m));
    this.socket.bind(this.receivePort);
    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    return (
      this.socket &&
      this.socket.close(() => {
        if (this.verbose) {
          console.log(`UDP socket closed`);
        }

        this.socket = undefined;

        this.file &&
          this.file.end(() => {
            if (this.verbose) {
              console.log(`File closed`);
            }

            this.file = undefined;
          });

        this.isRunning = false;
      })
    );
  }

  updateRecorderInfo() {
    const { clientId, messageCount, lastMessage } = this;
    const message = {
      messageCount,
      lastMessage,
    };
    console.log(message);
    // store.dispatch(clientUpdateRecorderInfo(clientId, message));
  }
}

module.exports = BaseClient;
