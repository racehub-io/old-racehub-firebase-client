const {
  F1TelemetryClient,
  constants,
} = require("@racehub-io/f1-telemetry-client");
const path = require("path");
const { nanoid } = require("nanoid");
const { isMainThread } = require("worker_threads");

const fs = require("fs");
const zlib = require("zlib");
const { parentPort, workerData } = require("worker_threads");

const { ParquetWriter, ParquetSchema } = require("parquets");
const { createMessage } = require("./createMessage");
const { createSchema } = require("./createParquetSchema");
const { getPacketSize, parseBufferMessage } = F1TelemetryClient;
const { PACKETS } = constants;

const os = require("os");

const schema = new ParquetSchema(createSchema());

async function participantPerFile() {
  const { filename } = workerData;
  const basePath = path.join(os.tmpdir(), `racehub`);
  const buffer = readFile(basePath, filename);

  const writers = {};
  let offset = 0;
  let uniqueSessionID = nanoid();
  let lastPacketSessionUID = null;

  const getMetaInformation = (session, carIndex) => {
    const laps = session.laps[carIndex];
    return { laps };
  };

  const writeMetaInformation = (writer, laps) => {
    writer.setMetadata("laps", JSON.stringify(laps));
  };

  while (offset < buffer.length) {
    console.log(offset + "/" + buffer.length);

    const m_packetFormat = readUInt16LE(buffer, offset);
    const m_packetID =
      m_packetFormat === 2018
        ? readUInt8(buffer, offset + 3)
        : readUInt8(buffer, offset + 5);
    const packetSize = getPacketSize(m_packetFormat, m_packetID);

    const parsedMessage = parseBufferMessage(
      buffer.slice(offset, offset + packetSize),
      true
    );

    const { packetID, packetData } = parsedMessage;

    const packetSessionUID = packetData?.data.m_header.m_sessionUID;

    if (packetSessionUID == 0) {
      lastPacketSessionUID = packetSessionUID;
      // next packet
      offset += packetSize;
      continue;
    }

    // new session, close current writers and create new ones
    if (lastPacketSessionUID !== packetSessionUID) {
      uniqueSessionID = nanoid();
      writers[uniqueSessionID] = {
        parquetHandles: [],
        frameIdentifier: null,
        sessionTime: 0,
        uniqueSessionID,
        currentLapNumbers: Array(22).fill(0),
        laps: Array(22).fill([]),
        latestPackets: {
          [PACKETS.motion]: null,
          [PACKETS.session]: null,
          [PACKETS.lapData]: null,
          [PACKETS.participants]: null,
          [PACKETS.carSetups]: null,
          [PACKETS.carTelemetry]: null,
          [PACKETS.carStatus]: null,
          [PACKETS.carDamage]: null,
          [PACKETS.sessionHistory]: null,
        },
        previousPacket: null,
      };
      const createWriterPromises = Array(22)
        .fill(null)
        .map((_, index) => {
          return createWriter(basePath, uniqueSessionID, index);
        });
      writers[uniqueSessionID].parquetHandles = await Promise.all(
        createWriterPromises
      );
    }

    const sessionWriters = writers[uniqueSessionID];
    const latestPackets = sessionWriters.latestPackets;
    const previousPacket = sessionWriters.previousPacket;

    if (
      packetData?.data.m_header.m_frameIdentifier !==
      sessionWriters.frameIdentifier
    ) {
      //write a row
      if (!Object.values(latestPackets).some((v) => v === null)) {
        const writeMessagePromises = sessionWriters.parquetHandles.map(
          (w, index) => {
            const motionData =
              latestPackets[PACKETS.motion].packetData?.data.m_carMotionData[
                index
              ];
            const sessionData = latestPackets[PACKETS.session].packetData?.data;
            const lapData =
              latestPackets[PACKETS.lapData].packetData?.data.m_lapData[index];
            const participantData =
              latestPackets[PACKETS.participants].packetData?.data
                .m_participants[index];
            const setupData =
              latestPackets[PACKETS.carSetups].packetData?.data.m_carSetups[
                index
              ];
            const telemetryData =
              latestPackets[PACKETS.carTelemetry].packetData?.data
                .m_carTelemetryData[index];
            const statusData =
              latestPackets[PACKETS.carStatus].packetData?.data.m_carStatusData[
                index
              ];
            const damageData =
              latestPackets[PACKETS.carDamage].packetData?.data.m_carDamageData[
                index
              ];
            const isPlayerIdx =
              index === packetData?.data.m_header.m_playerCarIndex;
            const message = createMessage(
              motionData,
              sessionData,
              lapData,
              participantData,
              setupData,
              telemetryData,
              statusData,
              damageData
            );
            return w.appendRow({
              frameID: sessionWriters.frameIdentifier
                ? sessionWriters.frameIdentifier
                : 0,
              sessionTime: sessionWriters.sessionTime,
              sessionID: `${packetSessionUID}`,
              uniqueSessionID: sessionWriters.uniqueSessionID,
              playerCarIndex: packetData?.data.m_header.m_playerCarIndex,
              carIndex: index,
              calculated_lap_number: sessionWriters.currentLapNumbers[index],
              wheel_speed_FL: isPlayerIdx
                ? latestPackets[PACKETS.motion].packetData?.data.m_wheelSpeed[2]
                : 0,
              wheel_speed_FR: isPlayerIdx
                ? latestPackets[PACKETS.motion].packetData?.data.m_wheelSpeed[3]
                : 0,
              wheel_speed_RL: isPlayerIdx
                ? latestPackets[PACKETS.motion].packetData?.data.m_wheelSpeed[0]
                : 0,
              wheel_speed_RR: isPlayerIdx
                ? latestPackets[PACKETS.motion].packetData?.data.m_wheelSpeed[1]
                : 0,
              wheel_slip_FL: isPlayerIdx
                ? latestPackets[PACKETS.motion].packetData?.data.m_wheelSlip[2]
                : 0,
              wheel_slip_FR: isPlayerIdx
                ? latestPackets[PACKETS.motion].packetData?.data.m_wheelSlip[3]
                : 0,
              wheel_slip_RL: isPlayerIdx
                ? latestPackets[PACKETS.motion].packetData?.data.m_wheelSlip[0]
                : 0,
              wheel_slip_RR: isPlayerIdx
                ? latestPackets[PACKETS.motion].packetData?.data.m_wheelSlip[1]
                : 0,
              racing_line: isPlayerIdx ? sessionData.m_dynamicRacingLine : 0,
              racing_line_type: isPlayerIdx
                ? sessionData.m_dynamicRacingLineType
                : 0,
              ...message,
            });
          }
        );
        await Promise.all(writeMessagePromises);
      }
    }

    if (packetID === PACKETS.lapData && latestPackets[PACKETS.lapData]) {
      writers[uniqueSessionID].currentLapNumbers = writers[
        uniqueSessionID
      ].currentLapNumbers.map((currentLapNumber, index) => {
        const lapData =
          latestPackets[PACKETS.lapData].packetData?.data.m_lapData[index];
        if (
          (packetData?.data.m_lapData[index].m_lapDistance < 100 &&
            lapData.m_lapDistance > 100) ||
          (packetData?.data.m_lapData[index].m_lapDistance > 0 &&
            lapData.m_lapDistance < 0)
        ) {
          return currentLapNumber + 1;
        } else {
          return currentLapNumber;
        }
      });
    }

    if (packetID === PACKETS.sessionHistory) {
      const carIndex = packetData?.data.m_carIdx;
      writers[uniqueSessionID].laps[carIndex] =
        packetData?.data.m_lapHistoryData.slice(0, packetData?.data.m_numLaps);
    }

    writers[uniqueSessionID].latestPackets[packetID] = parsedMessage;

    writers[uniqueSessionID].previousPacket = parsedMessage;
    writers[uniqueSessionID].frameIdentifier =
      packetData?.data.m_header.m_frameIdentifier;
    writers[uniqueSessionID].sessionTime =
      packetData?.data.m_header.m_sessionTime;

    lastPacketSessionUID = packetSessionUID;

    // next packet
    offset += packetSize;
  }

  // close all writers
  Object.values(writers).forEach((session) => {
    session.parquetHandles.forEach((writer, carIndex) => {
      const { laps } = getMetaInformation(session, carIndex);
      writeMetaInformation(writer, laps);
    });
  });
  const closeWriterPromises = Object.values(writers)
    .map((w) => w.parquetHandles)
    .flat()
    .map((writer) => writer.close());
  await Promise.all(closeWriterPromises);
  console.log("END PARSING");
  console.log(basePath);
}

function readUInt16LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8);
}

function readUInt8(buffer, offset) {
  return buffer[offset];
}

function readFile(basePath, filename) {
  const rawData = fs.readFileSync(`${basePath}/${filename}.rhc`);
  const inflatedBuffer = Buffer.from(rawData);
  return zlib.unzipSync(inflatedBuffer);
}

async function createWriter(basePath, sessionUID, participantIndex) {
  const outputPath = path.join(basePath, sessionUID);

  fs.mkdirSync(outputPath, { recursive: true });
  return ParquetWriter.openFile(
    schema,
    `${outputPath}/${participantIndex}.parquet`
  );
}

participantPerFile();
