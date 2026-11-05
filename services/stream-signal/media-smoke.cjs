const { app, BrowserWindow, ipcMain } = require("electron");
const { join } = require("node:path");

async function main() {
    const { createSignalServer } = await import("./server.mjs");
    const signal = createSignalServer({ port: 0 });
    const address = await signal.listen();
    const url = `ws://127.0.0.1:${address.port}/signal`;
    const room = "0123456789abcdef0123456789abcdef";
    const root = join(__dirname, "..", "..");

    const host = new BrowserWindow({ show: false, webPreferences: { backgroundThrottling: false } });
    await host.loadURL("data:text/html,<html><body></body></html>");
    await host.webContents.executeJavaScript(`new Promise((resolve, reject) => {
        const socket = new WebSocket(${JSON.stringify(url)});
        const canvas = document.createElement("canvas");
        canvas.width = 160;
        canvas.height = 90;
        document.body.append(canvas);
        const context = canvas.getContext("2d");
        let frame = 0;
        setInterval(() => {
            context.fillStyle = frame++ % 2 ? "#c33" : "#33c";
            context.fillRect(0, 0, 160, 90);
        }, 100);
        const stream = canvas.captureStream(5);
        const peers = new Map();
        socket.onerror = () => reject(new Error("Host socket failed"));
        socket.onopen = () => socket.send(JSON.stringify({t:"create",room:${JSON.stringify(room)}}));
        socket.onmessage = async event => {
            const message = JSON.parse(event.data);
            if (message.t === "created") return resolve(true);
            if (message.t === "viewer-joined") {
                const peer = new RTCPeerConnection({iceServers:[]});
                peers.set(message.id,peer);
                stream.getTracks().forEach(track => peer.addTrack(track,stream));
                peer.onicecandidate = event => {
                    if(event.candidate) socket.send(JSON.stringify({t:"ice",to:message.id,data:event.candidate.toJSON()}));
                };
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socket.send(JSON.stringify({t:"offer",to:message.id,data:{type:offer.type,sdp:offer.sdp}}));
            } else if (message.t === "answer") {
                await peers.get(message.from)?.setRemoteDescription(message.data);
            } else if (message.t === "ice") {
                await peers.get(message.from)?.addIceCandidate(message.data).catch(() => {});
            }
        };
    })`);

    ipcMain.handle("secord:stream:sources", () => []);
    ipcMain.handle("secord:stream:select", () => {});
    ipcMain.handle("secord:stream:copy", () => {});
    const viewer = new BrowserWindow({
        show: false,
        webPreferences: { preload: join(root, "dist", "js", "streamPreload.js"), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
    });
    await viewer.loadFile(join(root, "static", "views", "stream.html"));
    const result = await viewer.webContents.executeJavaScript(`(async () => {
        document.querySelector("#join-code").value = "SECORD1|${url}|${room}";
        document.querySelector("#join").click();
        for (let n=0; n<150; n++) {
            const video = document.querySelector("#video");
            if (video.videoWidth > 0 && video.srcObject?.getVideoTracks().length) {
                return {width:video.videoWidth,height:video.videoHeight,status:document.querySelector("#status").textContent};
            }
            await new Promise(resolve => setTimeout(resolve,20));
        }
        throw new Error("Viewer received no video: " + document.querySelector("#status").textContent);
    })()`);
    console.log(JSON.stringify(result));
    viewer.close();
    host.close();
    await signal.close();
    app.quit();
}

app.whenReady().then(main).catch(error => { console.error(error); app.exit(1); });
