/**
 * 对话框层 - 使用 HTML5 API 替代 Electron 对话框
 *
 * 关键变化：
 * 1. showOpenDialog: 使用 <input type="file"> 替代 Electron 对话框
 * 2. showSaveDialog: 返回文件路径，实际保存使用浏览器下载
 * 3. alert/confirm: 使用 smalltalk 库（已在项目依赖中）
 * 4. 支持 App Bridge（可选，用于 WebView 环境中的原生对话框）
 */

import smalltalk from 'smalltalk';

const dialog = {
    /**
     * 显示打开文件对话框
     * @param {object} options - 对话框选项
     * @param {string} options.title - 对话框标题
     * @param {string} options.defaultPath - 默认路径
     * @param {array} options.filters - 文件类型过滤器 [{ name: 'Text', extensions: ['txt'] }]
     * @param {array} options.properties - 属性 ['openFile', 'multiSelections']
     * @returns {Promise<object>} { canceled: boolean, filePaths: string[], files: File[] }
     */
    showOpenDialog: async function (options) {
        return new Promise((resolve, reject) => {
            // 如果有 App Bridge（WebView 环境中的原生桥接），优先使用
            if (window.appBridge && window.appBridge.showOpenDialog) {
                window.appBridge.showOpenDialog(options)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            // 创建隐藏的文件选择器
            const input = document.createElement('input');
            input.type = 'file';
            input.style.display = 'none';

            // 设置多选
            if (options.properties && options.properties.includes('multiSelections')) {
                input.multiple = true;
            }

            // 设置文件类型过滤
            if (options.filters && options.filters.length > 0) {
                const extensions = options.filters
                    .flatMap(f => f.extensions)
                    .map(e => `.${e}`)
                    .join(',');
                input.accept = extensions;
            }

            // 文件选择完成回调
            input.onchange = () => {
                if (input.files && input.files.length > 0) {
                    const files = Array.from(input.files);
                    resolve({
                        canceled: false,
                        filePaths: files.map(f => f.name), // Web 环境中只能获取文件名
                        files: files  // 返回 File 对象供读取
                    });
                } else {
                    resolve({ canceled: true });
                }
                // 清理 DOM
                document.body.removeChild(input);
            };

            // 用户取消选择
            input.oncancel = () => {
                resolve({ canceled: true });
                document.body.removeChild(input);
            };

            // 添加到 DOM 并触发点击
            document.body.appendChild(input);
            input.click();
        });
    },

    /**
     * 显示保存文件对话框
     *
     * 注意：Web 环境中无法直接显示保存对话框
     * 此方法返回文件路径，实际保存需要使用 fileUtils.downloadFile()
     *
     * @param {object} options - 对话框选项
     * @param {string} options.title - 对话框标题
     * @param {string} options.defaultPath - 默认文件名
     * @param {array} options.filters - 文件类型过滤器
     * @returns {Promise<object>} { canceled: boolean, filePath: string }
     */
    showSaveDialog: async function (options) {
        // 如果有 App Bridge（WebView 环境中的原生桥接），优先使用
        if (window.appBridge && window.appBridge.showSaveDialog) {
            return window.appBridge.showSaveDialog(options);
        }

        // Web 环境降级方案：返回默认文件名
        // 实际保存将通过浏览器下载功能完成（见 fileUtils.downloadFile）
        const defaultPath = options.defaultPath || 'download.txt';

        // 提取文件名（去掉路径）
        const fileName = defaultPath.split(/[/\\]/).pop();

        return {
            canceled: false,
            filePath: fileName,
            // 标记这是 Web 环境，调用者需要使用浏览器下载
            useDownload: true
        };
    },

    /**
     * 显示警告对话框
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @returns {Promise<void>}
     */
    alert: function (title, message) {
        // 如果只有一个参数，作为消息内容
        if (arguments.length === 1) {
            message = title;
            title = '提示';
        }

        return smalltalk.alert(title, message);
    },

    /**
     * 显示确认对话框
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @returns {Promise<boolean>} true=确定, false=取消
     */
    confirm: function (title, message) {
        // 如果只有一个参数，作为消息内容
        if (arguments.length === 1) {
            message = title;
            title = '确认';
        }

        return smalltalk.confirm(title, message)
            .then(() => true)
            .catch(() => false);
    },

    /**
     * 显示输入对话框
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @param {string} defaultValue - 默认值
     * @returns {Promise<string|null>} 输入的值，或 null（取消）
     */
    prompt: function (title, message, defaultValue = '') {
        return smalltalk.prompt(title, message, defaultValue)
            .then(value => value)
            .catch(() => null);
    }
};

export default dialog;
