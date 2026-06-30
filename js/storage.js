const DataStore = (() => {
    const DB_NAME = 'PressureDB';
    const DB_VERSION = 1;
    const CHUNK_SECS = 10;
    let db = null;
    let buffer = [];
    let flushTimer = null;
    let _totalFrames = 0;
    let _firstTs = null;
    let _lastTs = null;

    async function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains('chunks')) {
                    const s = d.createObjectStore('chunks', { keyPath: 'chunkId' });
                    s.createIndex('ts', 'ts', { unique: false });
                }
                if (!d.objectStoreNames.contains('meta')) {
                    d.createObjectStore('meta', { keyPath: 'key' });
                }
            };
            req.onsuccess = async (e) => {
                db = e.target.result;
                const meta = await _readMeta();
                _totalFrames = meta.frames || 0;
                _firstTs = meta.firstTs || null;
                _lastTs = meta.lastTs || null;
                resolve(db);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    function _readMeta() {
        return new Promise((resolve) => {
            const tx = db.transaction('meta', 'readonly');
            const store = tx.objectStore('meta');
            const r = store.get('stats');
            r.onsuccess = (e) => resolve(e.target.result || {});
            r.onerror = () => resolve({});
        });
    }

    function _writeMeta() {
        const tx = db.transaction('meta', 'readwrite');
        const store = tx.objectStore('meta');
        store.put({ key: 'stats', frames: _totalFrames, firstTs: _firstTs, lastTs: _lastTs });
    }

    function pushFrame(time, values) {
        buffer.push(time + ',' + values.join(','));
        if (buffer.length >= CHUNK_SECS * 10) flush();
    }

    function flush() {
        if (!db || buffer.length === 0) return;
        const data = buffer.join('\n');
        const count = buffer.length;
        buffer = [];
        const ts = Date.now();
        if (!_firstTs) _firstTs = ts;
        _lastTs = ts;
        _totalFrames += count;
        _writeMeta();
        const chunk = { chunkId: 'c_' + ts + '_' + Math.random().toString(36).slice(2,6), ts, data };
        const tx = db.transaction('chunks', 'readwrite');
        const store = tx.objectStore('chunks');
        store.add(chunk);
        tx.oncomplete = () => { DebugLog.debug(I18N.t('log.flushN', count)); };
        tx.onerror = (e) => { DebugLog.warn(I18N.t('log.flushFail') + ': ' + e.target.error); };
    }

    function startAutoFlush() {
        stopAutoFlush();
        flushTimer = setInterval(flush, CHUNK_SECS * 1000);
    }

    function stopAutoFlush() {
        if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
    }

    async function queryFrames(fromTs, toTs) {
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const tx = db.transaction('chunks', 'readonly');
            const store = tx.objectStore('chunks');
            const index = store.index('ts');
            const range = IDBKeyRange.bound(fromTs, toTs);
            const req = index.getAll(range);
            req.onsuccess = (e) => {
                const chunks = e.target.result;
                const lines = [];
                for (const c of chunks) {
                    if (c.data) lines.push(...c.data.split('\n'));
                }
                const frames = [];
                for (const line of lines) {
                    const parts = line.split(',');
                    const t = parts[0];
                    const v = parts.slice(1).map(Number);
                    if (v.length === 8) frames.push({ t, v });
                }
                resolve(frames);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    function getStats() {
        return { frames: _totalFrames, firstTs: _firstTs, lastTs: _lastTs };
    }

    async function exportCSV(fromTs, toTs) {
        const frames = await queryFrames(fromTs, toTs);
        if (!frames.length) { alert(I18N.t('noData')); return; }
        let csv = '\uFEFF' + I18N.t('export.header') + '\n';
        for (const f of frames) csv += f.t + ',' + f.v.join(',') + '\n';
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = I18N.t('export.prefix') + '_' + new Date().toISOString().slice(0,16).replace('T','_').replace(':','-') + '.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        DebugLog.info(I18N.t('log.csvExport', frames.length));
    }

    return { openDB, pushFrame, flush, startAutoFlush, stopAutoFlush, queryFrames, getStats, exportCSV };
})();