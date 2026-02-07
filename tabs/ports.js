'use strict';

import mspHelper from './../js/msp/MSPHelper';
import MSPCodes from './../js/msp/MSPCodes';
import MSP from './../js/msp';
import GUI from './../js/gui';
import FC from './../js/fc';
import i18n from './../js/localization';
import serialPortHelper from './../js/serialPortHelper';
import jBox from 'jbox';
import {bridge, Platform} from '../js/bridge';

const portsTab = {};

portsTab.initialize = function (callback) {

    var columns = ['data', 'logging', 'sensors', 'telemetry', 'rx', 'peripherals'];
    var mspWarningModal;

    if (GUI.active_tab !== this) {
        GUI.active_tab = this;
    }

    mspHelper.loadSerialPorts(function () {
        import('./ports.html?raw').then(({default: html}) => GUI.load(html, on_tab_loaded_handler));
    });

    function checkMSPPortCount(excludeCheckbox) {
        let mspCount = 0;

        $('.tab-ports .portConfiguration').each(function () {
            const $portConfig = $(this);

            // Check each MSP checkbox in this port configuration
            $portConfig.find('input:checkbox[value="MSP"]').each(function() {
                const $checkbox = $(this);
                // Skip the checkbox we're currently changing (to get "before" count)
                if (excludeCheckbox && $checkbox.is(excludeCheckbox)) {
                    return;
                }
                if ($checkbox.is(':checked')) {
                    mspCount++;
                }
            });
        });

        return mspCount;
    }

    function showMSPWarning() {
        if (mspWarningModal && typeof mspWarningModal.open === 'function') {
            mspWarningModal.open();
        }
    }

    function update_ui() {

        $(".tab-ports").addClass("supported");

        var i,
            $elements;

        $elements = $('select.sensors_baudrate');
        for (i = 0; i < serialPortHelper.getBauds('SENSOR').length; i++) {
            $elements.append('<option value="' + serialPortHelper.getBauds('SENSOR')[i] + '">' + serialPortHelper.getBauds('SENSOR')[i] + '</option>');
        }

        $elements = $('select.msp_baudrate');
        for (i = 0; i < serialPortHelper.getBauds('MSP').length; i++) {
            $elements.append('<option value="' + serialPortHelper.getBauds('MSP')[i] + '">' + serialPortHelper.getBauds('MSP')[i] + '</option>');
        }

        $elements = $('select.telemetry_baudrate');
        for (i = 0; i < serialPortHelper.getBauds('TELEMETRY').length; i++) {
            $elements.append('<option value="' + serialPortHelper.getBauds('TELEMETRY')[i] + '">' + serialPortHelper.getBauds('TELEMETRY')[i] + '</option>');
        }

        $elements = $('select.peripherals_baudrate');
        for (i = 0; i < serialPortHelper.getBauds('PERIPHERAL').length; i++) {
            $elements.append('<option value="' + serialPortHelper.getBauds('PERIPHERAL')[i] + '">' + serialPortHelper.getBauds('PERIPHERAL')[i] + '</option>');
        }

        var ports_e = $('.tab-ports .ports');
        var port_configuration_template_e = $('#tab-ports-templates .portConfiguration');

        for (var portIndex = 0; portIndex < FC.SERIAL_CONFIG.ports.length; portIndex++) {
            var port_configuration_e = port_configuration_template_e.clone();
            var serialPort = FC.SERIAL_CONFIG.ports[portIndex];

            port_configuration_e.data('serialPort', serialPort);
            
            //Append only port different than USB VCP or UART 1 on Webassembly (serialEx port)
            if (serialPort.identifier == 20 || (bridge.getPlatform() === Platform.Web && serialPort.identifier == 0)) {
                continue;
            }          
  
            port_configuration_e.find('select.msp_baudrate').val(serialPort.msp_baudrate);
            port_configuration_e.find('select.telemetry_baudrate').val(serialPort.telemetry_baudrate);
            port_configuration_e.find('select.sensors_baudrate').val(serialPort.sensors_baudrate);
            port_configuration_e.find('select.peripherals_baudrate').val(serialPort.peripherals_baudrate);

            port_configuration_e.find('.identifier').text(serialPortHelper.getPortName(serialPort.identifier));
            if (serialPort.identifier >= 30) {
                port_configuration_e.find('.softSerialWarning').css("display", "inline")
            } else {
                port_configuration_e.find('.softSerialWarning').css("display", "none")
            }

            port_configuration_e.data('index', portIndex);
            port_configuration_e.data('port', serialPort);

            for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
                var column = columns[columnIndex];

                var functions_e = $(port_configuration_e).find('.functionsCell-' + column);
                let functions_e_id = "portFunc-" + column + "-" + portIndex;
                functions_e.attr("id", functions_e_id);

                for (i = 0; i < serialPortHelper.getRules().length; i++) {
                    var functionRule = serialPortHelper.getRules()[i];
                    var functionName = functionRule.name;

                    if (functionRule.groups.indexOf(column) == -1) {
                        continue;
                    }

                    var select_e;
                    if (column !== 'telemetry' && column !== 'peripherals' && column !== 'sensors') {
                        var checkboxId = 'functionCheckbox-' + portIndex + '-' + columnIndex + '-' + i;
                        functions_e.prepend('<span class="function"><input type="checkbox" class="togglemedium" id="' + checkboxId + '" value="' + functionName + '" /><label for="' + checkboxId + '"> ' + functionRule.displayName + '</label></span>');

                        if (serialPort.functions.indexOf(functionName) >= 0) {
                            var checkbox_e = functions_e.find('#' + checkboxId);
                            checkbox_e.prop("checked", true);
                        }

                    } else {

                        var selectElementName = 'function-' + column;
                        var selectElementSelector = 'select[name=' + selectElementName + ']';
                        select_e = functions_e.find(selectElementSelector);
                        
                        if (select_e.length == 0) {
                            functions_e.prepend('<span class="function"><select id="' + selectElementName + '" name="' + selectElementName + '" class="function-select ' + selectElementName + '" /></span>');
                            
                            functions_e.find('#' + selectElementName).on('change', () => {
                                updateDefaultBaud(functions_e_id, column);
                            });
                            
                            select_e = functions_e.find(selectElementSelector);
                            var disabledText = i18n.getMessage('portsTelemetryDisabled');
                            select_e.append('<option value="">' + disabledText + '</option>');
                        }
                        select_e.append('<option value="' + functionName + '">' + functionRule.displayName + '</option>');

                        if (serialPort.functions.indexOf(functionName) >= 0) {
                            select_e.val(functionName);
                        }
                    }
                }
            }
            ports_e.find('tbody').append(port_configuration_e);

                       
        }

        $('table.ports tbody').on('change', 'select', onSwitchChange);
        $('table.ports tbody').on('change', 'input', onSwitchChange);
    }

    function onSwitchChange(e) {
        let $cT  = $(e.currentTarget);

        let functionName = $cT.val();
        let rule = serialPortHelper.getRuleByName($cT.val());

        //if type is checkbox then process only if selected
        if ($cT.is('input[type="checkbox"]') && !$cT.is(':checked')) {
            return;
        }
        //if type select then process only if selected
        if ($cT.is('select') && !functionName) {
            return;
        }

        // Check if MSP checkbox was just checked
        if ($cT.is('input[type="checkbox"]') && $cT.val() === 'MSP' && $cT.is(':checked')) {
            // Count MSP ports excluding the one being changed to get "before" count
            const mspCountBefore = checkMSPPortCount($cT);
            // If we already had 2+ and are adding another, show warning
            if (mspCountBefore >= 2) {
                showMSPWarning();
            }
        }

        if (rule && rule.isUnique) {
            let $selects = $cT.closest('tr').find('.function-select');
            $selects.each(function (index, element) {

                let $element = $(element);

                if ($element.val() != functionName) {
                    $element.val('');
                }
            });

            let $checkboxes = $cT.closest('tr').find('input[type="checkbox"]');
            $checkboxes.each(function (index, element) {
                let $element = $(element);

                if ($element.val() != functionName) {
                    $element.prop('checked', false);
                    $element.trigger('change');
                }
            });
        }

    }

    function on_tab_loaded_handler() {

       i18n.localize();;

        update_ui();

        // Initialize the MSP warning modal
        mspWarningModal = new jBox('Modal', {
            width: 480,
            height: 200,
            closeButton: 'title',
            animation: false,
            title: i18n.getMessage('portsMspWarningTitle') || 'MSP Port Warning',
            content: $('#mspWarningContent')
        });

        // Check if more than 2 MSP ports are already configured on load
        const initialMspCount = checkMSPPortCount();
        if (initialMspCount > 2) {
            showMSPWarning();
        }

        $('a.save').on('click', on_save_handler);

        GUI.content_ready(callback);
    }

   function on_save_handler() {

        //Clear ports of any previous for serials different than USB VCP
        FC.SERIAL_CONFIG.ports = FC.SERIAL_CONFIG.ports.filter(item => item.identifier == 20)

        $('.tab-ports .portConfiguration').each(function () {

            var portConfiguration_e = this;

            var oldSerialPort = $(this).data('serialPort');

            if (oldSerialPort.identifier == 20) {
                return;
            }

            var functions = $(portConfiguration_e).find('input:checkbox:checked').map(function() {
                return this.value;
            }).get();

            var telemetryFunction = $(portConfiguration_e).find('select[name=function-telemetry]').val();
            if (telemetryFunction) {
                functions.push(telemetryFunction);
            }

            var peripheralFunction = $(portConfiguration_e).find('select[name=function-peripherals]').val();
            if (peripheralFunction) {
                functions.push(peripheralFunction);
            }

            var sensorsFunction = $(portConfiguration_e).find('select[name=function-sensors]').val();
            if (sensorsFunction) {
                functions.push(sensorsFunction);
            }

            var serialPort = {
                functions: functions,
                msp_baudrate: $(portConfiguration_e).find('.msp_baudrate').val(),
                telemetry_baudrate: $(portConfiguration_e).find('.telemetry_baudrate').val(),
                sensors_baudrate: $(portConfiguration_e).find('.sensors_baudrate').val(),
                peripherals_baudrate: $(portConfiguration_e).find('.peripherals_baudrate').val(),
                identifier: oldSerialPort.identifier
            };
            FC.SERIAL_CONFIG.ports.push(serialPort);
        });

        mspHelper.saveSerialPorts(save_to_eeprom);

        function save_to_eeprom() {
            MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, on_saved_handler);
        }

        function on_saved_handler() {
            GUI.log(i18n.getMessage('configurationEepromSaved'));

            GUI.tab_switch_cleanup(function() {
                MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, on_reboot_success_handler);
            });
        }

        function on_reboot_success_handler() {
            GUI.log(i18n.getMessage('deviceRebooting'));
            GUI.handleReconnect($('.tab_ports a'));
        }
    }
};

function updateDefaultBaud(baudSelect, column) {
    let section = $("#" + baudSelect);
    let portName = section.find('.function-' + column).val();
    let baudRate = (column === 'telemetry') ? "AUTO" : 115200;;

    let rule = serialPortHelper.getRuleByName(portName);

    if (rule && typeof rule.defaultBaud !== 'undefined') {
        baudRate = rule.defaultBaud;
    }

    section.find("." + column + "_baudrate").children('[value=' + baudRate + ']').prop('selected', true);
}

portsTab.cleanup = function (callback) {
    $('.jBox-wrapper').remove();
    if (callback) callback();
};

export default portsTab;
