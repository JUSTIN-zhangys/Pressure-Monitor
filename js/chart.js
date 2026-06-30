const ChartManager = (() => {
    const COLORS = ['#22d3ee','#a78bfa','#facc15','#4ade80','#f87171','#fb923c','#c084fc','#67e8f9'];
    const MAX_POINTS = 300;
    const MIN_RENDER_INTERVAL = 100;
    const STATS_INTERVAL = 1000;
    const MAX_DISPLAY = 5000;
    let lastRenderTime = 0;
    let lastStatsTime = 0;
    let renderPending = false;
    let mode = 'realtime';
    const instances = Array(8).fill(null);

    const store = { times: [], channels: Array(8).fill().map(() => []) };

    function createChart(i) {
        const cvs = document.getElementById('chart' + (i + 1));
        if (!cvs) return null;
        return new Chart(cvs.getContext('2d'), {
            type: 'line',
            data: { labels: store.times, datasets: [{
                label: I18N.t('chart.ch') + (i+1), data: store.channels[i],
                borderColor: COLORS[i], backgroundColor: COLORS[i] + '18',
                tension: 0.3, borderWidth: 2, pointRadius: 0, fill: true
            }]},
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 0 },
                interaction: { intersect: false, mode: 'nearest' },
                plugins: { legend: { display: false },
                    tooltip: { callbacks: { label: ctx => I18N.t('tooltip.ch', i+1, Number(ctx.raw).toFixed(2)) } }
                },
                scales: {
                    x: { display: false },
                    y: { display: true, position: 'left',
                        ticks: { maxTicksLimit: 4, font: { size: 9 }, callback: v => v.toFixed(1) },
                        grid: { color: '#1e2937' }
                    }
                }
            }
        });
    }

    function destroyAll() {
        instances.forEach((inst, i) => { if (inst) { inst.destroy(); instances[i] = null; } });
    }

    function initAll() { destroyAll(); for (let i = 0; i < 8; i++) instances[i] = createChart(i); }

    function pushData(time, values) {
        if (mode !== 'realtime') return;
        store.times.push(time);
        values.forEach((v, i) => store.channels[i].push(v));
        if (store.times.length > MAX_POINTS) {
            store.times.shift();
            store.channels.forEach(ch => ch.shift());
        }
        liveOnly(values);
        requestRender();
    }

    function liveOnly(vals) {
        const now = Date.now();
        for (let i = 0; i < vals.length; i++) {
            const el = document.getElementById('val' + (i + 1));
            if (el) el.textContent = vals[i].toFixed(2);
            const liveEl = document.getElementById('live' + (i + 1));
            if (liveEl) liveEl.textContent = vals[i].toFixed(2);
        }
        if (now - lastStatsTime < STATS_INTERVAL) return;
        lastStatsTime = now;
        updateMinMaxAvg();
    }

    function updateMinMaxAvg() {
        for (let i = 0; i < 8; i++) {
            const minEl = document.getElementById('min' + (i + 1));
            const maxEl = document.getElementById('max' + (i + 1));
            const avgEl = document.getElementById('avg' + (i + 1));
            if (!minEl && !maxEl && !avgEl) continue;
            const arr = store.channels[i];
            if (arr.length === 0) continue;
            let sum = 0, mn = arr[0], mx = arr[0];
            for (let j = 0; j < arr.length; j++) {
                sum += arr[j];
                if (arr[j] < mn) mn = arr[j];
                if (arr[j] > mx) mx = arr[j];
            }
            if (minEl) minEl.textContent = mn.toFixed(2);
            if (maxEl) maxEl.textContent = mx.toFixed(2);
            if (avgEl) avgEl.textContent = (sum / arr.length).toFixed(2);
        }
    }

    function requestRender() {
        if (renderPending) return;
        const now = Date.now();
        if (now - lastRenderTime < MIN_RENDER_INTERVAL) {
            renderPending = true;
            setTimeout(() => render(), MIN_RENDER_INTERVAL - (now - lastRenderTime));
            return;
        }
        render();
    }

    function render() {
        renderPending = false;
        lastRenderTime = Date.now();
        let anyNull = false;
        for (let i = 0; i < 8; i++) {
            const inst = instances[i];
            if (!inst) { anyNull = true; continue; }
            inst.data.labels = store.times;
            inst.data.datasets[0].data = store.channels[i];
            inst.update('none');
        }
        if (anyNull) initAll();
        syncCompare();
    }

    function loadHistorical(frames) {
        mode = 'historical';
        destroyAll();
        store.times = []; store.channels.forEach(ch => ch.length = 0);
        if (!frames.length) { initAll(); return; }
        let display = frames;
        if (frames.length > MAX_DISPLAY) {
            const step = Math.ceil(frames.length / MAX_DISPLAY);
            display = frames.filter((_, i) => i % step === 0);
        }
        store.times = display.map(f => f.t);
        for (const f of display) f.v.forEach((v, i) => store.channels[i].push(v));
        initAll(); render();
        updateMinMaxAvg();
    }

    function setMode(m) {
        mode = m;
        if (m === 'realtime') { store.times = []; store.channels.forEach(ch => ch.length = 0); destroyAll(); }
    }

    function getMode() { return mode; }
    function getStore() { return store; }

    // ── 对比看板 ──
    let compareInstance = null;
    const compareActive = new Set();

    function initCompare() {
        const cvs = document.getElementById('compareChart');
        if (!cvs) return;
        const datasets = [];
        for (let i = 0; i < 8; i++) {
            datasets.push({
                label: I18N.t('chart.ch') + (i + 1), data: store.channels[i],
                borderColor: COLORS[i], backgroundColor: COLORS[i] + '18',
                tension: 0.3, borderWidth: 2, pointRadius: 0, fill: false,
                hidden: !compareActive.has(i)
            });
        }
        compareInstance = new Chart(cvs.getContext('2d'), {
            type: 'line',
            data: { labels: store.times, datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 0 },
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: true, position: 'top', labels: { color: '#e2e8f0', usePointStyle: true, pointStyleWidth: 8, padding: 12, font: { size: 11 }, generateLabels(chart) { return chart.data.datasets.map((ds, i) => ({ text: ds.label, fillStyle: COLORS[i], strokeStyle: COLORS[i], lineWidth: 2, hidden: ds.hidden, index: i, pointStyle: 'line' })); } } }
                },
                scales: {
                    x: { display: true, ticks: { maxTicksLimit: 8, font: { size: 9 }, color: '#64748b' }, grid: { color: '#1e2937' } },
                    y: { display: true, ticks: { maxTicksLimit: 6, font: { size: 9 }, color: '#64748b', callback: v => v.toFixed(1) }, grid: { color: '#1e2937' } }
                }
            }
        });
    }

    function syncCompare() {
        if (!compareInstance || compareActive.size === 0) return;
        compareInstance.data.labels = store.times;
        for (const i of compareActive) {
            compareInstance.data.datasets[i].data = store.channels[i];
        }
        compareInstance.update('none');
    }

    function toggleCompareChannel(i, show) {
        if (show) compareActive.add(i); else compareActive.delete(i);
        if (compareInstance) {
            compareInstance.setDatasetVisibility(i, show);
            compareInstance.update('none');
        }
    }

    function destroyCompare() {
        if (compareInstance) { compareInstance.destroy(); compareInstance = null; }
        compareActive.clear();
    }

    return { pushData, render, loadHistorical, setMode, getMode, getStore, initAll, initCompare, syncCompare, toggleCompareChannel, destroyCompare };
})();