const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const saveButton = document.getElementById("save");
const durationSelect = document.getElementById("duration");
const status = document.getElementById("status");
let stream;
let context;
let processor;
let sink;
let chunks = [];
let totalSamples = 0;
let sampleRate = 0;
let timer;

function setStatus(message) { status.textContent = message; }
function updateButtons() {
    const active = !!stream;
    startButton.disabled = active;
    stopButton.disabled = !active;
    durationSelect.disabled = !active;
    const seconds = Number(durationSelect.value);
    saveButton.disabled = !active || totalSamples < sampleRate * seconds;
    if (active) setStatus(`Capturando áudio: ${Math.floor(totalSamples / sampleRate)} s na memória (máximo: 120 s).`);
}
function stopCapture() {
    clearInterval(timer);
    if (stream) stream.getTracks().forEach(track => track.stop());
    processor?.disconnect();
    sink?.disconnect();
    context?.close();
    stream = undefined;
    context = undefined;
    processor = undefined;
    sink = undefined;
    chunks = [];
    totalSamples = 0;
    sampleRate = 0;
    updateButtons();
    setStatus("Captura desligada. Os segundos em memória foram descartados.");
}
async function startCapture() {
    try {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (!stream.getAudioTracks().length) throw new Error("O sistema não disponibilizou áudio para captura.");
        context = new AudioContext();
        await context.resume();
        sampleRate = context.sampleRate;
        const source = context.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
        processor = context.createScriptProcessor(4096, 1, 1);
        sink = context.createGain();
        sink.gain.value = 0;
        source.connect(processor);
        processor.connect(sink);
        sink.connect(context.destination);
        processor.onaudioprocess = event => {
            const input = event.inputBuffer.getChannelData(0);
            const samples = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
                const value = Math.max(-1, Math.min(1, input[i]));
                samples[i] = value < 0 ? value * 32768 : value * 32767;
            }
            chunks.push(samples);
            totalSamples += samples.length;
            const maximum = sampleRate * 120;
            while (totalSamples - chunks[0].length >= maximum) totalSamples -= chunks.shift().length;
        };
        stream.getAudioTracks()[0].addEventListener("ended", stopCapture, { once: true });
        timer = setInterval(updateButtons, 500);
        updateButtons();
    } catch (error) {
        stopCapture();
        setStatus(error?.message || "Não foi possível iniciar a captura.");
    }
}
function createWav(seconds) {
    const count = Math.min(totalSamples, Math.floor(seconds * sampleRate));
    const wav = new Uint8Array(44 + count * 2);
    const view = new DataView(wav.buffer);
    function text(offset, value) { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); }
    text(0, "RIFF"); view.setUint32(4, 36 + count * 2, true); text(8, "WAVE"); text(12, "fmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, count * 2, true);
    let skip = totalSamples - count;
    let offset = 44;
    for (const chunk of chunks) {
        if (skip >= chunk.length) { skip -= chunk.length; continue; }
        for (let i = skip; i < chunk.length; i++, offset += 2) view.setInt16(offset, chunk[i], true);
        skip = 0;
    }
    return wav;
}
async function saveClip() {
    const seconds = Number(durationSelect.value);
    if (!stream || totalSamples < sampleRate * seconds) return;
    saveButton.disabled = true;
    try {
        const saved = await window.SeCordClips.save(createWav(seconds), seconds);
        setStatus(saved ? `Clipe de ${seconds} s salvo.` : "Salvamento cancelado. A captura continua.");
    } catch (error) {
        setStatus(error?.message || "Não foi possível salvar o clipe.");
    }
    updateButtons();
}
startButton.addEventListener("click", startCapture);
stopButton.addEventListener("click", stopCapture);
saveButton.addEventListener("click", saveClip);
durationSelect.addEventListener("change", updateButtons);
window.addEventListener("pagehide", stopCapture);
