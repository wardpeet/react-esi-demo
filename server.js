import * as path from "path";
import * as fs from "fs";
import polka from "polka";
import { pipeline } from "stream";
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

    pipeline(
      fs.createReadStream(filePath),
      async function* (source) {
        source.setEncoding("utf8"); // Work with strings rather than `Buffer`s.

        for await (const chunk of source) {
          try {
            let newChunk = chunk;
            for (const match of chunk.matchAll(REGEX_ESI)) {
              newChunk = newChunk.replace(
                match[0],
                (await got(`http://localhost:${PORT}${match[1]}`)).body.replace(
                  "<!DOCTYPE html>",
                  ""
                )
              );
            }

            yield newChunk;
          } catch (err) {
            console.log({ err });
          }
        }
      },
      res
    );
  })
  .listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Running on localhost:${PORT}`);
  });
