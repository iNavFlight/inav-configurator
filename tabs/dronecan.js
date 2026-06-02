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

function fetchNamesSequentially(nodes, index, tbody) {
    if (index >= nodes.length) return;
    const node = nodes[index];
    MSP.send_message(MSPCodes.MSP2_INAV_DRONECAN_NODE_INFO, [node.nodeID], false, () => {
        const info = FC.DRONECAN_NODE_INFO;
        if (info && info.nodeID === node.nodeID) {
            nameCache[node.nodeID] = info.name;
            const r = tbody.querySelector(`tr[data-node-id="${node.nodeID}"]`);
            if (r) r.cells[1].textContent = info.name;
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
    MSP.send_message(MSPCodes.MSP2_INAV_DRONECAN_NODE_INFO, [nodeId], false, () => {
        const info = FC.DRONECAN_NODE_INFO;
        if (!info || info.nodeID !== nodeId) return;

        const detail = document.getElementById('dronecan-node-detail');
        const tbody = document.getElementById('dronecan-detail-tbody');
        const uptime = `${Math.floor(info.uptime_sec / 3600)}h ${Math.floor((info.uptime_sec % 3600) / 60)}m ${info.uptime_sec % 60}s`;
        const modeLabel = (info.mode < MODE_LABELS.length && MODE_LABELS[info.mode]) ? MODE_LABELS[info.mode] : `MODE_${info.mode}`;

        tbody.innerHTML = `
            <tr><th>Node ID</th><td>${info.nodeID}</td></tr>
            <tr><th>Name</th><td class="dronecan-detail-name"></td></tr>
            <tr><th>Health</th><td>${HEALTH_LABELS[info.health] || info.health}</td></tr>
            <tr><th>Mode</th><td>${modeLabel}</td></tr>
            <tr><th>Last Seen</th><td>${(info.last_seen_ms / 1000).toFixed(1)}s ago</td></tr>
            <tr><th>Uptime</th><td>${uptime}</td></tr>
            <tr><th>Vendor Status</th><td>${info.vendor_status_code}</td></tr>
            ${info.sw_major !== undefined ? `
                <tr><th>SW Version</th><td>${info.sw_major}.${info.sw_minor}${(info.sw_optional_field_flags & 1) ? ` (${info.sw_vcs_commit.toString(16).padStart(8, '0')})` : ''}</td></tr>
                <tr><th>HW Version</th><td>${info.hw_major}.${info.hw_minor}</td></tr>
                <tr><th>Unique ID</th><td>${Array.from(info.hw_unique_id).map(b => b.toString(16).padStart(2, '0')).join(':')}</td></tr>
            ` : ''}
        `;
        tbody.querySelector('.dronecan-detail-name').textContent = info.name;
        detail.style.display = '';
    });
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
