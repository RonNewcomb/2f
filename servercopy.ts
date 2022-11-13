import { createServer, IncomingMessage, ServerResponse } from "http";
import * as fs from "fs/promises";

const server = createServer(requestListener);

server.on("error", err => console.log(err.name, err.message));
server.listen(7777, "localhost", () => console.log(`http://localhost:7777`));

function requestListener(request: IncomingMessage, response: ServerResponse) {
  switch (request.method) {
    case "GET": {
      const path = request.url || "index.html";
      const stream = fs.readFile(new URL(path).pathname);
      //response.write(stream);
      response.end(stream);
      return;
    }
    default: {
      response.setHeader("Content-Type", "text/html");
      response.writeHead(200);
      response.end(`<html><body><h1>This is HTML</h1></body></html>`);
    }
  }
}
