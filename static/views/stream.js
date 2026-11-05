const byId = id => document.getElementById(id);
const elements = Object.fromEntries(["refresh", "source-count", "sources", "quality", "fps", "audio", "start", "stop", "invite", "copy", "viewers", "join-code", "join", "leave", "video", "video-empty", "server", "status"].map(id => [id, byId(id)]));
const QUALITY = { 480: { width: 854, height: 480, bitrate: 1_500_000 }, 720: { width: 1280, height: 720, bitrate: 3_000_000 }, 1080: { width: 1920, height: 1080, bitrate: 5_000_000 } };
const ROOM_PATTERN = /^[a-f0-9]{32}$/;
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

let selectedId = null;
let socket = null;
let capture = null;
let role = null;
let roomId = null;
let heartbeat = null;
const peers = new Map();
const pendingIce = new Map();

function status(message) { elements.status.textContent = message; }
function send(message) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)); }
function updateViewers() {
    const count = peers.size;
    elements.viewers.textContent = count === 0 ? "Nenhum espectador conectado." : `${count} ${count === 1 ? "espectador conectado" : "espectadores conectados"}.`;
}
function updateControls() {
    const active = role !== null;
    elements.start.disabled = active || !selectedId;
    elements.stop.disabled = role !== "host";
    elements.join.disabled = active;
    elements.leave.disabled = role !== "viewer";
    elements.copy.disabled = role !== "host" || !elements.invite.value;
    elements.quality.disabled = active;
    elements.fps.disabled = active;
    elements.audio.disabled = active;
    elements.refresh.disabled = active;
    elements.server.disabled = active;
    for (const button of elements.sources.querySelectorAll("button")) button.disabled = active;
}
function endpoint(value) {
    const url = new URL(value.trim());
    if (url.protocol !== "wss:" && !(url.protocol === "ws:" && ["127.0.0.1", "localhost"].includes(url.hostname))) {
        throw new Error("Use WSS para a internet ou WS somente neste computador.");
    }
    if (url.pathname !== "/signal" || url.search || url.hash) throw new Error("O endereço deve terminar em /signal.");
    return url.href;
}
function parseInvite(value) {
    const parts = value.trim().split("|");
    if (parts.length !== 3 || parts[0] !== "SECORD1" || !ROOM_PATTERN.test(parts[2])) {
        throw new Error("Convite inválido. Cole o código completo enviado pelo transmissor.");
    }
    return { server: endpoint(parts[1]), room: parts[2] };
}
function clearPeer(id) {
    peers.get(id)?.close();
    peers.delete(id);
    pendingIce.delete(id);
    updateViewers();
}
function stopSession(message = "Transmissão encerrada.") {
    role = null;
    for (const id of [...peers.keys()]) clearPeer(id);
    capture?.getTracks().forEach(track => track.stop());
    capture = null;
    const oldSocket = socket;
    socket = null;
    clearInterval(heartbeat);
    heartbeat = null;
    oldSocket?.close();
    roomId = null;
    elements.invite.value = "";
    elements.video.srcObject = null;
    elements.video.parentElement.classList.remove("has-video");
    elements.video.muted = false;
    elements.video.load();
    updateControls();
    status(message);
}
async function refreshSources() {
    if (role) return;
    try {
        const sources = await window.SeCordStream.listSources();
        elements.sources.replaceChildren();
        if (!sources.some(source => source.id === selectedId)) selectedId = null;
        for (const source of sources) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "source";
            button.setAttribute("aria-pressed", String(source.id === selectedId));
            const thumbnail = document.createElement("img");
            thumbnail.src = source.thumbnail;
            thumbnail.alt = "";
            const name = document.createElement("span");
            name.textContent = source.name;
            button.append(thumbnail, name);
            button.addEventListener("click", async () => {
                try {
                    await window.SeCordStream.selectSource(source.id);
                    selectedId = source.id;
                    for (const item of elements.sources.querySelectorAll("button")) item.setAttribute("aria-pressed", String(item === button));
                    updateControls();
                    status(`Selecionado: ${source.name}`);
                } catch (error) { status(error.message); }
            });
            elements.sources.append(button);
        }
        elements["source-count"].textContent = `${sources.length} disponíveis`;
        if (!sources.length) status("Nenhuma tela disponível. Confira a permissão de captura do sistema.");
        updateControls();
    } catch (error) { status(`Não foi possível listar as telas: ${error.message}`); }
}
function createPeer(id, asHost) {
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peers.set(id, peer);
    if (!pendingIce.has(id)) pendingIce.set(id, []);
    peer.onicecandidate = event => { if (event.candidate) send({ t: "ice", to: id, data: event.candidate.toJSON() }); };
    peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed") status("A conexão direta falhou nesta rede. Pode ser necessário um servidor TURN.");
        if (peer.connectionState === "connected") status(asHost ? "Espectador conectado à transmissão." : "Assistindo à transmissão.");
    };
    if (asHost) {
        for (const track of capture.getTracks()) {
            const sender = peer.addTrack(track, capture);
            if (track.kind === "video" && sender.getParameters) {
                const parameters = sender.getParameters();
                parameters.encodings ??= [{}];
                parameters.encodings[0].maxBitrate = QUALITY[elements.quality.value].bitrate * (Number(elements.fps.value) / 30);
                sender.setParameters(parameters).catch(() => {});
            }
        }
    } else {
        peer.ontrack = event => {
            elements.video.srcObject = event.streams[0];
            elements.video.parentElement.classList.add("has-video");
            elements.video.play().catch(() => status("Clique no vídeo para iniciar a reprodução."));
        };
    }
    updateViewers();
    return peer;
}
async function applyPendingIce(id) {
    const peer = peers.get(id);
    const candidates = pendingIce.get(id) ?? [];
    pendingIce.set(id, []);
    for (const candidate of candidates) await peer.addIceCandidate(candidate).catch(() => {});
}
async function onSignal(message) {
    if (message.t === "error") { stopSession(message.message || "A sala foi recusada."); return; }
    if (message.t === "created") { status("Sala aberta. Copie o convite para quem vai assistir."); return; }
    if (message.t === "joined") { status("Convite aceito. Esperando o vídeo..."); return; }
    if (message.t === "ended") { stopSession("O transmissor encerrou a sala."); return; }
    if (message.t === "viewer-left") { clearPeer(message.id); return; }
    if (message.t === "viewer-joined" && role === "host" && capture) {
        const peer = createPeer(message.id, true);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        send({ t: "offer", to: message.id, data: { type: offer.type, sdp: offer.sdp } });
        return;
    }
    if (!["offer", "answer", "ice"].includes(message.t) || !message.from || !message.data) return;
    const id = message.from;
    if (role === "viewer" && id !== "host") return;
    if (message.t === "ice") {
        const peer = peers.get(id);
        if (!peer || !peer.remoteDescription) {
            if (!pendingIce.has(id)) pendingIce.set(id, []);
            pendingIce.get(id).push(message.data);
        }
        else await peer.addIceCandidate(message.data).catch(() => {});
        return;
    }
    if (message.t === "offer" && role === "viewer") {
        const peer = peers.get(id) ?? createPeer(id, false);
        await peer.setRemoteDescription(message.data);
        await applyPendingIce(id);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        send({ t: "answer", to: id, data: { type: answer.type, sdp: answer.sdp } });
    } else if (message.t === "answer" && role === "host") {
        const peer = peers.get(id);
        if (!peer) return;
        await peer.setRemoteDescription(message.data);
        await applyPendingIce(id);
    }
}
function connect(server, action) {
    return new Promise((resolve, reject) => {
        const connection = new WebSocket(server);
        let settled = false;
        const fail = message => {
            if (settled) return;
            settled = true;
            connection.close();
            reject(new Error(message));
        };
        connection.onopen = () => {
            connection.send(JSON.stringify(action));
            heartbeat = setInterval(() => { if (connection.readyState === WebSocket.OPEN) connection.send('{"t":"ping"}'); }, 60_000);
        };
        connection.onerror = () => {
            fail("Não foi possível conectar ao servidor de transmissão.");
        };
        connection.onmessage = event => {
            try {
                const message = JSON.parse(event.data);
                if (!settled && message.t === "error") return fail(message.message || "A sala foi recusada.");
                if (!settled && message.t === (action.t === "create" ? "created" : "joined")) {
                    settled = true;
                    resolve(connection);
                }
                Promise.resolve(onSignal(message)).catch(error => status(`Erro no vídeo: ${error.message}`));
            }
            catch { status("Resposta inválida do servidor."); }
        };
        connection.onclose = () => {
            if (!settled) fail("O servidor encerrou a conexão.");
            if (socket === connection && role) stopSession("Conexão com a sala encerrada.");
        };
    });
}
async function startHost() {
    if (!selectedId || role) return;
    try {
        const server = endpoint(elements.server.value);
        localStorage.setItem("secord-stream-server", server);
        roomId = Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, "0")).join("");
        const quality = QUALITY[elements.quality.value];
        capture = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: elements.audio.checked });
        const video = capture.getVideoTracks()[0];
        if (!video) throw new Error("A tela não pôde ser capturada.");
        await video.applyConstraints({ width: { ideal: quality.width }, height: { ideal: quality.height }, frameRate: { ideal: Number(elements.fps.value) } }).catch(() => {});
        video.addEventListener("ended", () => { if (role === "host") stopSession("A captura de tela foi encerrada."); }, { once: true });
        elements.video.srcObject = capture;
        elements.video.muted = true;
        elements.video.parentElement.classList.add("has-video");
        role = "host";
        status("Abrindo sala...");
        updateControls();
        socket = await connect(server, { t: "create", room: roomId });
        elements.invite.value = `SECORD1|${server}|${roomId}`;
        updateControls();
    } catch (error) { stopSession(`Não foi possível iniciar: ${error.message}`); }
}
async function joinRoom() {
    if (role) return;
    try {
        const invite = parseInvite(elements["join-code"].value);
        role = "viewer";
        roomId = invite.room;
        elements.server.value = invite.server;
        localStorage.setItem("secord-stream-server", invite.server);
        status("Entrando na sala...");
        updateControls();
        socket = await connect(invite.server, { t: "join", room: invite.room });
    } catch (error) { stopSession(`Não foi possível assistir: ${error.message}`); }
}

elements.refresh.addEventListener("click", refreshSources);
elements.start.addEventListener("click", startHost);
elements.stop.addEventListener("click", () => stopSession());
elements.join.addEventListener("click", joinRoom);
elements.leave.addEventListener("click", () => stopSession("Você saiu da sala."));
elements.copy.addEventListener("click", async () => {
    try { await window.SeCordStream.copy(elements.invite.value); status("Convite copiado. Envie somente a quem pode assistir."); }
    catch (error) { status(error.message); }
});
window.addEventListener("beforeunload", () => stopSession());
const savedServer = localStorage.getItem("secord-stream-server");
if (savedServer && savedServer !== "ws://127.0.0.1:8787/signal") elements.server.value = savedServer;
refreshSources();
