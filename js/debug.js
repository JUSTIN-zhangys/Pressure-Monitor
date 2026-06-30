const DebugLog = (() => {
    const messages = [];
    const MAX_LOG = 500;
    let filterKeyword = '';
    let renderPending = false;

    const LEVELS = {
        INFO: { label: 'INFO', color: '#4ade80' },
        WARN: { label: 'WARN', color: '#fbbf24' },
        ERROR: { label: 'ERROR', color: '#f87171' },
        DEBUG: { label: 'DEBUG', color: '#60a5fa' }
    };

    function getTimestamp() {
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds())}`;
    }

    function add(msg, level = 'INFO') {
        const logEntry = {
            id: Date.now() + Math.random(),
            timestamp: getTimestamp(),
            level: level.toUpperCase(),
            message: msg
        };
        messages.unshift(logEntry);
        if (messages.length > MAX_LOG) messages.pop();
        requestRender();
    }

    function info(msg) { add(msg, 'INFO'); }
    function warn(msg) { add(msg, 'WARN'); }
    function error(msg) { add(msg, 'ERROR'); }
    function debug(msg) { add(msg, 'DEBUG'); }

    function requestRender() {
        if (renderPending) return;
        renderPending = true;
        requestAnimationFrame(render);
    }

    function setFilter(keyword) {
        filterKeyword = keyword.toLowerCase();
        requestRender();
    }

    function render() {
        renderPending = false;
        const el = document.getElementById('debugLog');
        if (!el) return;

        let filtered = messages;
        if (filterKeyword) {
            filtered = messages.filter(m => 
                m.message.toLowerCase().includes(filterKeyword) ||
                m.level.toLowerCase().includes(filterKeyword) ||
                m.timestamp.includes(filterKeyword)
            );
        }

        if (filtered.length === 0) {
            el.innerHTML = '<div style="color:#64748b; text-align:center; padding:20px;">暂无匹配日志</div>';
            return;
        }

        const html = [];
        for (let i = 0; i < filtered.length; i++) {
            const entry = filtered[i];
            const style = LEVELS[entry.level] || LEVELS.INFO;
            html.push(`<div class="log-entry"><span class="log-time">${entry.timestamp}</span><span class="log-level" style="color:${style.color}">[${style.label}]</span><span class="log-message">${escapeHtml(entry.message)}</span></div>`);
        }
        el.innerHTML = html.join('');
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function clear() {
        messages.length = 0;
        requestRender();
    }

    function exportLog() {
        if (messages.length === 0) {
            alert('暂无日志可导出');
            return;
        }

        const content = messages.slice().reverse().map(entry => {
            return `${entry.timestamp} [${entry.level}] ${entry.message}`;
        }).join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = I18N.t('export.logPrefix') + '_' + new Date().toISOString().replace(/[:.]/g, '-') + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function getStats() {
        const stats = { total: messages.length };
        Object.keys(LEVELS).forEach(l => {
            stats[l] = messages.filter(m => m.level === l).length;
        });
        return stats;
    }

    return {
        add,
        info,
        warn,
        error,
        debug,
        setFilter,
        clear,
        exportLog,
        getStats,
        render
    };
})();