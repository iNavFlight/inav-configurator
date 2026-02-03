/**
 * 存储层 - 使用 IndexedDB 替代 Electron 文件系统
 *
 * 关键变化：
 * 1. 从 Electron Store (window.electronAPI.store*) 迁移到 IndexedDB
 * 2. 使用 idb-keyval 库简化 IndexedDB 操作
 * 3. 所有方法改为异步（返回 Promise）
 * 4. 保持接口签名一致（get, set, delete）
 *
 * 注意：所有调用此模块的代码需要改为 async/await 方式
 */

import { get, set, del } from 'idb-keyval';

/**
 * 存储对象
 * 提供键值对存储功能，数据保存在浏览器的 IndexedDB 中
 */
const store = {
    /**
     * 获取存储的值
     * @param {string} key - 键名
     * @param {*} defaultValue - 默认值（当键不存在时返回）
     * @returns {Promise<*>} 存储的值或默认值
     *
     * @example
     * const value = await store.get('someKey', 'default');
     */
    get: async (key, defaultValue) => {
        try {
            const value = await get(key);
            // 如果值不存在（undefined），返回默认值
            return value !== undefined ? value : defaultValue;
        } catch (error) {
            console.error(`Store.get error for key "${key}":`, error);
            return defaultValue;
        }
    },

    /**
     * 设置存储的值
     * @param {string} key - 键名
     * @param {*} value - 要存储的值（支持对象、数组、字符串、数字等）
     * @returns {Promise<void>}
     *
     * @example
     * await store.set('someKey', { data: 'value' });
     */
    set: async (key, value) => {
        try {
            await set(key, value);
        } catch (error) {
            console.error(`Store.set error for key "${key}":`, error);
            throw error;
        }
    },

    /**
     * 删除存储的键值对
     * @param {string} key - 要删除的键名
     * @returns {Promise<void>}
     *
     * @example
     * await store.delete('someKey');
     */
    delete: async (key) => {
        try {
            await del(key);
        } catch (error) {
            console.error(`Store.delete error for key "${key}":`, error);
            throw error;
        }
    }
};

export default store;
