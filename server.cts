import type { IncomingMessage, ServerResponse } from "http";
import * as http from "http";
import * as fs from "fs/promises";

const server = http.createServer(requestListener);

server.on("error", err => console.log(err.name, err.message));
server.listen(7777, "localhost", () => console.log(`http://localhost:7777`));

async function requestListener(request: IncomingMessage, response: ServerResponse): Promise<any> {
  switch (request.method) {
    case "GET": {
      let path = __dirname + "/.build" + (request.url || "/");
      if (path.endsWith("/")) path = path + "index.html";
      path = path.split("/").join("\\"); // Windows!
      const stream = await fs.readFile(path).catch(_ => undefined);
      if (stream) return response.writeHead(200, { "Content-Type": getContentType(path) }).end(stream);
      console.log({ 404: path });
      return response.writeHead(404).end(path);
    }
    default: {
      return response.writeHead(405, { "Content-Type": "text/html" }).end(`<html><body><h1>Method not allowed</h1></body></html>`);
    }
  }
}

const Ext2Ct: Record<string, string> = {
  js: "application/javascript",
  json: "application/json",
  html: "text/html",
  css: "text/css",
};

function getContentType(path: string): string {
  const pieces = path.split(".");
  const ext = pieces[pieces.length - 1];
  return Ext2Ct[ext] || "text/plain";
}
