/**
 * 文件工具 - Web 环境下的文件操作辅助函数
 *
 * 提供功能：
 * 1. downloadFile: 触发浏览器下载文件
 * 2. readFile: 读取用户选择的 File 对象
 * 3. readFileAsText: 读取文本文件
 * 4. readFileAsArrayBuffer: 读取二进制文件
 * 5. readFileAsDataURL: 读取为 Data URL（用于图片预览）
 *
 * 用途：
 * - 替代 Electron 的 fs.writeFile (使用 downloadFile)
 * - 替代 Electron 的 fs.readFile (使用 readFile)
 * - 保存配置文件、日志文件、固件文件等
 */

/**
 * 触发浏览器下载文件
 *
 * @param {string} filename - 文件名（包括扩展名）
 * @param {*} data - 文件数据（支持多种格式）
 * @param {string} mimeType - MIME 类型（可选，自动检测）
 *
 * @example
 * // 下载文本文件
 * downloadFile('config.txt', 'some text content');
 *
 * // 下载 JSON 文件
 * downloadFile('settings.json', { key: 'value' });
 *
 * // 下载二进制文件
 * downloadFile('firmware.hex', arrayBuffer);
 *
 * // 下载 Blob
 * downloadFile('image.png', blob, 'image/png');
 */
export function downloadFile(filename, data, mimeType = null) {
    let blob;

    // 1. 如果数据已经是 Blob，直接使用
    if (data instanceof Blob) {
        blob = data;
    }
    // 2. 如果是 ArrayBuffer，转换为 Blob
    else if (data instanceof ArrayBuffer) {
        blob = new Blob([data], { type: mimeType || 'application/octet-stream' });
    }
    // 3. 如果是 Uint8Array 或其他 TypedArray
    else if (ArrayBuffer.isView(data)) {
        blob = new Blob([data.buffer], { type: mimeType || 'application/octet-stream' });
    }
    // 4. 如果是字符串
    else if (typeof data === 'string') {
        // 自动检测是否为 JSON
        const detectedType = mimeType || (filename.endsWith('.json') ? 'application/json' : 'text/plain');
        blob = new Blob([data], { type: detectedType + ';charset=utf-8' });
    }
    // 5. 如果是对象或数组，转换为 JSON
    else if (typeof data === 'object') {
        const jsonString = JSON.stringify(data, null, 2);
        blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    }
    // 6. 其他类型，转换为字符串
    else {
        blob = new Blob([String(data)], { type: 'text/plain;charset=utf-8' });
    }

    // 创建临时 URL
    const url = URL.createObjectURL(blob);

    // 创建隐藏的 <a> 标签触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    // 添加到 DOM、点击、移除
    document.body.appendChild(a);
    a.click();

    // 延迟清理，确保下载已开始
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * 读取文件内容（通用方法）
 *
 * @param {File} file - File 对象（来自 <input type="file"> 或 dialog.showOpenDialog）
 * @param {string} encoding - 编码方式：'text', 'binary', 'arraybuffer', 'dataurl'
 * @returns {Promise<string|ArrayBuffer>} 文件内容
 *
 * @example
 * const result = await dialog.showOpenDialog({ filters: [{ name: 'Text', extensions: ['txt'] }] });
 * const content = await readFile(result.files[0], 'text');
 */
export function readFile(file, encoding = 'text') {
    return new Promise((resolve, reject) => {
        if (!file || !(file instanceof File)) {
            reject(new Error('Invalid file object'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error(`File read error: ${e.target.error}`));

        switch (encoding.toLowerCase()) {
            case 'text':
            case 'utf8':
            case 'utf-8':
                reader.readAsText(file, 'UTF-8');
                break;

            case 'binary':
            case 'arraybuffer':
                reader.readAsArrayBuffer(file);
                break;

            case 'dataurl':
            case 'base64':
                reader.readAsDataURL(file);
                break;

            default:
                reader.readAsText(file, encoding);
        }
    });
}

/**
 * 读取文本文件
 *
 * @param {File} file - File 对象
 * @param {string} encoding - 文本编码（默认 UTF-8）
 * @returns {Promise<string>} 文本内容
 *
 * @example
 * const text = await readFileAsText(file);
 */
export function readFileAsText(file, encoding = 'UTF-8') {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error(`File read error: ${e.target.error}`));
        reader.readAsText(file, encoding);
    });
}

/**
 * 读取二进制文件（返回 ArrayBuffer）
 *
 * @param {File} file - File 对象
 * @returns {Promise<ArrayBuffer>} ArrayBuffer
 *
 * @example
 * const buffer = await readFileAsArrayBuffer(file);
 * const uint8Array = new Uint8Array(buffer);
 */
export function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error(`File read error: ${e.target.error}`));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * 读取文件为 Data URL（Base64 编码）
 * 常用于图片预览
 *
 * @param {File} file - File 对象
 * @returns {Promise<string>} Data URL (data:image/png;base64,...)
 *
 * @example
 * const dataUrl = await readFileAsDataURL(imageFile);
 * img.src = dataUrl;
 */
export function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error(`File read error: ${e.target.error}`));
        reader.readAsDataURL(file);
    });
}

/**
 * 批量读取多个文件
 *
 * @param {File[]} files - File 对象数组
 * @param {string} encoding - 编码方式
 * @returns {Promise<Array>} 文件内容数组
 *
 * @example
 * const result = await dialog.showOpenDialog({ properties: ['multiSelections'] });
 * const contents = await readFiles(result.files, 'text');
 */
export function readFiles(files, encoding = 'text') {
    return Promise.all(files.map(file => readFile(file, encoding)));
}

/**
 * 创建文本文件的 Blob
 *
 * @param {string} text - 文本内容
 * @param {string} mimeType - MIME 类型
 * @returns {Blob} Blob 对象
 *
 * @example
 * const blob = createTextBlob('Hello World', 'text/plain');
 */
export function createTextBlob(text, mimeType = 'text/plain') {
    return new Blob([text], { type: mimeType + ';charset=utf-8' });
}

/**
 * 创建 JSON 文件的 Blob
 *
 * @param {object} obj - JavaScript 对象
 * @returns {Blob} Blob 对象
 *
 * @example
 * const blob = createJSONBlob({ key: 'value' });
 */
export function createJSONBlob(obj) {
    const jsonString = JSON.stringify(obj, null, 2);
    return new Blob([jsonString], { type: 'application/json;charset=utf-8' });
}

/**
 * 获取文件扩展名
 *
 * @param {string} filename - 文件名
 * @returns {string} 扩展名（小写，不含点）
 *
 * @example
 * getFileExtension('config.json') // 'json'
 */
export function getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * 格式化文件大小
 *
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小（如 "1.5 MB"）
 *
 * @example
 * formatFileSize(1536000) // '1.46 MB'
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 默认导出（便于 import fileUtils from './fileUtils'）
export default {
    downloadFile,
    readFile,
    readFileAsText,
    readFileAsArrayBuffer,
    readFileAsDataURL,
    readFiles,
    createTextBlob,
    createJSONBlob,
    getFileExtension,
    formatFileSize
};
