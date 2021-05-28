import * as fs from "fs";
import * as path from "path";
import * as React from "react";
import ReactDOMfizz from "react-dom/unstable-fizz.js";
import globby from "globby";

if (process.argv.includes("--esi")) {
  console.log(`RUNNING with ESI-support`);
}

try {
  fs.mkdirSync(path.join(process.cwd(), "public"));
} catch (err) {}

(async () => {
  const pages = await globby(["./src/pages/*.js"]);

  const promises = pages.map((page) => {
    const Page = require(page).default;

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(
        "./public/" + page.replace("./src/pages/", "").replace(".js", ".html")
      );

      writeStream.on("finish", () => {
        resolve();
      });
      writeStream.on("error", (err) => {
        reject(err);
      });

      const { startWriting } = ReactDOMfizz.pipeToNodeWritable(
        <html>
          <head></head>
          <body>
            <Page />
          </body>
        </html>,
        writeStream,
        {
          onReadyToStream() {
            writeStream.write(`<!DOCTYPE html>`);
          },
          onCompleteAll: () => {
            startWriting();
          },
          onError(err) {
            reject(err);
          },
        }
      );
    });
  });

  await Promise.all(promises).catch((err) => {
    console.log(err);
  });
})();
