import { deflateRawSync } from "node:zlib";

interface ZipEntry {
  name: string;
  data: Buffer;
  store?: boolean;
}

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let current = index;
    for (let bit = 0; bit < 8; bit++) {
      current =
        (current & 1) !== 0 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
    }
    table[index] = current >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(buffer: Buffer): number {
  let current = 0xffffffff;
  for (const byte of buffer) {
    current = CRC_TABLE[(current ^ byte) & 0xff]! ^ (current >>> 8);
  }
  return (current ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date: Date): { time: number; date: number } {
  const time =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    (((date.getFullYear() - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);

  return { time, date: dosDate };
}

export function buildEditorialPackageBundle(entries: ZipEntry[]): Buffer {
  const now = new Date();
  const { time, date } = getDosDateTime(now);
  const fileParts: Buffer[] = [];
  const centralDirectory: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const fileName = Buffer.from(entry.name, "utf8");
    const uncompressed = entry.data;
    const compressed =
      entry.store === true ? uncompressed : deflateRawSync(uncompressed);
    const compressionMethod = entry.store === true ? 0 : 8;
    const checksum = crc32(uncompressed);

    const localHeader = Buffer.alloc(30 + fileName.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(compressionMethod, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(uncompressed.length, 22);
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28);
    fileName.copy(localHeader, 30);

    fileParts.push(localHeader, compressed);

    const centralHeader = Buffer.alloc(46 + fileName.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(compressionMethod, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(uncompressed.length, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    fileName.copy(centralHeader, 46);

    centralDirectory.push(centralHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralSize = centralDirectory.reduce((sum, buffer) => sum + buffer.length, 0);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralSize, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...fileParts, ...centralDirectory, endRecord]);
}
