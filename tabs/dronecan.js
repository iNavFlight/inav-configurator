'use strict';

import MSPCodes from './../js/msp/MSPCodes';
import MSP from './../js/msp';
import mspHelper from './../js/msp/MSPHelper';
import GUI from './../js/gui';
import FC from './../js/fc';
import i18n from './../js/localization';
import dialog from './../js/dialog';
import interval from './../js/intervals';
import { DRONECAN_ASYNC_REQUEST_STATUS_OK, DRONECAN_ASYNC_REQUEST_STATUS_BUSY, shouldRetryBusyRequest } from './../js/dronecanAsyncRetry';
import { isValidDronecanNodeId } from './../js/dronecanNodeIdValidation';
import { isValidIntParamValue, isValidFloatParamValue } from './../js/dronecanParamValidation';

const HEALTH_LABELS = ['OK', 'WARNING', 'ERROR', 'CRITICAL'];
const HEALTH_CLASSES = ['health-ok', 'health-warning', 'health-error', 'health-critical'];
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const POLL_INTERVAL_MS  = 75;
const POLL_MAX_ATTEMPTS = 34; // 34 polls × 75 ms ≈ 2.5 s total window
const MODE_LABELS = ['OPERATIONAL', 'INITIALIZATION', 'MAINTENANCE', 'SOFTWARE_UPDATE', 'UNKNOWN_4', 'UNKNOWN_5', 'UNKNOWN_6', 'OFFLINE']; // modes 0-3 per DroneCAN NodeStatus; 4-6 reserved by spec
const PARAM_TYPE_INT    = 1;
const PARAM_TYPE_FLOAT  = 2;
const PARAM_TYPE_BOOL   = 3;
const PARAM_TYPE_STRING = 4;
const DRONECAN_SERVICE_GETNODEINFO    = 1;
const DRONECAN_SERVICE_RESTART_NODE   = 5;
const DRONECAN_SERVICE_EXECUTE_OPCODE = 10;
const DRONECAN_SERVICE_PARAM_GETSET   = 11;
const DRONECAN_ASYNC_STATE_READY         = 2;
const DRONECAN_ASYNC_STATE_ERROR         = 3;
const DRONECAN_EXECUTE_OPCODE_SAVE       = 0;

function getModeLabel(mode) {
    return (mode < MODE_LABELS.length && MODE_LABELS[mode]) ? MODE_LABELS[mode] : `MODE_${mode}`;
}

const dronecanTab = {};
let nameCache = {};
let currentDetailNodeId = null;

function encodeParamValueBytes(value_type, value) {
    switch (value_type) {
        case PARAM_TYPE_INT: {
            const v = typeof value === 'bigint' ? value : BigInt(Math.trunc(value));
            const bytes = [];
            for (let i = 0; i < 8; i++) bytes.push(Number((v >> BigInt(i * 8)) & 0xFFn));
            return bytes;
        }
        case PARAM_TYPE_FLOAT:
            return Array.from(new Uint8Array(new Float32Array([value]).buffer));
        case PARAM_TYPE_BOOL:
            return [value ? 1 : 0];
        case PARAM_TYPE_STRING: {
            const enc = new TextEncoder().encode(String(value).slice(0, 63));
            return [enc.length, ...enc];
        }
        default:
            return [];
    }
}

function buildParamGetSetPayload(params) {
    const payload = [params.index & 0xFF, (params.index >> 8) & 0xFF, params.is_write ? 1 : 0];
    if (!params.is_write) return payload;

    payload.push(params.value_type, ...encodeParamValueBytes(params.value_type, params.value));
    const nameEnc = new TextEncoder().encode(String(params.name || '').slice(0, 92));
    payload.push(nameEnc.length, ...nameEnc);
    return payload;
}

function buildAsyncRequestPayload(service_id, node_id, params) {
    const payload = [service_id & 0xFF, (service_id >> 8) & 0xFF, node_id];
    if (service_id === DRONECAN_SERVICE_PARAM_GETSET && params) {
        payload.push(...buildParamGetSetPayload(params));
    } else if (service_id === DRONECAN_SERVICE_EXECUTE_OPCODE && params) {
        payload.push(params.opcode);
    }
    return payload;
}

function dronecanAsyncPoll(service_id, node_id, params, onDone, requestAttempts = 0) {
    const reqPayload = buildAsyncRequestPayload(service_id, node_id, params);

    MSP.send_message(MSPCodes.MSP2_INAV_DRONECAN_ASYNC_REQUEST, reqPayload, false, () => {
        const req = FC.DRONECAN_ASYNC_REQUEST;
        if (req?.status !== DRONECAN_ASYNC_REQUEST_STATUS_OK) {
            // The async slot is a single shared resource — BUSY is a normal,
            // expected outcome when another poll (e.g. background node-name
            // fetching) is using it, not a terminal error. Retry with the
            // same backoff budget used for result polling below.
            if (shouldRetryBusyRequest(req?.status, requestAttempts, POLL_MAX_ATTEMPTS)) {
                setTimeout(() => dronecanAsyncPoll(service_id, node_id, params, onDone, requestAttempts + 1), POLL_INTERVAL_MS);
                return;
            }
            onDone(req?.status === DRONECAN_ASYNC_REQUEST_STATUS_BUSY ? new Error('busy') : new Error('not_ready'), null);
            return;
        }
        const expectedSeq = req.seq;
        let attempts = 0;
        const poll = () => {
            MSP.send_message(MSPCodes.MSP2_INAV_DRONECAN_ASYNC_RESULT, false, false, () => {
                const r = FC.DRONECAN_ASYNC_RESULT;
                if (!r || r.seq !== expectedSeq ||
                    r.service_id !== service_id || r.node_id !== node_id) {
                    if (++attempts < POLL_MAX_ATTEMPTS) { setTimeout(poll, POLL_INTERVAL_MS); }
                    else { onDone(new Error('stale'), null); }
                    return;
                }
                if (r.state === DRONECAN_ASYNC_STATE_READY) { onDone(null, r); }
                else if (r.state === DRONECAN_ASYNC_STATE_ERROR) { onDone(new Error('error'), null); }
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
    dronecanAsyncPoll(DRONECAN_SERVICE_GETNODEINFO, node.nodeID, null, (err, result) => {
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
                return mspHelper.getSetting('dronecan_use_dna_server');
            }).then(data => {
                if (data) $('#dronecan-use-dna-server').prop('checked', data.value !== 0);
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
        const lastSeen = i18n.getMessage('dronecanSecondsAgo', [(node.last_seen_ms / 1000).toFixed(1)]);

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

    // Background name-fetching and the per-node param detail view both poll
    // the FC's single shared async slot; running both at once causes BUSY
    // collisions. Defer name-fetching until the detail view closes.
    if (currentDetailNodeId === null) {
        fetchNamesSequentially(nodesToFetch, 0, tbody);
    }
    if (currentDetailNodeId !== null) {
        const liveNode = nodes.find(n => n.nodeID === currentDetailNodeId);
        if (liveNode) {
            const detail = document.getElementById('dronecan-node-detail');
            const health = liveNode.health < HEALTH_LABELS.length ? liveNode.health : 3;
            const uptime = `${Math.floor(liveNode.uptime_sec / 3600)}h ${Math.floor((liveNode.uptime_sec % 3600) / 60)}m ${liveNode.uptime_sec % 60}s`;
            const modeLabel = getModeLabel(liveNode.mode);
            const set = (attr, val) => { const el = detail.querySelector(`[data-detail="${attr}"]`); if (el) el.textContent = val; };
            set('health', HEALTH_LABELS[health]);
            set('mode', modeLabel);
            set('last-seen', i18n.getMessage('dronecanSecondsAgo', [(liveNode.last_seen_ms / 1000).toFixed(1)]));
            set('uptime', uptime);
            set('vendor-status', liveNode.vendor_status_code);
        } else {
            document.getElementById('dronecan-node-detail').style.display = 'none';
            currentDetailNodeId = null;
        }
    }
};

dronecanTab.showDetail = function (nodeId) {
    currentDetailNodeId = nodeId;
    const node = FC.DRONECAN_NODES.find(n => n.nodeID === nodeId);
    if (!node) return;
    
    dronecanAsyncPoll(DRONECAN_SERVICE_GETNODEINFO, nodeId, null, (err, result) => {
        if (nodeId !== currentDetailNodeId) return;
        const detail = document.getElementById('dronecan-node-detail');
        const tbody  = document.getElementById('dronecan-detail-tbody');
        const health   = node.health < HEALTH_LABELS.length ? node.health : 3;
        const uptime   = result ? `${Math.floor(node.uptime_sec / 3600)}h ${Math.floor((node.uptime_sec % 3600) / 60)}m ${node.uptime_sec % 60}s` : '—';
        const modeLabel = getModeLabel(node.mode);

        let nameCell = '—';
        if (result) {
            nameCell = esc(result.name);
        } else if (err) {
            nameCell = i18n.getMessage('dronecanNameError');
        }

        let versionRows = '';
        if (result) {
            const swCommitSuffix = (result.sw_optional_field_flags & 1)
                ? ` (${result.sw_vcs_commit.toString(16).padStart(8, '0')})`
                : '';
            versionRows = `
                <tr><th>SW Version</th><td>${esc(result.sw_major)}.${esc(result.sw_minor)}${swCommitSuffix}</td></tr>
                <tr><th>HW Version</th><td>${esc(result.hw_major)}.${esc(result.hw_minor)}</td></tr>
                <tr><th>Unique ID</th><td>${Array.from(result.hw_unique_id).map(b => b.toString(16).padStart(2, '0')).join(':')}</td></tr>
            `;
        }

        tbody.innerHTML = `
            <tr><th>Node ID</th><td>${esc(nodeId)}</td></tr>
            <tr><th>Name</th><td class="dronecan-detail-name">${nameCell}</td></tr>
            <tr><th>Health</th><td data-detail="health">${HEALTH_LABELS[health]}</td></tr>
            <tr><th>Mode</th><td data-detail="mode">${esc(modeLabel)}</td></tr>
            <tr><th>Last Seen</th><td data-detail="last-seen">${i18n.getMessage('dronecanSecondsAgo', [(node.last_seen_ms / 1000).toFixed(1)])}</td></tr>
            <tr><th>Uptime</th><td data-detail="uptime">${uptime}</td></tr>
            <tr><th>Vendor Status</th><td data-detail="vendor-status">${esc(node.vendor_status_code)}</td></tr>
            ${versionRows}
        `;
        detail.style.display = '';
        dronecanTab.showParams(nodeId);
    });
};

function paramValueToString(value_type, value) {
    if (value_type === PARAM_TYPE_BOOL) {
        return value ? 'true' : 'false';
    }
    return String(value);
}

function convertParamValue(value_type, writeValue) {
    switch (value_type) {
        case PARAM_TYPE_INT:
            try { return BigInt(writeValue); } catch { return Number.NaN; }
        case PARAM_TYPE_FLOAT:  return Number.parseFloat(writeValue);
        case PARAM_TYPE_BOOL:   return writeValue === 'true' || writeValue === '1';
        case PARAM_TYPE_STRING:
        default:                return writeValue;
    }
}

function validateNumericParam(param, value) {
    const isInt = param.value_type === PARAM_TYPE_INT;
    if (isInt ? !isValidIntParamValue(value) : !isValidFloatParamValue(value)) {
        return { ok: false, message: i18n.getMessage('dronecanParamOutOfRange') };
    }
    const toBig = b => typeof b === 'bigint' ? b : BigInt(Math.round(b));
    const tooLow  = param.min !== undefined && (isInt ? value < toBig(param.min) : value < Number(param.min));
    const tooHigh = param.max !== undefined && (isInt ? value > toBig(param.max) : value > Number(param.max));
    if (tooLow || tooHigh) {
        const lo = param.min !== undefined ? param.min : '—';
        const hi = param.max !== undefined ? param.max : '—';
        return { ok: false, message: i18n.getMessage('dronecanParamRangeMustBeBetween', [lo, hi]) };
    }
    return { ok: true };
}

function flagParamInputError(input, btn, message) {
    input.style.outline = '2px solid #cc0000';
    input.title = message;
    btn.textContent = i18n.getMessage('dronecanParamOutOfRange');
    setTimeout(() => { btn.textContent = i18n.getMessage('dronecanParamWrite'); }, 2000);
}

function submitParamWrite(btn, nodeId, payload, param, input) {
    btn.disabled = true;
    btn.textContent = '...';
    dronecanAsyncPoll(DRONECAN_SERVICE_PARAM_GETSET, nodeId, payload, (err, result) => {
        if (!err && result) {
            param.value = result.value;
            input.value = paramValueToString(param.value_type, result.value);
            btn.textContent = i18n.getMessage('OK');
        } else {
            btn.textContent = i18n.getMessage('dronecanParamError');
        }
        btn.disabled = false;
        setTimeout(() => { btn.textContent = i18n.getMessage('dronecanParamWrite'); }, 2000);
    });
}

function handleParamWriteClick(btn, container, params, nodeId) {
    const idx = Number.parseInt(btn.dataset.index, 10);
    const input = container.querySelector(`.param-input[data-index="${idx}"]`);
    const param = params.find(p => p.index === idx);
    if (!input || !param) return;

    const payload = {
        index: idx, is_write: true, value_type: param.value_type, name: param.name,
        value: convertParamValue(param.value_type, input.value),
    };

    if (param.value_type === PARAM_TYPE_INT || param.value_type === PARAM_TYPE_FLOAT) {
        const validation = validateNumericParam(param, payload.value);
        if (!validation.ok) {
            flagParamInputError(input, btn, validation.message);
            return;
        }
    }

    input.style.outline = '';
    input.title = '';
    submitParamWrite(btn, nodeId, payload, param, input);
}

function handleSaveToEeprom(btn, nodeId) {
    btn.disabled = true;
    btn.textContent = '...';
    dronecanAsyncPoll(DRONECAN_SERVICE_EXECUTE_OPCODE, nodeId, { opcode: DRONECAN_EXECUTE_OPCODE_SAVE }, (err, result) => {
        btn.textContent = (!err && result?.ok) ? i18n.getMessage('dronecanSaved') : i18n.getMessage('dronecanFailed');
        btn.disabled = false;
        setTimeout(() => { btn.textContent = i18n.getMessage('dronecanSaveToEeprom'); }, 2000);
    });
}

function handleRestartNode(btn, nodeId) {
    btn.disabled = true;
    btn.textContent = '...';
    dronecanAsyncPoll(DRONECAN_SERVICE_RESTART_NODE, nodeId, null, (err, result) => {
        btn.textContent = (!err && result?.ok) ? i18n.getMessage('dronecanRestarting') : i18n.getMessage('dronecanFailed');
        btn.disabled = false;
        setTimeout(() => { btn.textContent = i18n.getMessage('dronecanRestartNode'); }, 3000);
    });
}

dronecanTab.showParams = function (nodeId) {
    const container = document.getElementById('dronecan-params');
    if (!container) return;
    container.innerHTML = `<p>${i18n.getMessage('dronecanParamsLoading')}</p>`;

    const params = [];

    function fetchParam(index) {
        if (index > 8191) { renderParams(); return; } // UAVCAN v0 GetSet.Request uses a uint13 index (max 8191); firmware reads uint16
        if (nodeId !== currentDetailNodeId) return;
        dronecanAsyncPoll(DRONECAN_SERVICE_PARAM_GETSET, nodeId, { index, is_write: false }, (err, result) => {
            if (nodeId !== currentDetailNodeId) return;
            if (err || !result?.name) {
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
            const valStr = paramValueToString(p.value_type, p.value);
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

        const saveBtn = container.querySelector('.param-save-eeprom');
        saveBtn.addEventListener('click', () => handleSaveToEeprom(saveBtn, nodeId));

        const restartBtn = container.querySelector('.param-restart-node');
        restartBtn.addEventListener('click', () => handleRestartNode(restartBtn, nodeId));

        container.querySelectorAll('.param-write').forEach(btn => {
            btn.addEventListener('click', () => handleParamWriteClick(btn, container, params, nodeId));
        });
    }

    fetchParam(0);
};

function finishSaveConfigAndReboot() {
    GUI.log(i18n.getMessage('configurationEepromSaved'));
    MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, () => {
        GUI.log(i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_dronecan a'));
    });
}

function saveNodeIdAndReboot(nodeId, useDNAServer) {
    mspHelper.setSetting('dronecan_node_id', nodeId, () => {
        mspHelper.setSetting('dronecan_use_dna_server', useDNAServer, () => {
            mspHelper.saveToEeprom(finishSaveConfigAndReboot);
        });
    });
}

dronecanTab.saveConfig = function () {
    const bitrate = $('#dronecan-bitrate').val();
    const nodeId = Number.parseInt($('#dronecan-node-id').val(), 10);
    if (!isValidDronecanNodeId(nodeId)) {
        dialog.alert(i18n.getMessage('dronecanNodeIdInvalid'));
        return;
    }
    const useDNAServer = $('#dronecan-use-dna-server').prop('checked') ? 1 : 0;
    if (nodeId >= 126 && !confirm(i18n.getMessage('dronecanNodeIdReservedWarning'))) return;
    mspHelper.setSetting('dronecan_bitrate_kbps', bitrate, () => saveNodeIdAndReboot(nodeId, useDNAServer));
};

dronecanTab.cleanup = function (callback) {
    interval.remove('dronecan_refresh');
    currentDetailNodeId = null;
    nameCache = {}; // prevent stale names from a previous vehicle appearing on reconnect
    if (callback) callback();
};

export default dronecanTab;
