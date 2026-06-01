 'use strict';

  import MSPCodes from './../js/msp/MSPCodes';
  import MSP from './../js/msp';
  import GUI from './../js/gui';
  import FC from './../js/fc';
  import i18n from './../js/localization';
  import interval from './../js/intervals';

  const HEALTH_LABELS = ['OK', 'WARNING', 'ERROR', 'CRITICAL'];
  const HEALTH_CLASSES = ['health-ok', 'health-warning', 'health-error', 'health-critical'];
  const MODE_LABELS = ['OPERATIONAL', 'INITIALIZATION', 'MAINTENANCE', 'SOFTWARE_UPDATE', '', '', '', 'OFFLINE'];

  const dronecanTab = {};
  const nameCache = {};


  dronecanTab.initialize = function (callback) {
      GUI.active_tab = this;

      import('./dronecan.html?raw').then(({default: html}) => {
          GUI.load(html, () => {
              i18n.localize();
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

      nodes.forEach(node => {
          const health = node.health < HEALTH_LABELS.length ? node.health : 3;
          const mode = node.mode < MODE_LABELS.length ? node.mode : 0;
          const lastSeen = (node.last_seen_ms / 1000).toFixed(1) + 's ago';

          const row = document.createElement('tr');
          row.dataset.nodeId = node.nodeID;
          row.innerHTML = `
              <td>${node.nodeID}</td>
              <td>—</td>
              <td><span class="health-badge ${HEALTH_CLASSES[health]}">${HEALTH_LABELS[health]}</span></td>
              <td>${MODE_LABELS[mode]}</td>
              <td>${lastSeen}</td>
          `;
          if (nameCache[node.nodeID] !== undefined) {
            row.cells[1].textContent = nameCache[node.nodeID];
          } else {
            MSP.send_message(MSPCodes.MSP2_INAV_DRONECAN_NODE_INFO, [node.nodeID], false, () => {
                if (FC.DRONECAN_NODE_INFO) {
                    nameCache[node.nodeID] = FC.DRONECAN_NODE_INFO.name;
                    const r = tbody.querySelector(`tr[data-node-id="${node.nodeID}"]`);
                    if (r) r.cells[1].textContent = FC.DRONECAN_NODE_INFO.name;
                }   
            }); 
          }   

          row.addEventListener('click', () => dronecanTab.showDetail(node.nodeID));
          tbody.appendChild(row);
      });
      

  };

  dronecanTab.showDetail = function (nodeId) {
      MSP.send_message(MSPCodes.MSP2_INAV_DRONECAN_NODE_INFO, [nodeId], false, () => {
          const info = FC.DRONECAN_NODE_INFO;
          if (!info) return;

          const detail = document.getElementById('dronecan-node-detail');
          const tbody = document.getElementById('dronecan-detail-tbody');
          const uptime = `${Math.floor(info.uptime_sec / 3600)}h ${Math.floor((info.uptime_sec % 3600) / 60)}m ${info.uptime_sec % 60}s`;

          tbody.innerHTML = `
              <tr><th>Node ID</th><td>${info.nodeID}</td></tr>
              <tr><th>Name</th><td>${info.name}</td></tr>
              <tr><th>Health</th><td>${HEALTH_LABELS[info.health] || info.health}</td></tr>
              <tr><th>Mode</th><td>${MODE_LABELS[info.mode] || info.mode}</td></tr>
              <tr><th>Last Seen</th><td>${(info.last_seen_ms / 1000).toFixed(1)}s ago</td></tr>
              <tr><th>Uptime</th><td>${uptime}</td></tr>
              <tr><th>Vendor Status</th><td>${info.vendor_status_code}</td></tr>
          `;
          detail.style.display = '';
      });
  };

  dronecanTab.cleanup = function (callback) {
      interval.remove('dronecan_refresh');
      if (callback) callback();
  };

  export default dronecanTab;
