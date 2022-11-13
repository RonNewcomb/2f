import type { IncomingMessage, ServerResponse } from "http";
import * as http from "http";
import * as fs from "fs/promises";

const server = http.createServer(requestListener);

server.on("error", err => console.log(err.name, err.message));
server.listen(7777, "localhost", () => console.log(`http://localhost:7777`));

async function requestListener(request: IncomingMessage, response: ServerResponse): Promise<any> {
  switch (request.method) {
    case "GET": {
      let url = (request.url || "/").split("/").join("\\");
      let path = __dirname + "\\.build" + url;
      if (path.endsWith("\\")) path = path + "index.html";
      response.setHeader("Content-Type", getContentType(path));
      const stream = await fs.readFile(path).catch(_ => undefined);
      if (stream) return response.end(stream);
      console.log({ fileNotFound: path });
      response.statusCode = 404;
      response.end(JSON.stringify({ fileNotFound: path }));
      return;
    }
    default: {
      response.setHeader("Content-Type", "text/html");
      response.writeHead(200);
      response.end(`<html><body><h1>Method not available</h1></body></html>`);
    }
  }
}

const Ext2Ct: Record<string, string> = {
  js: "application/javascript",
  json: "application/json",
  html: "text/html",
};

function getContentType(path: string): string {
  const pieces = path.split(".");
  const ext = pieces[pieces.length - 1];
  return Ext2Ct[ext] || "text/plain";
}
