const r=`<h2>GPS wizard</h2>\r
<p>\r
    Configure GPS and port. If you unsure about serial port or protocol, click \`Skip\` to go to the next page.\r
    You can change those settings later with the configurator UI. If no GPS installed, choose <b>None</b>.\r
</p>\r
<div>\r
    <label for="wizard-gps-port">GPS Serial Port</label><select id="wizard-gps-port"></select>\r
</div>\r
<div style="display: none;" id="wizard-gps-baud-container">\r
    <label for="wizard-gps-baud">GPS Baud Rate</label><select id="wizard-gps-baud"></select>\r
</div>\r
<div style="display: none;" id="wizard-gps-protocol-container">\r
    <label for="wizard-gps-protocol">GPS Protocol</label><select id="wizard-gps-protocol"></select>\r
</div>`;export{r as default};
