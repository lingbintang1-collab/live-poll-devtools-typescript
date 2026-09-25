import { createServer } from "node:http";
import { InfraiClient, InfraiError } from "./infrai_client.ts";
import { openPoll } from "./poll_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const client = new InfraiClient(key);

createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/polls") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const result = await openPoll(JSON.parse(Buffer.concat(chunks).toString("utf8")), client);
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true, data: result }));
  } catch (error) {
    const status = error instanceof InfraiError && error.status < 500 ? error.status : 500;
    res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed" }));
  }
}).listen(Number(process.env.PORT ?? 3000));
