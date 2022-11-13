import type { IncomingMessage, ServerResponse } from "http";
import * as http from "http";
import * as fs from "fs/promises";
import * as path from "path";
import * as url from "url";

const projectRoot = path.join(__dirname, ".."); // move upword out of /server/
const nodeModulesRoot = path.join(projectRoot, "node_modules");

const extensionToMimetype: Record<string, string> = {
  "": "application/javascript",
  ".js": "application/javascript",
  ".json": "application/json",
  ".html": "text/html",
  ".css": "text/css",
};

const nodeModules: Record<string, string> = {
  "/tsx-dom/jsx-runtime": path.join(nodeModulesRoot, "/tsx-dom/src/jsx-runtime.js"),
};

async function requestsToResponses(request: IncomingMessage, response: ServerResponse): Promise<any> {
  switch (request.method) {
    case "GET": {
      // url path to file path
      const requestUrl = url.parse(request.url || "").pathname || "";
      let filepath = nodeModules[requestUrl] || path.join(projectRoot, ".build", requestUrl);
      if (filepath.endsWith(path.sep)) filepath = filepath + "index.html";

      // extension/mimeType allowed?
      const extension = path.extname(filepath);
      if (!extension) filepath = filepath + ".js"; // because import statements rarely include the .js and the browser is literal
      const mimeType = extensionToMimetype[extension];
      if (!mimeType) return response.writeHead(405).end(Object.keys(extensionToMimetype).join());

      // read file
      const stream = await fs.readFile(filepath).catch(console.log);
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
  .on("error", err => console.log({ err }))
  .listen(7777, "localhost", () => console.log(`http://localhost:7777`));
