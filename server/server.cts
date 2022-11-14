import type { IncomingMessage, ServerResponse } from "http";
import * as http from "http";
import * as fsAsync from "fs/promises";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";

const projectRoot = path.join(__dirname, ".."); // move upward out of /server/
const npmRoot = path.join(projectRoot, "node_modules");
const buildRoot = path.join(projectRoot, ".build");
const assetsRoot = path.join(projectRoot, "assets");
const assets = fs.readdirSync(assetsRoot).map(filename => path.sep + filename);

const extensionToMimetype: Record<string, string> = {
  "": "application/javascript",
  ".js": "application/javascript",
  ".json": "application/json",
  ".html": "text/html",
  ".css": "text/css",
};

const nodeModules: Record<string, string> = {
  "/tsx-dom/jsx-runtime": path.join(npmRoot, "/tsx-dom/src/jsx-runtime.js"),
  "/node_modules/tsx-dom/src/index": path.join(npmRoot, "/tsx-dom/src/index.js"),
};

async function requestsToResponses(request: IncomingMessage, response: ServerResponse): Promise<any> {
  switch (request.method) {
    case "GET": {
      // url path to file path
      const requestUrl = url.parse(request.url || "").pathname || "";
      console.log({ requestUrl });
      let filepath = path.join(nodeModules[requestUrl] || requestUrl); // also flips / to \ for windows
      if (filepath.endsWith(path.sep)) filepath = filepath + "index.html";

      // extension/mimeType allowed?
      const extension = path.extname(filepath);
      if (!extension) filepath = filepath + ".js"; // because import statements rarely include the .js and the browser is literal
      const mimeType = extensionToMimetype[extension];
      if (!mimeType) return response.writeHead(405).end(JSON.stringify(extensionToMimetype));

      // choose folder
      const rootFolder = assets.includes(filepath) ? assetsRoot : buildRoot;
      filepath = path.join(rootFolder, filepath);

      // read file
      const stream = await fsAsync.readFile(filepath).catch(console.log);
      if (!stream) return response.writeHead(404).end(filepath);
      return response.writeHead(200, { "Content-Type": mimeType }).end(stream);
    }
    default: {
      return response.writeHead(405).end("GET");
    }
  }
}

http
  .createServer(requestsToResponses)
  .on("error", console.error)
  .listen(7777, "localhost", () => console.log(`http://localhost:7777`));
