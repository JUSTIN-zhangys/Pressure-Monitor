const App = (() => {
    const COLORS = ['#22d3ee','#a78bfa','#facc15','#4ade80','#f87171','#fb923c','#c084fc','#67e8f9'];

    async function init() {
        document.getElementById('verBadge').textContent = I18N.getAppName() + ' ' + I18N.getVersion();

        buildOverview();
        buildChartGrid();
        buildCompareToggles();
        try { await DataStore.openDB(); DebugLog.info(I18N.t('log.dbReady')); }
        catch (e) { DebugLog.error(I18N.t('log.dbFail') + ': ' + e.message); }

        bindLogEvents();
        bindHistoryEvents();
        bindPortEvents();
        bindLangEvent();
        await refreshPortList();
        setInterval(updateStorageBadge, 3000);
        ChartManager.initAll();
        ChartManager.initCompare();

        let frameCount = 0;
        SerialManager.setOnData((rawData) => {
            const lines = rawData.split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                const r = DataParser.parse(line);
                if (r.values) {
                    if (!SerialManager.getIsPaused() && ChartManager.getMode() === 'realtime')
                        ChartManager.pushData(r.time, r.values);
                    DataStore.pushFrame(r.time, r.values);
                    frameCount++;
                    if (frameCount % 50 === 0) DebugLog.debug(I18N.t('log.collectedN', frameCount));
                } else {
                    DebugLog.warn(I18N.t('log.parseFailLine', line.substring(0, 40)));
                }
            }
        });

        bindConnectEvents();

        DebugLog.info(I18N.t('log.appLoadedDB'));
    }

    function showDashboard() {
        document.getElementById('mainDashboard').style.display = 'block';
        document.getElementById('historyBar').style.display = 'block';
        document.getElementById('storageBadge').style.display = 'flex';
    }

    function setBtnState(state) {
        const cBtn = document.getElementById('connectBtn');
        const pBtn = document.getElementById('pauseBtn');
        const rBtn = document.getElementById('resumeBtn');
        const sBtn = document.getElementById('stopBtn');
        const status = document.getElementById('status');
        cBtn.style.display = 'none'; pBtn.style.display = 'none';
        rBtn.style.display = 'none'; sBtn.style.display = 'none';
        switch (state) {
            case 'idle':
                cBtn.style.display = 'inline-flex';
                cBtn.querySelector('span').textContent = I18N.t('btn.connect');
                status.textContent = I18N.t('status.ready');
                status.style.color = '#4ade80';
                break;
            case 'running':
                pBtn.style.display = 'inline-flex'; sBtn.style.display = 'inline-flex';
                status.textContent = I18N.t('status.running');
                status.style.color = '#4ade80';
                break;
            case 'paused':
                rBtn.style.display = 'inline-flex'; sBtn.style.display = 'inline-flex';
                status.textContent = I18N.t('status.paused');
                status.style.color = '#fbbf24';
                break;
            case 'stopped':
                cBtn.style.display = 'inline-flex';
                cBtn.querySelector('span').textContent = I18N.t('btn.reconnect');
                status.textContent = I18N.t('status.disconnected');
                status.style.color = '#64748b';
                break;
        }
    }

    function bindConnectEvents() {
        document.getElementById('connectBtn').addEventListener('click', async () => {
            try {
                const br = parseInt(document.getElementById('baudRate').value);
                const idx = parseInt(document.getElementById('portSelect').value);
                const ports = SerialManager.getCachedPorts();
                const targetPort = (idx >= 0 && ports[idx]) ? ports[idx].port : null;
                await SerialManager.connect(br, targetPort);
                showDashboard();
                setBtnState('running');
                DataStore.startAutoFlush();
                DebugLog.info(I18N.t('log.acqStart'));
            } catch (err) {
                DebugLog.error(I18N.t('log.connectFail') + ': ' + err.message);
                alert(I18N.t('log.connectFail') + ': ' + err.message);
            }
        });
        document.getElementById('pauseBtn').addEventListener('click', () => { SerialManager.pause(); setBtnState('paused'); });
        document.getElementById('resumeBtn').addEventListener('click', () => { SerialManager.resume(); setBtnState('running'); });
        document.getElementById('stopBtn').addEventListener('click', () => { SerialManager.stop(); DataStore.flush(); DataStore.stopAutoFlush(); setBtnState('stopped'); });
    }

    function buildOverview() {
        const bar = document.getElementById('overviewBar');
        if (!bar) return;
        let chLabel = I18N.t('label.channel');
        let html = '';
        for (let i = 0; i < 8; i++) {
            html += `<div class="ov-card"><div class="ov-ch" style="color:${COLORS[i]}">${chLabel} ${i+1}</div><div class="ov-val" id="val${i+1}" style="color:${COLORS[i]}">--</div><div class="ov-stat"><span>Min <b id="min${i+1}">--</b></span><span>Max <b id="max${i+1}">--</b></span><span>Avg <b id="avg${i+1}">--</b></span></div></div>`;
        }
        bar.innerHTML = html;
    }

    function buildChartGrid() {
        const grid = document.getElementById('chartGrid');
        if (!grid) return;
        let chLabel = I18N.t('label.channel');
        let html = '';
        for (let i = 0; i < 8; i++) {
            html += `<div class="ch-card"><div class="ch-card-head"><span class="ch-name" style="color:${COLORS[i]}">${chLabel} ${i+1}</span><span class="ch-live" id="live${i+1}" style="color:${COLORS[i]}">--</span></div><div class="ch-card-body"><canvas id="chart${i+1}"></canvas></div></div>`;
        }
        grid.innerHTML = html;
    }

    function buildCompareToggles() {
        const bar = document.getElementById('compareToggles');
        if (!bar) return;
        let html = '';
        for (let i = 0; i < 8; i++) {
            html += `<label class="compare-tag" data-ch="${i}"><span class="tag-dot" style="background:${COLORS[i]}"></span>${I18N.t('chart.ch')}${i+1}<input type="checkbox"></label>`;
        }
        bar.innerHTML = html;
        bar.addEventListener('click', (e) => {
            const tag = e.target.closest('.compare-tag');
            if (!tag) return;
            const ch = parseInt(tag.dataset.ch);
            const cb = tag.querySelector('input');
            cb.checked = !cb.checked;
            tag.classList.toggle('active', cb.checked);
            ChartManager.toggleCompareChannel(ch, cb.checked);
        });
    }

    function bindHistoryEvents() {
        const timeRange = document.getElementById('timeRange');
        const customDiv = document.getElementById('customRange');
        const loadBtn = document.getElementById('loadHistoryBtn');
        const exportBtn = document.getElementById('exportCSVBtn');
        const backBtn = document.getElementById('backToLiveBtn');

        timeRange.addEventListener('change', () => {
            if (timeRange.value === 'custom') {
                customDiv.style.display = 'flex';
                const now = new Date();
                document.getElementById('rangeTo').value = toLocal(now);
                document.getElementById('rangeFrom').value = toLocal(new Date(now - 3600000));
            } else { customDiv.style.display = 'none'; }
        });

        loadBtn.addEventListener('click', async () => {
            const r = getRange(); if (!r) return;
            loadBtn.disabled = true; loadBtn.textContent = I18N.t('log.loading');
            try {
                const frames = await DataStore.queryFrames(r.from, r.to);
                ChartManager.loadHistorical(frames);
                const status = document.getElementById('status');
                status.style.color = '#fbbf24';
                status.textContent = I18N.t('log.historyLoaded', frames.length);
                backBtn.style.display = 'flex';
            } catch (e) { DebugLog.error(I18N.t('log.loadFail') + ': ' + e.message); }
            finally { loadBtn.disabled = false; loadBtn.innerHTML = '<i class="fas fa-search"></i> ' + I18N.t('btn.load'); }
        });

        exportBtn.addEventListener('click', async () => {
            const r = getRange(); if (!r) return;
            await DataStore.exportCSV(r.from, r.to);
        });

        backBtn.addEventListener('click', () => {
            ChartManager.setMode('realtime');
            ChartManager.initAll();
            const status = document.getElementById('status');
            status.style.color = '#4ade80';
            status.textContent = I18N.t('status.running');
            backBtn.style.display = 'none';
        });
    }

    function getRange() {
        const v = document.getElementById('timeRange').value;
        const now = Date.now();
        if (v === 'custom') {
            const f = document.getElementById('rangeFrom').value;
            const t = document.getElementById('rangeTo').value;
            if (!f || !t) { alert(I18N.t('log.noData')); return null; }
            return { from: new Date(f).getTime(), to: new Date(t).getTime() };
        }
        return { from: now - parseInt(v) * 1000, to: now };
    }

    function toLocal(d) {
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    }

    function updateStorageBadge() {
        const s = DataStore.getStats();
        const el = document.getElementById('storageCount');
        if (!el) return;
        if (s.frames >= 1e6) el.textContent = I18N.t('data.labelM', (s.frames/1e6).toFixed(1));
        else if (s.frames >= 1e3) el.textContent = I18N.t('data.labelK', (s.frames/1e3).toFixed(1));
        else el.textContent = I18N.t('data.label', s.frames);
    }

    function bindLogEvents() {
        const si = document.getElementById('logSearch');
        if (si) si.addEventListener('input', e => DebugLog.setFilter(e.target.value));
        const eb = document.getElementById('exportLogBtn');
        if (eb) eb.addEventListener('click', () => DebugLog.exportLog());
        const cb = document.getElementById('clearLogBtn');
        if (cb) cb.addEventListener('click', () => { if (confirm(I18N.t('log.clearConfirm'))) DebugLog.clear(); });
    }

    function bindLangEvent() {
        const btn = document.getElementById('langBtn');
        btn.textContent = I18N.getLang() === 'zh' ? 'EN' : '中';
        btn.addEventListener('click', () => {
            const next = I18N.getLang() === 'zh' ? 'en' : 'zh';
            I18N.setLang(next);
            btn.textContent = next === 'zh' ? 'EN' : '中';
            I18N.applyHTML();
            buildOverview();
            buildChartGrid();
            buildCompareToggles();
            setBtnState(getCurrentState());
            updateStorageBadge();
            const si = document.getElementById('logSearch');
            if (si) si.placeholder = I18N.t('label.searchLog');
            document.getElementById('debugLog').textContent = I18N.t('placeholder.waiting');
            refreshPortList();
        });
    }

    function getCurrentState() {
        if (!SerialManager.getIsConnected()) return 'stopped';
        return SerialManager.getIsPaused() ? 'paused' : 'running';
    }

    function bindPortEvents() {
        const sel = document.getElementById('portSelect');
        sel.addEventListener('change', () => {
            if (sel.value === '-2') { sel.value = '-1'; document.getElementById('scanPortBtn').click(); }
        });
        document.getElementById('scanPortBtn').addEventListener('click', async () => {
            const btn = document.getElementById('scanPortBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
            try { await SerialManager.scanNewPort(); refreshPortList(); DebugLog.info(I18N.t('log.scanDone')); }
            catch (e) { /* handled in scanNewPort */ }
            finally { btn.innerHTML = '<i class="fas fa-sync-alt"></i>'; btn.disabled = false; }
        });
    }

    function refreshPortList() {
        const sel = document.getElementById('portSelect');
        if (!sel) return;
        SerialManager.loadCachedPorts().then(() => {
            const ports = SerialManager.getCachedPorts();
            const currentVal = sel.value;
            let html = '<option value="-1">' + I18N.t('label.selectPort') + '</option>';
            ports.forEach((p, i) => { html += `<option value="${i}">${p.display}</option>`; });
            html += '<option value="-2">' + I18N.t('label.scanNew') + '</option>';
            sel.innerHTML = html;
            if (currentVal && currentVal !== '-2') sel.value = currentVal;
        });
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());