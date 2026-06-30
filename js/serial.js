const SerialManager = (() => {
    let port = null;
    let reader = null;
    let isConnected = false;
    let isPaused = false;
    let onDataCallback = null;
    let lineBuffer = '';
    const cachedPorts = [];

    function setOnData(callback) { onDataCallback = callback; }
    function getIsConnected() { return isConnected; }
    function getIsPaused() { return isPaused; }

    function pause() {
        if (!isConnected || isPaused) return;
        isPaused = true;
        DebugLog.info(I18N.t('log.acqPause'));
    }

    function resume() {
        if (!isConnected || !isPaused) return;
        isPaused = false;
        DebugLog.info(I18N.t('log.acqResume'));
    }

    function stop() {
        if (reader) { try { reader.cancel(); } catch (e) { /* ignore */ } reader = null; }
        if (port) { try { port.close(); } catch (e) { /* ignore */ } port = null; }
        lineBuffer = '';
        isConnected = false;
        isPaused = false;
        DebugLog.info(I18N.t('log.stopped'));
    }

    async function loadCachedPorts() {
        try {
            const ports = await navigator.serial.getPorts();
            cachedPorts.length = 0;
            for (const p of ports) {
                let info = { port: p, display: 'COM设备' };
                try {
                    const i = await p.getInfo();
                    const usb = i.usbVendorId ? `USB(${i.usbVendorId.toString(16)}:${i.usbProductId.toString(16)})` : '';
                    info.display = usb || i.bluetoothServiceClassId || 'COM设备';
                } catch (e) { /* ignore */ }
                cachedPorts.push(info);
            }
        } catch (e) { DebugLog.warn(I18N.t('log.portLoadFail') + ': ' + e.message); }
        return cachedPorts;
    }

    function getCachedPorts() { return cachedPorts; }

    async function scanNewPort() {
        try {
            const newPort = await navigator.serial.requestPort();
            // check if already in cache
            const exists = cachedPorts.find(c => c.port === newPort);
            if (!exists) {
                let info = { port: newPort, display: 'COM设备' };
                try {
                    const i = await newPort.getInfo();
                    const usb = i.usbVendorId ? `USB(${i.usbVendorId.toString(16)}:${i.usbProductId.toString(16)})` : '';
                    info.display = usb || 'COM设备';
                } catch (e) { /* ignore */ }
                cachedPorts.push(info);
            }
            return cachedPorts;
        } catch (err) {
            if (err.name !== 'AbortError') DebugLog.warn(I18N.t('log.scanCancel'));
            return cachedPorts;
        }
    }

    async function connect(baudRate, targetPort) {
        try {
            const p = targetPort || await navigator.serial.requestPort();
            port = p;
            await port.open({
                baudRate: baudRate, dataBits: 8, stopBits: 1, parity: "none"
            });

            const textDecoder = new TextDecoderStream();
            port.readable.pipeTo(textDecoder.writable);
            reader = textDecoder.readable.getReader();

            isConnected = true;
            DebugLog.info(I18N.t('log.serialOKbps', baudRate));
            readLoop();
            return true;
        } catch (err) { throw err; }
    }

    function disconnect() {
        if (reader) { try { reader.cancel(); } catch (e) { /* ignore */ } reader = null; }
        if (port) { try { port.close(); } catch (e) { /* ignore */ } port = null; }
        lineBuffer = ''; isConnected = false;
    }

    async function readLoop() {
        while (true) {
            try {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    lineBuffer += value;
                    const lines = lineBuffer.split('\n');
                    lineBuffer = lines.pop() || '';
                    lines.forEach(line => {
                        if (line.trim() && onDataCallback) onDataCallback(line);
                    });
                }
            } catch (e) { break; }
        }
    }

    return { connect, disconnect, stop, pause, resume, getIsConnected, getIsPaused, setOnData, getCachedPorts, loadCachedPorts, scanNewPort };
})();