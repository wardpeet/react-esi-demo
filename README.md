# Gatsby - ESI DEMO

This is a simple demo to show capabilities on the server with ESI technology. It doesn't support the client-side piece yet as it's not super important in this first draft.

## How to run it

1. Install node-modules - Run `yarn`
2. Run the server by running `yarn start` it will open a server on port 4000. You can use `process.env.PORT` to change the default port.
3. Visit http://localhost:4000 and see a full html being generated

You can create new pages by adding new pages inside the `src/pages` directory (You'll need to restart the server). It will generate html files in the public directory and esi fragments inside the public/.esi directory.

## Implementation

I've implemented a simple react-fragment loader (apis are still experimental. I copied it from react-fs).
Our react-fragment loader would generate a react server tree (server components) and save that to disk. Can we use that tree and render HTML on the server so we don't need two copies? This React Server Tree would help with client-side navigations as we can store it on disk.

In the current implementation, I use fizz renderer to render the HTML. The idea is to generate a React Server Tree instead and render HTML from that tree in the ESI fragment.

```js
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
```

Is there a better way to get the suspense chunks than using react-fragment loader? (unsure what a proper name is for these react-fs, react-pg, ... components).
