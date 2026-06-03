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
const MODE_LABELS = ['OPERATIONAL', 'INITIALIZATION', 'MAINTENANCE', 'SOFTWARE_UPDATE', 'UNKNOWN_4', 'UNKNOWN_5', 'UNKNOWN_6', 'OFFLINE'];

const dronecanTab = {};
const nameCache = {};

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
                case 1: { // INT
                    const v = BigInt(Math.trunc(params.value));
                    for (let i = 0; i < 8; i++) reqPayload.push(Number((v >> BigInt(i * 8)) & 0xFFn));
                    break;
                }
                case 2: { // FLOAT
                    const arr = new Float32Array([params.value]);
                    reqPayload.push(...new Uint8Array(arr.buffer));
                    break;
                }
                case 3: reqPayload.push(params.value ? 1 : 0); break;
                case 4: {
                    const enc = new TextEncoder().encode(String(params.value).slice(0, 63));
                    reqPayload.push(enc.length, ...enc);
                    break;
                }
            }
        }
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
                if (!r || r.seq !== expectedSeq) { onDone(new Error('stale'), null); return; }
                if (r.state === 2) { onDone(null, r); }
                else if (r.state === 3) { onDone(new Error('error'), null); }
                else if (++attempts < 34) { setTimeout(poll, 75); }
                else { onDone(new Error('timeout'), null); }
            });
        };
        setTimeout(poll, 75);
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
        return;
    }

    status.style.display = 'none';
    table.style.display = '';
    tbody.innerHTML = '';

    const nodesToFetch = [];
    nodes.forEach(node => {
        const health = node.health < HEALTH_LABELS.length ? node.health : 3;
        const modeLabel = (node.mode < MODE_LABELS.length && MODE_LABELS[node.mode]) ? MODE_LABELS[node.mode] : `MODE_${node.mode}`;
        const lastSeen = (node.last_seen_ms / 1000).toFixed(1) + 's ago';

        const row = document.createElement('tr');
        row.dataset.nodeId = node.nodeID;
        row.innerHTML = `
            <td>${node.nodeID}</td>
            <td>—</td>
            <td><span class="health-badge ${HEALTH_CLASSES[health]}">${HEALTH_LABELS[health]}</span></td>
            <td>${modeLabel}</td>
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
};

dronecanTab.showDetail = function (nodeId) {
    const node = FC.DRONECAN_NODES.find(n => n.nodeID === nodeId);
    if (!node) return;
    
    dronecanAsyncPoll(1, nodeId, null, (err, result) => {
        const detail = document.getElementById('dronecan-node-detail');
        const tbody  = document.getElementById('dronecan-detail-tbody');
        const uptime = result ? `${Math.floor(node.uptime_sec / 3600)}h ${Math.floor((node.uptime_sec % 3600) / 60)}m ${node.uptime_sec % 60}s` : '—';
        const modeLabel = (node.mode < MODE_LABELS.length && MODE_LABELS[node.mode]) ? MODE_LABELS[node.mode] : `MODE_${node.mode}`;
          
        tbody.innerHTML = `
            <tr><th>Node ID</th><td>${nodeId}</td></tr>
            <tr><th>Name</th><td class="dronecan-detail-name">${result ? result.name : (err ? 'Error' : '—')}</td></tr>
            <tr><th>Health</th><td>${HEALTH_LABELS[node.health] || node.health}</td></tr>
            <tr><th>Mode</th><td>${modeLabel}</td></tr>
            <tr><th>Last Seen</th><td>${(node.last_seen_ms / 1000).toFixed(1)}s ago</td></tr>
            <tr><th>Uptime</th><td>${uptime}</td></tr>
            <tr><th>Vendor Status</th><td>${node.vendor_status_code}</td></tr>
            ${result ? `
                <tr><th>SW Version</th><td>${result.sw_major}.${result.sw_minor}${(result.sw_optional_field_flags & 1) ? ` (${result.sw_vcs_commit.toString(16).padStart(8, '0')})` : ''}</td></tr>
                <tr><th>HW Version</th><td>${result.hw_major}.${result.hw_minor}</td></tr>
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
    container.innerHTML = '<p>Loading parameters...</p>';

    const params = [];

    function fetchParam(index) {
        dronecanAsyncPoll(11, nodeId, { index, is_write: false }, (err, result) => {
            if (err || !result || !result.name) {
                renderParams();
                return;
            }
            params.push({ index, name: result.name, value_type: result.value_type, value: result.value });
            fetchParam(index + 1);
        });
    }

    function renderParams() {
        if (params.length === 0) {
            container.innerHTML = '<p>No parameters.</p>';
            return;
        }
        const TYPE_LABELS = ['', 'INT', 'FLOAT', 'BOOL', 'STRING'];
        let html = '<table><thead><tr><th>#</th><th>Name</th><th>Type</th><th>Value</th><th></th></tr></thead><tbody>';
        params.forEach(p => {
            const valStr = p.value_type === 3 ? (p.value ? 'true' : 'false') : String(p.value);
            html += `<tr>
                <td>${p.index}</td>
                <td>${p.name}</td>
                <td>${TYPE_LABELS[p.value_type] || p.value_type}</td>
                <td><input class="param-input" data-index="${p.index}" data-type="${p.value_type}" value="${valStr}"></td>
                <td><button class="param-write" data-index="${p.index}">Write</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;


        container.querySelectorAll('.param-write').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                const input = container.querySelector(`.param-input[data-index="${idx}"]`);
                const param = params.find(p => p.index === idx);
                if (!input || !param) return;

                let writeValue = input.value;
                const payload = { index: idx, is_write: true, value_type: param.value_type };
                switch (param.value_type) {
                    case 1: payload.value = Number(writeValue); break;
                    case 2: payload.value = parseFloat(writeValue); break;
                    case 3: payload.value = writeValue === 'true' || writeValue === '1'; break;
                    case 4: payload.value = writeValue; break;
                }

                btn.disabled = true;
                btn.textContent = '...';
                dronecanAsyncPoll(11, nodeId, payload, (err, result) => {
                    if (!err && result) {
                        param.value = result.value;
                        input.value = param.value_type === 3 ? (result.value ? 'true' : 'false') : String(result.value);
                        btn.textContent = 'OK';
                    } else {
                        btn.textContent = 'ERR';
                    }
                    btn.disabled = false;
                    setTimeout(() => { btn.textContent = 'Write'; }, 2000);
                });
            });
        });
    }

    fetchParam(0);
};

dronecanTab.saveConfig = function () {
    const bitrate = $('#dronecan-bitrate').val();
    const nodeId = parseInt($('#dronecan-node-id').val());
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
    Object.keys(nameCache).forEach(k => delete nameCache[k]);
    if (callback) callback();
};

export default dronecanTab;
