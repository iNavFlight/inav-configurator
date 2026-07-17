'use strict'

import GUI from './../gui';
import { ConnectionType, Connection } from './connection';
import i18n from './../localization';

/**
 * 已知的飞控串口设备 VID/PID 列表
 * 注意：Web Serial API 不支持自动枚举，这个列表仅作为文档参考
 */
const serialDevices = [
    { vendorId: 1027, productId: 24577 }, // FT232R USB UART
    { vendorId: 1155, productId: 12886 }, // STM32 in HID mode
    { vendorId: 1155, productId: 14158 }, // 0483:374e STM Electronics STLink Virtual COM Port (NUCLEO boards)
    { vendorId: 1155, productId: 22336 }, // STM Electronics Virtual COM Port
    { vendorId: 4292, productId: 60000 }, // CP210x
    { vendorId: 4292, productId: 60001 }, // CP210x
    { vendorId: 4292, productId: 60002 }, // CP210x
    { vendorId: 11836, productId: 22336 }, // AT32 VCP
    { vendorId: 12619, productId: 22336 }, // APM32 VCP
];

/**
 * 串口连接类 - 使用 Web Serial API
 *
 * 关键变化（相比 Electron 版本）：
 * 1. 使用 navigator.serial.requestPort() 请求设备（用户手动选择）
 * 2. 使用 port.readable/writable 进行数据读写
 * 3. 移除了 Electron IPC 通信
 * 4. 实现异步读取循环
 */
class ConnectionSerial extends Connection {
    constructor() {
        super();
        this._onReceiveListeners = [];
        this._onReceiveErrorListeners = [];
        this.ports = [];
        super._type = ConnectionType.Serial;

        // Web Serial API 专用属性
        this._port = null;           // SerialPort 对象
        this._reader = null;         // ReadableStreamDefaultReader
        this._writer = null;         // WritableStreamDefaultWriter
        this._readLoop = null;       // 读取循环 Promise
        this._keepReading = true;    // 控制读取循环
    }

    /**
     * 连接到串口设备
     * @param {string} path - 设备路径（Web Serial API 中忽略，用户手动选择）
     * @param {object} options - 连接选项 { bitrate: number }
     * @param {function} callback - 回调函数
     */
    async connectImplementation(path, options, callback) {
        try {
            // Web Serial API：使用在 serial_backend.js 中预先选择的端口
            // （在用户点击连接按钮时已经通过用户手势上下文获取）
            if (!this._port) {
                throw new Error('No serial port selected. This should not happen - port should be selected before connect().');
            }

            // 打开串口
            await this._port.open({
                baudRate: options.bitrate,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                bufferSize: 4096,
                flowControl: 'none'
            });

            // 获取设备信息（如果可用）
            const info = this._port.getInfo();
            const deviceName = info.usbVendorId
                ? `USB(${info.usbVendorId.toString(16)}:${info.usbProductId.toString(16)})`
                : 'Serial Device';

            GUI.log(i18n.getMessage('connectionConnected', [`${deviceName} @ ${options.bitrate} baud`]));

            // 生成虚拟连接 ID（Web Serial API 不提供 ID）
            this._connectionId = Date.now();

            // 启动数据读取循环
            this._keepReading = true;
            this._startReading();

            if (callback) {
                callback({
                    bitrate: options.bitrate,
                    connectionId: this._connectionId
                });
            }
        } catch (error) {
            console.error('Serial connection error:', error);

            let errorMessage = 'Unknown error';
            if (error.name === 'NotFoundError') {
                errorMessage = 'No device selected';
            } else if (error.name === 'SecurityError') {
                errorMessage = 'Permission denied (HTTPS required for Web Serial API)';
            } else if (error.name === 'NetworkError') {
                errorMessage = 'Device is already open or unavailable';
            } else {
                errorMessage = error.message || error.toString();
            }

            GUI.log(i18n.getMessage('connectionFailed', [errorMessage]));

            if (callback) {
                callback(false);
            }
        }
    }

    /**
     * 启动异步读取循环
     * 持续读取串口数据并触发回调
     */
    async _startReading() {
        if (!this._port || !this._port.readable) {
            console.error('Port not readable');
            return;
        }

        try {
            this._reader = this._port.readable.getReader();

            while (this._keepReading && this._port.readable) {
                try {
                    const { value, done } = await this._reader.read();

                    if (done) {
                        console.log('Reader closed');
                        break;
                    }

                    if (value && value.length > 0) {
                        // 触发数据接收回调
                        this._onReceiveListeners.forEach(listener => {
                            listener({
                                connectionId: this._connectionId,
                                data: value.buffer
                            });
                        });
                    }
                } catch (error) {
                    if (this._keepReading) {
                        console.error('Read error:', error);
                        this._onReceiveErrorListeners.forEach(listener => {
                            listener(error);
                        });
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Reader creation error:', error);
            this._onReceiveErrorListeners.forEach(listener => {
                listener(error);
            });
        } finally {
            if (this._reader) {
                try {
                    this._reader.releaseLock();
                } catch (e) {
                    // 忽略释放锁时的错误
                }
                this._reader = null;
            }
        }
    }

    /**
     * 断开串口连接
     * @param {function} callback - 回调函数
     */
    async disconnectImplementation(callback) {
        let success = true;

        try {
            // 停止读取循环
            this._keepReading = false;

            // 关闭读取器
            if (this._reader) {
                try {
                    await this._reader.cancel();
                } catch (e) {
                    console.warn('Error canceling reader:', e);
                }
                try {
                    this._reader.releaseLock();
                } catch (e) {
                    // 忽略
                }
                this._reader = null;
            }

            // 关闭写入器
            if (this._writer) {
                try {
                    this._writer.releaseLock();
                } catch (e) {
                    console.warn('Error releasing writer:', e);
                }
                this._writer = null;
            }

            // 关闭串口
            if (this._port) {
                try {
                    await this._port.close();
                    console.log('Serial port closed successfully');
                } catch (e) {
                    console.error('Error closing port:', e);
                    success = false;
                }
                this._port = null;
            }
        } catch (error) {
            console.error('Disconnect error:', error);
            success = false;
        }

        if (callback) {
            callback(success);
        }
    }

    /**
     * 发送数据到串口
     * @param {Array|Uint8Array|ArrayBuffer} data - 要发送的数据
     * @param {function} callback - 回调函数
     */
    async sendImplementation(data, callback) {
        if (!this._port || !this._port.writable) {
            console.error('Port not writable');
            if (callback) {
                callback({
                    bytesSent: 0,
                    resultCode: 1
                });
            }
            return;
        }

        try {
            // 获取写入器
            const writer = this._port.writable.getWriter();

            // 确保数据是 Uint8Array 格式
            let uint8Data;
            if (data instanceof Uint8Array) {
                uint8Data = data;
            } else if (data instanceof ArrayBuffer) {
                // ArrayBuffer 转换为 Uint8Array
                uint8Data = new Uint8Array(data);
            } else if (Array.isArray(data)) {
                uint8Data = new Uint8Array(data);
            } else if (typeof data === 'object' && data.buffer instanceof ArrayBuffer) {
                // TypedArray (like Int8Array, etc.)
                uint8Data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            } else {
                console.error('Invalid data type:', typeof data, data);
                throw new Error('Data must be Array, Uint8Array, or ArrayBuffer');
            }

            // 写入数据
            await writer.write(uint8Data);

            // 释放写入器
            writer.releaseLock();

            if (callback) {
                callback({
                    bytesSent: uint8Data.length,
                    resultCode: 0
                });
            }
        } catch (error) {
            console.error('Serial write error:', error);
            if (callback) {
                callback({
                    bytesSent: 0,
                    resultCode: 1
                });
            }
        }
    }

    /**
     * 添加数据接收回调
     * @param {function} callback - 回调函数
     */
    addOnReceiveCallback(callback) {
        this._onReceiveListeners.push(callback);
    }

    /**
     * 移除数据接收回调
     * @param {function} callback - 要移除的回调函数
     */
    removeOnReceiveCallback(callback) {
        this._onReceiveListeners = this._onReceiveListeners.filter(listener => listener !== callback);
    }

    /**
     * 添加错误回调
     * @param {function} callback - 回调函数
     */
    addOnReceiveErrorCallback(callback) {
        this._onReceiveErrorListeners.push(callback);
    }

    /**
     * 移除错误回调
     * @param {function} callback - 要移除的回调函数
     */
    removeOnReceiveErrorCallback(callback) {
        this._onReceiveErrorListeners = this._onReceiveErrorListeners.filter(listener => listener !== callback);
    }

    /**
     * 获取可用串口设备列表
     *
     * 注意：Web Serial API 不支持自动枚举设备
     * 此方法返回已授权设备的路径字符串数组
     *
     * @returns {Promise<Array<string>>} 设备路径数组
     */
    static async getDevices() {
        // Web Serial API 安全限制：
        // - 不允许主动枚举设备
        // - 必须通过用户交互（点击按钮等）触发 requestPort()
        // - 用户在浏览器原生 UI 中手动选择设备

        // 返回之前授权过的设备
        if ('serial' in navigator && 'getPorts' in navigator.serial) {
            try {
                const ports = await navigator.serial.getPorts();
                return ports.map((port, index) => {
                    const info = port.getInfo();
                    // 返回设备路径字符串（兼容原有代码）
                    if (info.usbVendorId) {
                        return `USB Serial (${info.usbVendorId.toString(16)}:${info.usbProductId.toString(16)})`;
                    } else {
                        return `Serial Port ${index + 1}`;
                    }
                });
            } catch (error) {
                console.error('Error getting authorized ports:', error);
            }
        }

        return [];
    }
}

export default ConnectionSerial;
