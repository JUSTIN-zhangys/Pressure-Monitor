/**
 * 数据解析模块
 * 负责解析串口接收到的原始文本，提取时间戳和通道数值
 */
const DataParser = (() => {
    /**
     * 解析一行串口数据
     * @param {string} rawLine - 原始文本行
     * @returns {{ time: string|null, values: number[]|null }}
     */
    function parse(rawLine) {
        const line = rawLine.trim();
        const timeMatch = line.match(/\[(\d{2}:\d{2}:\d{2}\.\d{3})\]/);
        const time = timeMatch ? timeMatch[1] : generateTimestamp();

        const numbers = line.match(/-?\d+\.?\d*/g) || [];
        const numericValues = numbers.map(n => parseFloat(n)).filter(n => !isNaN(n));

        if (numericValues.length >= 8) {
            const values = numericValues.slice(-8);
            return { time, values };
        }

        return { time: null, values: null };
    }

    function generateTimestamp() {
        const now = new Date();
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        const ss = now.getSeconds().toString().padStart(2, '0');
        const ms = now.getMilliseconds().toString().padStart(3, '0');
        return `${hh}:${mm}:${ss}.${ms}`;
    }

    return { parse };
})();
