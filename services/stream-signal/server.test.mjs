import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, test } from "node:test";
import { WebSocket } from "ws";

import { createSignalServer } from "./server.mjs";

const roomId = "0123456789abcdef0123456789abcdef";
const service = createSignalServer({ port: 0 });
let address;
const clients = [];

before(async () => { address = await service.listen(); });
after(async () => { for (const client of clients) client.terminate(); await service.close(); });

async function connect() {
    const client = new WebSocket(`ws://127.0.0.1:${address.port}/signal`);
    clients.push(client);
    await once(client, "open");
    return client;
}

function next(client) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timed out waiting for signal")), 1000);
        client.once("message", raw => { clearTimeout(timeout); resolve(JSON.parse(raw.toString())); });
    });
}

test("creates a private room, relays offers and answers, and closes viewers with the host", async () => {
    const host = await connect();
    const created = next(host);
    host.send(JSON.stringify({ t: "create", room: roomId }));
    assert.deepEqual(await created, { t: "created", room: roomId });

    const viewer = await connect();
    const joined = next(viewer);
    const announced = next(host);
    viewer.send(JSON.stringify({ t: "join", room: roomId }));
    const viewerId = (await joined).id;
    assert.match(viewerId, /^[a-f0-9-]{36}$/);
    assert.deepEqual(await announced, { t: "viewer-joined", id: viewerId });

    const offer = next(viewer);
    host.send(JSON.stringify({ t: "offer", to: viewerId, data: { type: "offer", sdp: "sample" } }));
    assert.deepEqual(await offer, { t: "offer", from: "host", data: { type: "offer", sdp: "sample" } });
    const answer = next(host);
    viewer.send(JSON.stringify({ t: "answer", to: "host", data: { type: "answer", sdp: "sample" } }));
    assert.deepEqual(await answer, { t: "answer", from: viewerId, data: { type: "answer", sdp: "sample" } });

    const ended = next(viewer);
    host.close();
    assert.deepEqual(await ended, { t: "ended" });
});

test("rejects invalid and unknown room codes", async () => {
    const invalid = await connect();
    const invalidReply = next(invalid);
    invalid.send(JSON.stringify({ t: "join", room: "short" }));
    assert.equal((await invalidReply).t, "error");

    const unknown = await connect();
    const unknownReply = next(unknown);
    unknown.send(JSON.stringify({ t: "join", room: "ffffffffffffffffffffffffffffffff" }));
    assert.equal((await unknownReply).t, "error");
});
