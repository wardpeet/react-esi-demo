import * as path from "path";
import * as fs from "fs";
import polka from "polka";
import { pipeline, Transform } from "stream";
import got from "got";

const PORT = process.env.PORT || 4000;
const publicPath = path.join(process.cwd(), "./public");

const REGEX_ESI = /<esi:include src="([^"]+).*<\/esi:include>/g;

polka()
  .use((req, res, next) => {
    let browserPath = req.path;
    if (browserPath === "/") {
      browserPath = "/index";
    }

    if (!browserPath.endsWith(".html")) {
      browserPath += ".html";
    }

    const filePath = path.join(publicPath, browserPath);
    if (!fs.existsSync(filePath)) {
      return next();
    }

    const esiToHTML = new Transform({
      transform: async function (chunk, encoding, next) {
        const strChunk = chunk.toString();

        let newChunk = strChunk;
        for (const match of strChunk.matchAll(REGEX_ESI)) {
          newChunk = newChunk.replace(
            match[0],
            (await got(`http://localhost:${PORT}${match[1]}`)).body.replace(
              "<!DOCTYPE html>",
              ""
            )
          );
        }
        this.push(newChunk);

        next();
      },
    });

    pipeline(fs.createReadStream(filePath), esiToHTML, res, (err) => {
      if (err) {
        res.statusCode = 500;
        res.end(err);
      }
    });
  })
  .listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Running on localhost:${PORT}`);
  });
