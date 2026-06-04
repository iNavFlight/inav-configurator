'use strict';

import MSPCodes from './../js/msp/MSPCodes';
import MSP from './../js/msp';
import mspHelper from './../js/msp/MSPHelper';
import GUI from './../js/gui';
import FC from './../js/fc';
import i18n from './../js/localization';
import interval from './../js/intervals';

const HEALTH_LABELS = ['OK', 'WARNING', 'ERROR', 'CRITICAL'];
const HEALTH_CLASSES = ['health-ok', 'health-warning', 'health-error', 'health-critical'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const POLL_INTERVAL_MS  = 75;
const POLL_MAX_ATTEMPTS = 34; // 34 polls × 75 ms ≈ 2.5 s total window
const MODE_LABELS = ['OPERATIONAL', 'INITIALIZATION', 'MAINTENANCE', 'SOFTWARE_UPDATE', 'UNKNOWN_4', 'UNKNOWN_5', 'UNKNOWN_6', 'OFFLINE']; // modes 0-3 per DroneCAN NodeStatus; 4-6 reserved by spec
const PARAM_TYPE_INT    = 1;
const PARAM_TYPE_FLOAT  = 2;
const PARAM_TYPE_BOOL   = 3;
const PARAM_TYPE_STRING = 4;

function getModeLabel(mode) {
    return (mode < MODE_LABELS.length && MODE_LABELS[mode]) ? MODE_LABELS[mode] : `MODE_${mode}`;
}

const dronecanTab = {};
let nameCache = {};
let currentDetailNodeId = null;

function dronecanAsyncPoll(service_id, node_id, params, onDone) {
    const reqPayload = [
        service_id & 0xFF, (service_id >> 8) & 0xFF,
        node_id,
    ];
    if (service_id === 11 && params) {
        reqPayload.push(params.index & 0xFF, (params.index >> 8) & 0xFF);
        reqPayload.push(params.is_write ? 1 : 0);
        if (params.is_write) {
            reqPayload.push(params.value_type);
            switch (params.value_type) {
                case PARAM_TYPE_INT: {
                    const v = BigInt(Math.trunc(params.value));
                    for (let i = 0; i < 8; i++) reqPayload.push(Number((v >> BigInt(i * 8)) & 0xFFn));
                    break;
                }
                case PARAM_TYPE_FLOAT: {
                    const arr = new Float32Array([params.value]);
                    reqPayload.push(...new Uint8Array(arr.buffer));
                    break;
                }
                case PARAM_TYPE_BOOL: reqPayload.push(params.value ? 1 : 0); break;
                case PARAM_TYPE_STRING: {
                    const enc = new TextEncoder().encode(String(params.value).slice(0, 63));
                    reqPayload.push(enc.length, ...enc);
                    break;
                }
            }
            const nameEnc = new TextEncoder().encode(String(params.name || '').slice(0, 92));
            reqPayload.push(nameEnc.length, ...nameEnc);
        }
    }

    if (service_id === 10 && params) {
        reqPayload.push(params.opcode);
    }

    MSP.send_message(MSPCodes.MSP2_INAV_DRONECAN_ASYNC_REQUEST, reqPayload, false, () => {
        const req = FC.DRONECAN_ASYNC_REQUEST;
        if (!req || req.status !== 0) {
            onDone(req && req.status === 1 ? new Error('busy') : new Error('not_ready'), null);
            return;
        }
        const expectedSeq = req.seq;
        let attempts = 0;
        const poll = () => {
            MSP.send_message(MSPCodes.MSP2_INAV_DRONECAN_ASYNC_RESULT, false, false, () => {
                const r = FC.DRONECAN_ASYNC_RESULT;
                if (!r || r.seq !== expectedSeq ||
                    r.service_id !== service_id || r.node_id !== node_id) {
                    onDone(new Error('stale'), null); return;
                }
                if (r.state === 2) { onDone(null, r); }
                else if (r.state === 3) { onDone(new Error('error'), null); }
                else if (++attempts < POLL_MAX_ATTEMPTS) { setTimeout(poll, POLL_INTERVAL_MS); }
                else { onDone(new Error('timeout'), null); }
            });
        };
        setTimeout(poll, POLL_INTERVAL_MS);
    });
}

function fetchNamesSequentially(nodes, index, tbody) {
    if (index >= nodes.length) return; 
    const node = nodes[index]; 
    dronecanAsyncPoll(1, node.nodeID, null, (err, result) => {
        if (!err && result) {
            nameCache[node.nodeID] = result.name;
            const r = tbody.querySelector(`tr[data-node-id="${node.nodeID}"]`);
            if (r) r.cells[1].textContent = result.name;
        }
        fetchNamesSequentially(nodes, index + 1, tbody);
    });
}

dronecanTab.initialize = function (callback) {
    GUI.active_tab = this;

    import('./dronecan.html?raw').then(({default: html}) => {
        GUI.load(html, () => {
            i18n.localize();
            mspHelper.getSetting('dronecan_bitrate_kbps').then(data => {
                if (data) {
                    const val = data.setting.table ? data.setting.table.values[data.value] : data.value;
                    $('#dronecan-bitrate').val(val);
                }
                return mspHelper.getSetting('dronecan_node_id');
            }).then(data => {
                if (data) $('#dronecan-node-id').val(data.value);
            });
            $('#dronecan-save').on('click', dronecanTab.saveConfig);
            dronecanTab.refresh();
            interval.add('dronecan_refresh', () => dronecanTab.refresh(), 2000);
            GUI.content_ready(callback);
        });
    });
};

dronecanTab.refresh = function () {
    MSP.send_message(MSPCodes.MSP2_INAV_DRONECAN_NODES, false, false, () => {
        dronecanTab.render();
    });
};

dronecanTab.render = function () {
    const nodes = FC.DRONECAN_NODES;
    const status = document.getElementById('dronecan-status');
    const table = document.getElementById('dronecan-node-wrapper');
    const tbody = document.getElementById('dronecan-node-tbody');

    if (!nodes || nodes.length === 0) {
        status.style.display = '';
        table.style.display = 'none';
        document.getElementById('dronecan-node-detail').style.display = 'none';
        currentDetailNodeId = null;

        return;
    }

    status.style.display = 'none';
    table.style.display = '';
    tbody.innerHTML = '';

    const nodesToFetch = [];
    nodes.forEach(node => {
        const health = node.health < HEALTH_LABELS.length ? node.health : 3;
        const modeLabel = getModeLabel(node.mode);
        const lastSeen = (node.last_seen_ms / 1000).toFixed(1) + 's ago';

        const row = document.createElement('tr');
        row.dataset.nodeId = node.nodeID;
        row.innerHTML = `
            <td>${esc(node.nodeID)}</td>
            <td>—</td>
            <td><span class="health-badge ${HEALTH_CLASSES[health]}">${HEALTH_LABELS[health]}</span></td>
            <td>${esc(modeLabel)}</td>
            <td>${lastSeen}</td>
        `;
        if (nameCache[node.nodeID] !== undefined) {
            row.cells[1].textContent = nameCache[node.nodeID];
        } else {
            nodesToFetch.push(node);
        }

        row.addEventListener('click', () => dronecanTab.showDetail(node.nodeID));
        tbody.appendChild(row);
    });

    fetchNamesSequentially(nodesToFetch, 0, tbody);
    if (currentDetailNodeId !== null) {
        const liveNode = nodes.find(n => n.nodeID === currentDetailNodeId);
        if (!liveNode) {
            document.getElementById('dronecan-node-detail').style.display = 'none';
            currentDetailNodeId = null;
        } else {
            const detail = document.getElementById('dronecan-node-detail');
            const health = liveNode.health < HEALTH_LABELS.length ? liveNode.health : 3;
            const uptime = `${Math.floor(liveNode.uptime_sec / 3600)}h ${Math.floor((liveNode.uptime_sec % 3600) / 60)}m ${liveNode.uptime_sec % 60}s`;
            const modeLabel = getModeLabel(liveNode.mode);
            const set = (attr, val) => { const el = detail.querySelector(`[data-detail="${attr}"]`); if (el) el.textContent = val; };
            set('health', HEALTH_LABELS[health]);
            set('mode', modeLabel);
            set('last-seen', `${(liveNode.last_seen_ms / 1000).toFixed(1)}s ago`);
            set('uptime', uptime);
            set('vendor-status', liveNode.vendor_status_code);
        }
    }
};

dronecanTab.showDetail = function (nodeId) {
    currentDetailNodeId = nodeId;
    const node = FC.DRONECAN_NODES.find(n => n.nodeID === nodeId);
    if (!node) return;
    
    dronecanAsyncPoll(1, nodeId, null, (err, result) => {
        if (nodeId !== currentDetailNodeId) return;
        const detail = document.getElementById('dronecan-node-detail');
        const tbody  = document.getElementById('dronecan-detail-tbody');
        const health   = node.health < HEALTH_LABELS.length ? node.health : 3;
        const uptime   = result ? `${Math.floor(node.uptime_sec / 3600)}h ${Math.floor((node.uptime_sec % 3600) / 60)}m ${node.uptime_sec % 60}s` : '—';
        const modeLabel = getModeLabel(node.mode);

        tbody.innerHTML = `
            <tr><th>Node ID</th><td>${esc(nodeId)}</td></tr>
            <tr><th>Name</th><td class="dronecan-detail-name">${result ? esc(result.name) : (err ? 'Error' : '—')}</td></tr>
            <tr><th>Health</th><td data-detail="health">${HEALTH_LABELS[health]}</td></tr>
            <tr><th>Mode</th><td data-detail="mode">${esc(modeLabel)}</td></tr>
            <tr><th>Last Seen</th><td data-detail="last-seen">${(node.last_seen_ms / 1000).toFixed(1)}s ago</td></tr>
            <tr><th>Uptime</th><td data-detail="uptime">${uptime}</td></tr>
            <tr><th>Vendor Status</th><td data-detail="vendor-status">${esc(node.vendor_status_code)}</td></tr>
            ${result ? `
                <tr><th>SW Version</th><td>${esc(result.sw_major)}.${esc(result.sw_minor)}${(result.sw_optional_field_flags & 1) ? ` (${result.sw_vcs_commit.toString(16).padStart(8, '0')})` : ''}</td></tr>
                <tr><th>HW Version</th><td>${esc(result.hw_major)}.${esc(result.hw_minor)}</td></tr>
                <tr><th>Unique ID</th><td>${Array.from(result.hw_unique_id).map(b => b.toString(16).padStart(2, '0')).join(':')}</td></tr>
            ` : ''}
        `;
        detail.style.display = '';
        dronecanTab.showParams(nodeId);
    });
};

dronecanTab.showParams = function (nodeId) {
    const container = document.getElementById('dronecan-params');
    if (!container) return;
    container.innerHTML = `<p>${i18n.getMessage('dronecanParamsLoading')}</p>`;

    const params = [];

    function fetchParam(index) {
        if (index > 254) { renderParams(); return; } // DroneCAN param index is 8-bit (0-254 valid)
        if (nodeId !== currentDetailNodeId) return;
        dronecanAsyncPoll(11, nodeId, { index, is_write: false }, (err, result) => {
            if (nodeId !== currentDetailNodeId) return;
            if (err || !result || !result.name) {
                renderParams();
                return;
            }
            params.push({ index, name: result.name, value_type: result.value_type, value: result.value,
                min: result.min, max: result.max });
            fetchParam(index + 1);
        });
    }

    function renderParams() {
        if (params.length === 0) {
            container.innerHTML = `<p>${i18n.getMessage('dronecanNoParams')}</p>`;
            return;
        }
        const TYPE_LABELS = ['', 'INT', 'FLOAT', 'BOOL', 'STRING'];
        const fmtNumeric = (v, type) => {
            if (v === undefined) return '—';
            return type === PARAM_TYPE_FLOAT ? Number(v).toFixed(3) : String(v);
        };
        const lblWrite       = i18n.getMessage('dronecanParamWrite');
        const lblSaveEeprom  = i18n.getMessage('dronecanSaveToEeprom');
        const lblRestartNode = i18n.getMessage('dronecanRestartNode');
        const thIndex = i18n.getMessage('dronecanParamColIndex');
        const thName  = i18n.getMessage('dronecanParamColName');
        const thType  = i18n.getMessage('dronecanParamColType');
        const thValue = i18n.getMessage('dronecanParamColValue');
        const thRange = i18n.getMessage('dronecanParamColRange');
        let html = `<table><thead><tr><th>${thIndex}</th><th>${thName}</th><th>${thType}</th><th>${thValue}</th><th>${thRange}</th><th></th></tr></thead><tbody>`;
        params.forEach(p => {
            const valStr = p.value_type === PARAM_TYPE_BOOL ? (p.value ? 'true' : 'false') : String(p.value);
            const hasRange = (p.value_type === PARAM_TYPE_INT || p.value_type === PARAM_TYPE_FLOAT) && (p.min !== undefined || p.max !== undefined);
            const rangeStr = hasRange
                ? `${fmtNumeric(p.min, p.value_type)} … ${fmtNumeric(p.max, p.value_type)}`
                : '—';
            html += `<tr>
                <td>${p.index}</td>
                <td>${esc(p.name)}</td>
                <td>${TYPE_LABELS[p.value_type] || esc(String(p.value_type))}</td>
                <td><input class="param-input" data-index="${p.index}" data-type="${p.value_type}" value="${esc(valStr)}"></td>
                <td class="param-range">${esc(rangeStr)}</td>
                <td><button class="param-write" data-index="${p.index}">${lblWrite}</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        html += `<div class="param-actions"><button class="param-action-btn param-save-eeprom">${lblSaveEeprom}</button> <button class="param-action-btn param-restart-node">${lblRestartNode}</button></div>`;
        container.innerHTML = html;

        container.querySelector('.param-save-eeprom').addEventListener('click', function () {
            const btn = this;
            btn.disabled = true;
            btn.textContent = '...';
            dronecanAsyncPoll(10, nodeId, { opcode: 0 }, (err, result) => {
                btn.textContent = (!err && result && result.ok)
                    ? i18n.getMessage('dronecanSaved') : i18n.getMessage('dronecanFailed');
                btn.disabled = false;
                setTimeout(() => { btn.textContent = i18n.getMessage('dronecanSaveToEeprom'); }, 2000);
            });
        });

        container.querySelector('.param-restart-node').addEventListener('click', function () {
            const btn = this;
            btn.disabled = true;
            btn.textContent = '...';
            dronecanAsyncPoll(5, nodeId, null, (err, result) => {
                btn.textContent = (!err && result && result.ok)
                    ? i18n.getMessage('dronecanRestarting') : i18n.getMessage('dronecanFailed');
                btn.disabled = false;
                setTimeout(() => { btn.textContent = i18n.getMessage('dronecanRestartNode'); }, 3000);
            });
        });

        container.querySelectorAll('.param-write').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                const input = container.querySelector(`.param-input[data-index="${idx}"]`);
                const param = params.find(p => p.index === idx);
                if (!input || !param) return;

                const writeValue = input.value;
                const payload = { index: idx, is_write: true, value_type: param.value_type, name: param.name };
                switch (param.value_type) {
                    case PARAM_TYPE_INT:    payload.value = Number(writeValue); break;
                    case PARAM_TYPE_FLOAT:  payload.value = parseFloat(writeValue); break;
                    case PARAM_TYPE_BOOL:   payload.value = writeValue === 'true' || writeValue === '1'; break;
                    case PARAM_TYPE_STRING: payload.value = writeValue; break;
                }

                if (param.value_type === PARAM_TYPE_INT || param.value_type === PARAM_TYPE_FLOAT) {
                    const num = Number(payload.value);
                    // compare in BigInt domain if the bound exceeds safe integer range
                    const cmp = bound => typeof bound === 'bigint' ? BigInt(Math.trunc(num)) : num;
                    const tooLow  = param.min !== undefined && cmp(param.min) < param.min;
                    const tooHigh = param.max !== undefined && cmp(param.max) > param.max;
                    if (tooLow || tooHigh) {
                        input.style.outline = '2px solid #cc0000';
                        const lo = param.min !== undefined ? param.min : '—';
                        const hi = param.max !== undefined ? param.max : '—';
                        input.title = i18n.getMessage('dronecanParamRangeMustBeBetween', [lo, hi]);
                        btn.textContent = i18n.getMessage('dronecanParamOutOfRange');
                        setTimeout(() => { btn.textContent = i18n.getMessage('dronecanParamWrite'); }, 2000);
                        return;
                    }
                }
                input.style.outline = '';
                input.title = '';

                btn.disabled = true;
                btn.textContent = '...';
                dronecanAsyncPoll(11, nodeId, payload, (err, result) => {
                    if (!err && result) {
                        param.value = result.value;
                        input.value = param.value_type === PARAM_TYPE_BOOL ? (result.value ? 'true' : 'false') : String(result.value);
                        btn.textContent = i18n.getMessage('OK');
                    } else {
                        btn.textContent = i18n.getMessage('dronecanParamError');
                    }
                    btn.disabled = false;
                    setTimeout(() => { btn.textContent = i18n.getMessage('dronecanParamWrite'); }, 2000);
                });
            });
        });
    }

    fetchParam(0);
};

dronecanTab.saveConfig = function () {
    const bitrate = $('#dronecan-bitrate').val();
    const nodeId = parseInt($('#dronecan-node-id').val(), 10);
    if (nodeId >= 126 && !confirm(i18n.getMessage('dronecanNodeIdReservedWarning'))) return;
    mspHelper.setSetting('dronecan_bitrate_kbps', bitrate, function () {
        mspHelper.setSetting('dronecan_node_id', nodeId, function () {
            mspHelper.saveToEeprom(function () {
                GUI.log(i18n.getMessage('configurationEepromSaved'));
                MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                    GUI.log(i18n.getMessage('deviceRebooting'));
                    GUI.handleReconnect($('.tab_dronecan a'));
                });
            });
        });
    });
};

dronecanTab.cleanup = function (callback) {
    interval.remove('dronecan_refresh');
    currentDetailNodeId = null;
    nameCache = {}; // prevent stale names from a previous vehicle appearing on reconnect
    if (callback) callback();
};

export default dronecanTab;
