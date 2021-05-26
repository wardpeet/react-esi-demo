// import { unstable_getCacheForType } from "react";
import * as React from "react";
import ReactDOMfizz from "react-dom/unstable-fizz.js";
import { mkdirSync, createWriteStream } from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import objectHash from "node-object-hash";

const ESI_PATH = path.join(process.cwd(), `public`, `.esi`);

try {
  mkdirSync(ESI_PATH);
} catch (err) {}

const hasher = objectHash({
  coerce: false,
  alg: `md5`,
  enc: `hex`,
  sort: {
    map: true,
    object: true,
    array: false,
    set: false,
  },
});

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

let globalMap = new Map();
function createReadFileMap() {
  return globalMap;
}

function readRecord(record) {
  if (record.status === Resolved) {
    return record;
  } else {
    throw record.value;
  }
}

function createRecordFromThenable(thenable) {
  const record = {
    status: Pending,
    value: thenable,
    cache: null,
  };

  thenable.then(
    (value) => {
      if (record.status === Pending) {
        record.status = Resolved;
        record.value = value;
      }
    },
    (err) => {
      if (record.status === Pending) {
        record.status = Rejected;
        record.value = err;
      }
    }
  );

  return record;
}

async function generateHTML(hash, component, exportedName, props) {
  const esiTag = React.createElement("esi:include", {
    src: `/.esi/${hash}.html`,
  });

  const fragmentPath = path.join(ESI_PATH, `${hash}.html`);
  let fileExists = false;
  try {
    await fs.access(fragmentPath);
    fileExists = true;
  } catch (err) {}

  if (fileExists) {
    return esiTag;
  }

  const writeStream = createWriteStream(fragmentPath);
  const mod = await import(component);
  const Component = mod[exportedName];

  return new Promise((resolve, reject) => {
    writeStream
      .on("error", (err) => reject(err))
      .on("finish ", () => {
        resolve(esiTag);
      });

    const RC = React.createElement(Component, props);

    // My guess is that this will become pipeToNodeWritable from Flight to render a Server Render tree,
    // so we can also leverage it on client navigations?
    const { startWriting } = ReactDOMfizz.pipeToNodeWritable(RC, writeStream, {
      onReadyToStream() {
        writeStream.write(`<!DOCTYPE html>`);
      },
      onCompleteAll: () => {
        startWriting();
      },
      onError(...args) {
        reject(args);
      },
    });
  });
}

export function readFragment(component, exportedName, props) {
  // unstable_getCacheForType is not yet implemented
  // const map = unstable_getCacheForType(createReadFileMap());
  const map = createReadFileMap();

  const hash = hasher.hash({ component, props });
  let record = map.get(hash);
  if (!record) {
    record = createRecordFromThenable(
      generateHTML(hash, component, exportedName, props)
    );
    map.set(hash, record);
  }

  const resolvedRecord = readRecord(record);
  return resolvedRecord.value;
}
