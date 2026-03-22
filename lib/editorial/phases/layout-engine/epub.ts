import { deflateRawSync } from "node:zlib";
import type { EditorialMetadataPackage } from "../metadata-generation/types";
import type {
  EditorialLayoutChapter,
  EditorialTypographySystem,
} from "./types";

interface ZipEntry {
  name: string;
  data: Buffer;
  store?: boolean;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toXhtmlParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeXml(paragraph)}</p>`);
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

function buildZip(entries: ZipEntry[]): Buffer {
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

  const centralSize = centralDirectory.reduce(
    (total, part) => total + part.length,
    0
  );
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

export async function generateLayoutEpub(input: {
  metadata: EditorialMetadataPackage;
  author: string;
  language: string;
  chapters: EditorialLayoutChapter[];
  typography: EditorialTypographySystem;
  coverImageBuffer?: Buffer | null;
}): Promise<Buffer> {
  const identifier = `urn:hebeling:editorial:${input.metadata.validated_asset_id}`;
  const styleSheet = [
    "body {",
    `  font-family: ${input.typography.body_font}, serif;`,
    `  font-size: ${input.typography.body_size}pt;`,
    `  line-height: ${input.typography.body_line_height};`,
    "  margin: 5%;",
    "}",
    "h1 {",
    `  font-family: ${input.typography.chapter_title_font}, serif;`,
    `  font-size: ${input.typography.chapter_title_size}pt;`,
    "  margin-top: 3em;",
    "  margin-bottom: 1em;",
    "}",
    "p {",
    `  text-indent: ${input.typography.paragraph_indent * 2}px;`,
    "  margin: 0 0 0.9em 0;",
    "}",
    "nav ol { padding-left: 1.2rem; }",
    "nav li { margin-bottom: 0.4rem; }",
  ].join("\n");

  const titlePage = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escapeXml(input.language)}">
  <head>
    <title>${escapeXml(input.metadata.optimized_title)}</title>
    <link rel="stylesheet" type="text/css" href="styles/book.css"/>
  </head>
  <body>
    <section epub:type="titlepage">
      <h1>${escapeXml(input.metadata.optimized_title)}</h1>
      ${
        input.metadata.subtitle
          ? `<p>${escapeXml(input.metadata.subtitle)}</p>`
          : ""
      }
      <p>${escapeXml(input.author)}</p>
    </section>
  </body>
</html>`;

  const nav = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escapeXml(input.language)}">
  <head>
    <title>Contents</title>
    <link rel="stylesheet" type="text/css" href="styles/book.css"/>
  </head>
  <body>
    <nav epub:type="toc" id="toc">
      <h1>Contenido</h1>
      <ol>
        ${input.chapters
          .map(
            (chapter) =>
              `<li><a href="text/${escapeXml(chapter.anchor)}.xhtml">${escapeXml(chapter.title)}</a></li>`
          )
          .join("")}
      </ol>
    </nav>
  </body>
</html>`;

  const chapterFiles = input.chapters.map((chapter) => ({
    name: `OEBPS/text/${chapter.anchor}.xhtml`,
    id: chapter.anchor,
    data: Buffer.from(
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${escapeXml(input.language)}">
  <head>
    <title>${escapeXml(chapter.title)}</title>
    <link rel="stylesheet" type="text/css" href="../styles/book.css"/>
  </head>
  <body>
    <section id="${escapeXml(chapter.anchor)}">
      <h1>${escapeXml(chapter.title)}</h1>
      ${toXhtmlParagraphs(chapter.text).join("\n      ")}
    </section>
  </body>
</html>`,
      "utf8"
    ),
  }));

  const manifestItems = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="titlepage" href="text/titlepage.xhtml" media-type="application/xhtml+xml"/>`,
    `<item id="css" href="styles/book.css" media-type="text/css"/>`,
    ...chapterFiles.map(
      (file) =>
        `<item id="${escapeXml(file.id)}" href="text/${escapeXml(file.id)}.xhtml" media-type="application/xhtml+xml"/>`
    ),
  ];

  let coverImageEntry: ZipEntry | null = null;
  if (input.coverImageBuffer) {
    coverImageEntry = {
      name: "OEBPS/images/cover.png",
      data: input.coverImageBuffer,
    };
    manifestItems.push(
      `<item id="cover-image" href="images/cover.png" media-type="image/png" properties="cover-image"/>`
    );
  }

  const spineItems = [
    `<itemref idref="titlepage"/>`,
    ...chapterFiles.map((file) => `<itemref idref="${escapeXml(file.id)}"/>`),
  ];

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" xml:lang="${escapeXml(input.language)}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(input.metadata.optimized_title)}</dc:title>
    <dc:creator>${escapeXml(input.author)}</dc:creator>
    <dc:language>${escapeXml(input.language)}</dc:language>
    <dc:description>${escapeXml(input.metadata.book_description)}</dc:description>
    ${input.metadata.categories
      .map((category) => `<dc:subject>${escapeXml(category)}</dc:subject>`)
      .join("\n    ")}
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
    ${spineItems.join("\n    ")}
  </spine>
</package>`;

  const entries: ZipEntry[] = [
    {
      name: "mimetype",
      data: Buffer.from("application/epub+zip", "utf8"),
      store: true,
    },
    {
      name: "META-INF/container.xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
        "utf8"
      ),
    },
    {
      name: "OEBPS/styles/book.css",
      data: Buffer.from(styleSheet, "utf8"),
    },
    {
      name: "OEBPS/nav.xhtml",
      data: Buffer.from(nav, "utf8"),
    },
    {
      name: "OEBPS/text/titlepage.xhtml",
      data: Buffer.from(titlePage, "utf8"),
    },
    {
      name: "OEBPS/content.opf",
      data: Buffer.from(contentOpf, "utf8"),
    },
    ...chapterFiles,
  ];

  if (coverImageEntry) {
    entries.push(coverImageEntry);
  }

  return buildZip(entries);
}
