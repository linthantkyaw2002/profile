// Face Attendance miniature. Face DETECTION only — no identity recognition.
// MediaPipe is loaded on demand. Video is processed in the visitor's browser.
// Recorded entries exist only for the lifetime of this open demo window.
const MEDIAPIPE_VERSION = "0.10.21";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

export function createFaceDemo({ container, backToShell }) {
    container.innerHTML = `
        <div class="face-demo">
            <div class="face-demo-heading">
                <div><span class="face-eyebrow">COMPUTER VISION / LIVE MINIATURE</span>
                    <h2>Face Attendance <span>· Demo</span></h2></div>
                <button class="face-back" type="button" id="face-back">← Minishell</button>
            </div>
            <p class="face-disclaimer">Self-reported name + face tracking. This does <strong>not</strong> identify or authenticate anyone.</p>
            <div class="face-demo-layout">
                <div class="face-left">
                    <div class="face-camera-stage" id="face-stage">
                        <video id="face-video" playsinline autoplay muted aria-label="Live camera view"></video>
                        <div class="face-id-box" id="face-id-box" hidden>
                            <span class="face-name-tag" id="face-name-tag">Visitor</span>
                        </div>
                        <div class="face-camera-idle" id="face-idle">
                            <span class="face-camera-glyph" aria-hidden="true">◎</span>
                            <strong>Camera is off</strong>
                            <span>Enter a name, then enable your camera</span>
                        </div>
                        <span class="face-camera-label" id="face-camera-label">CAMERA OFF</span>
                    </div>
                    <div class="face-live-info" id="face-status" role="status" aria-live="polite">Video stays on this device. No photos are saved.</div>
                    <p class="face-privacy">Camera starts only when you allow it. Stop Camera or close this demo to end the stream. The model loads from an external CDN.</p>
                </div>
                <div class="face-side">
                    <label for="face-visitor-name" class="face-field-label">DISPLAY NAME</label>
                    <input id="face-visitor-name" class="face-name-input" type="text" maxlength="40" autocomplete="off" placeholder="Enter your name" />
                    <div class="face-actions">
                        <button type="button" class="my-button face-main-btn" id="face-enable">Enable Camera ↗</button>
                        <button type="button" class="face-secondary-btn" id="face-stop" disabled>Stop Camera</button>
                        <button type="button" class="my-button face-main-btn face-record-btn" id="face-record" disabled>Record Attendance ↗</button>
                    </div>
                    <div class="face-session-heading">THIS SESSION <span id="face-count">0 entries</span></div>
                    <div class="face-log" id="face-log" aria-live="polite"><span>No attendance recorded yet.</span></div>
                </div>
            </div>
        </div>`;

    const video = container.querySelector("#face-video");
    const stage = container.querySelector("#face-stage");
    const box = container.querySelector("#face-id-box");
    const label = container.querySelector("#face-name-tag");
    const placeholder = container.querySelector("#face-idle");
    const cameraLabel = container.querySelector("#face-camera-label");
    const status = container.querySelector("#face-status");
    const nameInput = container.querySelector("#face-visitor-name");
    const enable = container.querySelector("#face-enable");
    const stopButton = container.querySelector("#face-stop");
    const record = container.querySelector("#face-record");
    const log = container.querySelector("#face-log");
    const count = container.querySelector("#face-count");
    const back = container.querySelector("#face-back");

    let stream = null;
    let detector = null;
    let destroyed = false;
    let loading = false;
    let requestId = 0;
    let raf = 0;
    let lastDetectionAt = 0;
    let lastVideoTime = -1;
    let lastFaceAt = -Infinity;
    let faceCount = 0;
    let currentBounds = null;
    const records = [];
    const MAX_RECORDS = 8;

    const setStatus = message => { status.textContent = message; };
    const visitorName = () => nameInput.value.trim().replace(/\s+/g, " ");

    function updateRecordButton() {
        const recent = performance.now() - lastFaceAt < 850;
        record.disabled = !stream || !detector || !visitorName() || faceCount !== 1 || !recent || records.length >= MAX_RECORDS;
    }

    function updateBox() {
        if (!currentBounds || video.readyState < 2) { box.hidden = true; return; }
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        if (!width || !height) return;
        // Both video and box use object-fit: cover. Mirror the x-coordinate because
        // the front camera preview is mirrored for a natural visitor experience.
        const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
        const offsetX = (width - video.videoWidth * scale) / 2;
        const offsetY = (height - video.videoHeight * scale) / 2;
        const { originX, originY, width: faceWidth, height: faceHeight } = currentBounds;
        const left = width - (offsetX + (originX + faceWidth) * scale);
        const top = offsetY + originY * scale;
        box.style.left = `${Math.max(0, Math.min(width, left))}px`;
        box.style.top = `${Math.max(0, Math.min(height, top))}px`;
        box.style.width = `${Math.max(0, Math.min(width - Math.max(0, left), faceWidth * scale))}px`;
        box.style.height = `${Math.max(0, Math.min(height - Math.max(0, top), faceHeight * scale))}px`;
        label.textContent = visitorName() || "Visitor";
        box.hidden = false;
    }

    function detectFrame(timestamp) {
        if (destroyed || !stream || !detector) return;
        raf = requestAnimationFrame(detectFrame);
        // ~8fps inference is sufficient for a lightweight tracking miniature.
        if (timestamp - lastDetectionAt < 120 || video.readyState < 2 || video.currentTime === lastVideoTime) return;
        lastDetectionAt = timestamp;
        lastVideoTime = video.currentTime;
        try {
            const results = detector.detectForVideo(video, timestamp);
            const detections = results?.detections || [];
            faceCount = detections.length;
            if (detections.length === 1 && detections[0].boundingBox) {
                currentBounds = detections[0].boundingBox;
                lastFaceAt = performance.now();
                updateBox();
                setStatus("Face detected · Name shown is self-entered, not recognized");
            } else {
                currentBounds = null;
                box.hidden = true;
                setStatus(detections.length > 1 ? "Multiple faces detected — show one face to record." : "Looking for a face…");
            }
            updateRecordButton();
        } catch (error) {
            stopCamera();
            setStatus("Face tracking stopped unexpectedly. Please try again.");
        }
    }

    function stopCamera() {
        requestId++;
        cancelAnimationFrame(raf);
        raf = 0;
        if (stream) stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.pause();
        video.srcObject = null;
        detector?.close?.();
        detector = null;
        video.style.visibility = "hidden";
        placeholder.hidden = false;
        box.hidden = true;
        cameraLabel.textContent = "CAMERA OFF";
        enable.disabled = false;
        enable.textContent = "Enable Camera ↗";
        stopButton.disabled = true;
        faceCount = 0;
        lastFaceAt = -Infinity;
        currentBounds = null;
        lastVideoTime = -1;
        loading = false;
        updateRecordButton();
    }

    async function startCamera() {
        if (stream || loading || destroyed) return;
        if (!navigator.mediaDevices?.getUserMedia) {
            setStatus("Camera access requires HTTPS (or localhost) and a supported browser.");
            return;
        }
        loading = true;
        const startedAs = ++requestId;
        enable.disabled = true;
        enable.textContent = "Starting…";
        setStatus("Requesting camera permission…");
        let acquired = null;
        let newDetector = null;
        try {
            acquired = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } });
            if (destroyed || startedAs !== requestId) { acquired.getTracks().forEach(track => track.stop()); return; }
            stream = acquired;
            video.srcObject = stream;
            await video.play();
            if (destroyed || startedAs !== requestId) return;
            video.style.visibility = "visible";
            placeholder.hidden = true;
            cameraLabel.textContent = "CAMERA LIVE";
            stopButton.disabled = false;
            setStatus("Camera active. Loading face detector…");
            const { FaceDetector, FilesetResolver } = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/+esm`);
            const vision = await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`);
            newDetector = await FaceDetector.createFromOptions(vision, {
                baseOptions: { modelAssetPath: MODEL_URL },
                runningMode: "VIDEO",
                minDetectionConfidence: 0.6
            });
            if (destroyed || startedAs !== requestId) { newDetector.close?.(); return; }
            detector = newDetector;
            enable.textContent = "Camera Running";
            setStatus("Looking for a face…");
            raf = requestAnimationFrame(detectFrame);
        } catch (error) {
            if (!destroyed && startedAs === requestId) {
                const denied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
                stopCamera();
                setStatus(denied ? "Camera permission denied. You can enable it in browser settings." :
                    "Unable to start camera or load MediaPipe. Check camera access and internet connection.");
            }
        } finally {
            loading = false;
        }
    }

    function recordAttendance() {
        updateRecordButton();
        if (record.disabled) { setStatus("Enter your name and show exactly one face before recording."); return; }
        const entry = { name: visitorName(), time: new Date() };
        records.push(entry);
        if (records.length === 1) log.replaceChildren();
        const line = document.createElement("div");
        line.className = "face-log-entry";
        const who = document.createElement("strong");
        who.textContent = entry.name;
        const when = document.createElement("span");
        when.textContent = entry.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        line.append(who, when);
        log.prepend(line);
        count.textContent = `${records.length} ${records.length === 1 ? "entry" : "entries"}`;
        setStatus(`Recorded ${entry.name} for this demo session (not identity-verified).`);
        updateRecordButton();
    }

    enable.addEventListener("click", startCamera);
    stopButton.addEventListener("click", () => { stopCamera(); setStatus("Camera stopped. No images or video saved."); });
    nameInput.addEventListener("input", () => { label.textContent = visitorName() || "Visitor"; updateRecordButton(); });
    record.addEventListener("click", recordAttendance);
    back.addEventListener("click", backToShell);
    window.addEventListener("resize", updateBox);

    return {
        focus() { nameInput.focus({ preventScroll: true }); },
        destroy() {
            if (destroyed) return;
            destroyed = true;
            stopCamera();
            records.length = 0;
            nameInput.value = "";
            log.replaceChildren();
            window.removeEventListener("resize", updateBox);
        }
    };
}
