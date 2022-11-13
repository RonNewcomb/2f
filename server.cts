import type { IncomingMessage, ServerResponse } from "http";
import * as http from "http";
import * as fs from "fs/promises";

const server = http
  .createServer(requestListener)
  .on("error", err => console.log({ err }))
  .listen(7777, "localhost", () => console.log(`http://localhost:7777`));

const extension2Mime: Record<string, string> = {
  js: "application/javascript",
  json: "application/json",
  html: "text/html",
  css: "text/css",
};

const nodeFiles: Record<string, string> = {
  "/tsx-dom/jsx-runtime": __dirname + "/node_modules/tsx-dom/src/jsx-runtime.js",
};

async function requestListener(request: IncomingMessage, response: ServerResponse): Promise<any> {
  switch (request.method) {
    case "GET": {
      const url = request.url || "/";
      let path = nodeFiles[url] || __dirname + "/.build" + url;
      if (path.endsWith("/")) path = path + "index.html";
      path = path.split("/").join("\\"); // Windows!

      // 405 method not allowed -> extension / mimeType allowed
      const extension = path.split(".").pop() || "";
      const mimeType = extension2Mime[extension];
      if (!extension || !mimeType) return response.writeHead(405).end(Object.keys(extension2Mime).join());

      // read file
      const stream = await fs.readFile(path).catch(console.log);
      if (stream) return response.writeHead(200, { "Content-Type": mimeType }).end(stream);

      // 404
      console.log({ 404: path, url });
      return response.writeHead(404).end(path);
    }
    default: {
      return response.writeHead(405, { "Content-Type": "text/html" }).end(`<html><body><h1>Method not allowed</h1></body></html>`);
    }
  }
}
