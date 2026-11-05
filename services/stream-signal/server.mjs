import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket, WebSocketServer } from "ws";

const MAX_VIEWERS = 4;
const MAX_MESSAGE_BYTES = 256_000;
const ROOM_ID = /^[a-f0-9]{32}$/;
const SIGNAL_TYPES = new Set(["offer", "answer", "ice"]);

export function createSignalServer({ host = "127.0.0.1", port = 8787 } = {}) {
    const rooms = new Map();
    const http = createServer((request, response) => {
        if (request.url !== "/health") {
            response.writeHead(404).end();
            return;
        }
        response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
        response.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    });
    const sockets = new WebSocketServer({ server: http, path: "/signal", maxPayload: MAX_MESSAGE_BYTES });

    function send(socket, message) {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    }

    sockets.on("connection", socket => {
        let membership;
        socket.on("message", raw => {
            let message;
            try { message = JSON.parse(raw.toString()); } catch { send(socket, { t: "error", message: "Mensagem inválida." }); return; }
            if (!message || typeof message !== "object" || typeof message.t !== "string") return;
            if (message.t === "ping" && membership) { send(socket, { t: "pong" }); return; }

            if (!membership && (message.t === "create" || message.t === "join")) {
                if (!ROOM_ID.test(message.room ?? "")) { send(socket, { t: "error", message: "Código de sala inválido." }); return; }
                if (message.t === "create") {
                    if (rooms.has(message.room)) { send(socket, { t: "error", message: "Sala já existe." }); return; }
                    membership = { room: message.room, role: "host", id: "host" };
                    rooms.set(message.room, { host: socket, viewers: new Map() });
                    send(socket, { t: "created", room: message.room });
                } else {
                    const room = rooms.get(message.room);
                    if (!room || room.viewers.size >= MAX_VIEWERS) { send(socket, { t: "error", message: "Sala indisponível ou cheia." }); return; }
                    const id = randomUUID();
                    membership = { room: message.room, role: "viewer", id };
                    room.viewers.set(id, socket);
                    send(socket, { t: "joined", id });
                    send(room.host, { t: "viewer-joined", id });
                }
                return;
            }

            if (!membership || !SIGNAL_TYPES.has(message.t)) return;
            if (!message.data || typeof message.data !== "object" || Array.isArray(message.data)) return;
            const room = rooms.get(membership.room);
            if (!room) return;
            if (membership.role === "host" && typeof message.to === "string" && room.viewers.has(message.to)) {
                send(room.viewers.get(message.to), { t: message.t, from: "host", data: message.data });
            } else if (membership.role === "viewer" && message.to === "host") {
                send(room.host, { t: message.t, from: membership.id, data: message.data });
            }
        });
        socket.on("close", () => {
            if (!membership) return;
            const room = rooms.get(membership.room);
            if (!room) return;
            if (membership.role === "host") {
                rooms.delete(membership.room);
                for (const viewer of room.viewers.values()) { send(viewer, { t: "ended" }); viewer.close(); }
            } else {
                room.viewers.delete(membership.id);
                send(room.host, { t: "viewer-left", id: membership.id });
            }
        });
    });

    return {
        listen: () => new Promise(resolve => http.listen(port, host, () => resolve(http.address()))),
        close: () => new Promise(resolve => {
            for (const socket of sockets.clients) socket.terminate();
            sockets.close();
            http.close(resolve);
        })
    };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    const host = process.env.HOST || "0.0.0.0";
    const port = Number(process.env.PORT || 8787);
    createSignalServer({ host, port }).listen().then(() => console.log(`SeCord signal listening on ${host}:${port}`));
}
