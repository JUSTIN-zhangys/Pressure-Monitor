const I18N = (() => {
    const APP_NAME = 'PressureMonitor';
    const APP_VERSION = 'v2.1.0';

    const zh = {
        'app.title': '8通道压力实时监控看板',
        'app.name': '压力监控看板',
        'btn.connect': '连接串口',
        'btn.pause': '暂停',
        'btn.resume': '恢复',
        'btn.stop': '停止',
        'btn.reconnect': '重新连接',
        'btn.scan': '扫描可用端口',
        'btn.export': '导出',
        'btn.clear': '清空',
        'btn.load': '加载',
        'btn.exportCSV': '导出CSV',
        'btn.backLive': '返回实时',
        'card.serial': '串口参数',
        'card.overview': '数据概览',
        'card.compare': '多通道对比分析',
        'card.log': '系统日志',
        'card.history': '历史回放',
        'label.baud': '波特率',
        'label.port': '端口',
        'label.channel': '通道',
        'label.selectPort': '-- 请选择或扫描端口 --',
        'label.scanNew': '🆕 扫描新端口...',
        'label.searchLog': '搜索日志（关键词/级别/时间）...',
        'placeholder.waiting': '等待数据...',
        'placeholder.noMatch': '暂无匹配日志',
        'label.recent1m': '最近1分钟',
        'label.recent5m': '最近5分钟',
        'label.recent30m': '最近30分钟',
        'label.recent1h': '最近1小时',
        'label.custom': '自定义',
        'label.to': '至',
        'status.ready': '● 就绪',
        'status.running': '● 实时读取中',
        'status.paused': '⏸ 已暂停',
        'status.disconnected': '● 已断开',
        'status.history': '● 历史模式',
        'log.dbReady': '数据库已就绪',
        'log.dbFail': '数据库打开失败',
        'log.serialOK': '串口连接成功，开始读取...',
        'log.serialOKbps': '串口连接成功 ({0}bps)，开始读取...',
        'log.scanDone': '端口扫描完成',
        'log.acqStart': '采集已启动（自动落盘每10秒）',
        'log.acqPause': '⏸ 采集已暂停（串口保持连接，数据继续存储）',
        'log.acqResume': '▶ 采集已恢复',
        'log.stopped': '⏹ 串口已断开',
        'log.appLoaded': '✅ 监控看板已加载',
        'log.appLoadedDB': '✅ 监控看板已加载（含持久化）',
        'log.flushStarted': '自动落盘已启动（每10秒）',
        'log.flushN': '💾 落盘 {0} 帧',
        'log.flushFail': '落盘失败',
        'log.collectedN': '已采集 {0} 帧',
        'log.parseFail': '⚠️ 解析失败',
        'log.parseFailLine': '⚠️ 解析失败: {0}',
        'log.connectFail': '连接失败',
        'log.loadFail': '加载失败',
        'log.portLoadFail': '端口加载失败',
        'log.scanCancel': '扫描取消或失败',
        'log.csvExport': '📥 CSV导出: {0}条',
        'log.noData': '无数据',
        'log.clearConfirm': '确定要清空所有日志吗？',
        'log.historyLoaded': '历史模式 ({0}条)',
        'log.loading': '加载中...',
        'export.header': '时间,通道1,通道2,通道3,通道4,通道5,通道6,通道7,通道8',
        'export.prefix': 'pressure',
        'export.logPrefix': 'log',
        'chart.ch': 'CH',
        'tooltip.ch': 'CH{0}: {1}',
        'empty': '',
        'device.com': 'COM设备',
        'device.usb': 'USB设备',
        'noData': '无数据',
        'data.label': '{0}條',
        'data.labelK': '{0}K條',
        'data.labelM': '{0}M條',
    };

    const en = {
        'app.title': '8-Channel Pressure Monitor',
        'app.name': 'Pressure Monitor',
        'btn.connect': 'Connect Serial',
        'btn.pause': 'Pause',
        'btn.resume': 'Resume',
        'btn.stop': 'Stop',
        'btn.reconnect': 'Reconnect',
        'btn.scan': 'Scan Ports',
        'btn.export': 'Export',
        'btn.clear': 'Clear',
        'btn.load': 'Load',
        'btn.exportCSV': 'Export CSV',
        'btn.backLive': 'Back to Live',
        'card.serial': 'Serial Parameters',
        'card.overview': 'Data Overview',
        'card.compare': 'Multi-Channel Comparison',
        'card.log': 'System Log',
        'card.history': 'History Playback',
        'label.baud': 'Baud Rate',
        'label.port': 'Port',
        'label.channel': 'Channel',
        'label.selectPort': '-- Select or Scan Port --',
        'label.scanNew': '🆕 Scan New Port...',
        'label.searchLog': 'Search logs (keyword/level/time)...',
        'placeholder.waiting': 'Waiting for data...',
        'placeholder.noMatch': 'No matching logs',
        'label.recent1m': 'Last 1 min',
        'label.recent5m': 'Last 5 min',
        'label.recent30m': 'Last 30 min',
        'label.recent1h': 'Last 1 hour',
        'label.custom': 'Custom',
        'label.to': 'to',
        'status.ready': '● Ready',
        'status.running': '● Live',
        'status.paused': '⏸ Paused',
        'status.disconnected': '● Disconnected',
        'status.history': '● History',
        'log.dbReady': 'Database ready',
        'log.dbFail': 'Database open failed',
        'log.serialOK': 'Serial connected, reading...',
        'log.serialOKbps': 'Serial connected ({0}bps), reading...',
        'log.scanDone': 'Port scan complete',
        'log.acqStart': 'Acquisition started (auto-save every 10s)',
        'log.acqPause': '⏸ Acquisition paused (port stays connected, data still saved)',
        'log.acqResume': '▶ Acquisition resumed',
        'log.stopped': '⏹ Serial disconnected',
        'log.appLoaded': '✅ Monitor loaded',
        'log.appLoadedDB': '✅ Monitor loaded (with persistence)',
        'log.flushStarted': 'Auto-save started (every 10s)',
        'log.flushN': '💾 Saved {0} frames',
        'log.flushFail': 'Save failed',
        'log.collectedN': 'Collected {0} frames',
        'log.parseFail': '⚠️ Parse failed',
        'log.parseFailLine': '⚠️ Parse failed: {0}',
        'log.connectFail': 'Connection failed',
        'log.loadFail': 'Load failed',
        'log.portLoadFail': 'Port load failed',
        'log.scanCancel': 'Scan cancelled or failed',
        'log.csvExport': '📥 CSV exported: {0} records',
        'log.noData': 'No data',
        'log.clearConfirm': 'Clear all logs?',
        'log.historyLoaded': 'History mode ({0} records)',
        'log.loading': 'Loading...',
        'export.header': 'Time,Channel1,Channel2,Channel3,Channel4,Channel5,Channel6,Channel7,Channel8',
        'export.prefix': 'pressure',
        'export.logPrefix': 'log',
        'chart.ch': 'CH',
        'tooltip.ch': 'CH{0}: {1}',
        'empty': '',
        'device.com': 'COM Device',
        'device.usb': 'USB Device',
        'noData': 'No data',
        'data.label': '{0} records',
        'data.labelK': '{0}K records',
        'data.labelM': '{0}M records',
    };

    let lang = localStorage.getItem('pressure_lang') || (navigator.language.startsWith('zh') ? 'zh' : 'en');
    const tables = { zh, en };

    function t(key, ...args) {
        let msg = (tables[lang] && tables[lang][key]) || tables['zh'][key] || key;
        for (let i = 0; i < args.length; i++) {
            msg = msg.replace('{' + i + '}', args[i]);
        }
        return msg;
    }

    function setLang(l) {
        lang = l;
        localStorage.setItem('pressure_lang', l);
        applyHTML();
    }

    function getLang() { return lang; }
    function getVersion() { return APP_VERSION; }
    function getAppName() { return APP_NAME; }

    function applyHTML() {
        document.title = t('app.title');
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const txt = t(key);
            if (el.tagName === 'INPUT' && el.type === 'text' || el.tagName === 'INPUT' && el.type === 'search') {
                el.placeholder = txt;
            } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                // skip value for other inputs
            } else {
                el.textContent = txt;
            }
        });
        document.querySelectorAll('[data-i18n-href]').forEach(el => {
            el.setAttribute('data-i18n-href', t(el.getAttribute('data-i18n-href')));
        });
    }

    return { t, setLang, getLang, getVersion, getAppName, applyHTML };
})();

document.addEventListener('DOMContentLoaded', () => I18N.applyHTML());