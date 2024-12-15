'use strict'
import { error } from 'jquery';
import { GUI } from './gui';

const serialRXProtocolls = [
{
    name : "Flight Controller Proxy",
    baudRate: 115200,
    stopBits: "One",
    parity: "None"
},
{
    name : "SBus",
    baudRate: 100000,
    stopBits: "Two",
    parity: "Even"
},
{
    name : "SBus Fast",
    baudRate: 200000,
    stopBits: "Two",
    parity: "Even"
},
{
    name : "Crossfire/Ghost",
    baudRate: 420000,
    stopBits: "One",
    parity: "None"
},
{
    name : "FPort/IBus/Spektrum/SRXL2/SUMD",
    baudRate: 115200,
    stopBits: "One",
    parity: "None"
},
{
    name : "JETI EX Bus",
    baudRate: 125000,
    stopBits: "One",
    parity: "None"
},
];

var SitlSerialPortUtils = {

    portsList: [],
    stopPolling: false,

    getProtocolls: function() {
        return serialRXProtocolls;
    },

    getDevices: function(callback) {
        window.electronAPI.listSerialDevices().then(devices => callback(devices));
    },

    pollSerialPorts: function(callback) {
        this.getDevices(devices => {
            if (!this.arraysEqual(this.portsList, devices)) {
               this.portsList = devices;
                if (callback)
                    callback(this.portsList);
            }

        });
        if (!this.stopPolling) {
            setTimeout(() => { this.pollSerialPorts(callback) }, 250);
        } else {
            this.stopPolling = false;
        }
    },

    resetPortsList: function() {
        this.portsList = [];
    },

    stopPollSerialPorts: function()
    {
        this.stopPolling = true;
    },

    arraysEqual: function(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;

        for (var i = 0; i < a.length; ++i) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }
}

var SITLProcess = {

    spawn : null,
    isRunning: false,
    processHandle: null,

    deleteEepromFile(filename) {
        window.electronAPI.rm(`${window.electronAPI.appGetPath('userData')}/${filename}`).then(error => {
            if (error) {
                GUI.log(`Unable to reset Demo mode: ${error}`);
            }
        });
    },

    start: function(eepromFileName, sim, useIMU, simIp, simPort, channelMap, serialPortOptions, callback) {

        if (this.isRunning)
            this.stop();

        var sitlExePath, eepromPath;
        var path = window.electronAPI.appGetPath('userData');
        if (GUI.operating_system == 'Windows') {
            sitlExePath = '/windows/inav_SITL.exe';
            eepromPath = `${path}\\${eepromFileName}`
        } else if (GUI.operating_system == 'Linux') {
            sitlExePath = '/linux/inav_SITL';
            eepromPath = `${path}/${eepromFileName}`
            window.electronAPI.chmod(sitlExePath, 0o755).then(err => {
                if (err)
                    console.log(err);
            });
        } else if (GUI.operating_system == 'MacOS') {
            sitlExePath = 'macos/inav_SITL';
            eepromPath = `${path}/${eepromFileName}`
            window.electronAPI.chmod(sitlExePath, 0o755).then(err => {
                if (err)
                    console.log(err);
            });
 
        } else {
            return;
        }

        var args = [];
        args.push(`--path=${eepromPath}`);

        if (sim) {
            args.push(`--sim=${sim}`);
            if (useIMU)
                args.push("--useimu")

            if (simIp)
                args.push(`--simip=${simIp}`);

            if (simPort)
                args.push(`--simport=${simPort}`);

            if (channelMap)
                args.push(`--chanmap=${channelMap}`)
        }

        if (serialPortOptions != null) {
            var protocoll = serialRXProtocolls.find(proto => {
                return proto.name == serialPortOptions.protocollName;
            });

            if (protocoll && protocoll.name != "manual") {
                args.push(`--serialport=${serialPortOptions.serialPort}`)
                args.push(`--baudrate=${protocoll.baudRate}`);
                args.push(`--stopbits=${protocoll.stopBits}`)
                args.push(`--parity=${protocoll.parity}`)
                if ( protocoll.name == "Flight Controller Proxy") {
                    args.push(`--fcproxy`);
                } else {
                    args.push(`--serialuart=${serialPortOptions.serialUart}`);
                }
            } else {
                args.push(`--serialport=${serialPortOptions.serialPort}`)
                args.push(`--baudrate=${serialPortOptions.baudRate}`);
                args.push(`--stopbits=${serialPortOptions.stopBits}`)
                args.push(`--parity=${serialPortOptions.parity}`)
                args.push(`--serialuart=${serialPortOptions.serialUart}`);
            }
        }

        if (callback) {
            callback( sitlExePath + " " + args.join(" ") + "\n");
        }
        this.spawn(sitlExePath, args, callback);
    },

    spawn: function(path, args, callback) {

        var opts = undefined;
        if (GUI.operating_system == 'Linux')
            opts = { useShell: true };

        this.processHandle = window.electronAPI.startChildProcess(path, args, opts);

        if (this.processHandle == -1) {
            this.isRunning = false;
            return;
        }

        this.isRunning = true;

        window.electronAPI.onChildProcessStdout(data => {
            if (callback)
                callback(data);
        });

        window.electronAPI.onChildProcessStderr(data => {
            if (callback)
                callback(data);
        });

        window.electronAPI.onChildProcessError(error => {
            if (callback)
                callback(error);
            this.isRunning = false;
        });
    },

    stop: function() {
        if (this.isRunning) {
            this.isRunning = false;
            window.electronAPI.killChildProcess(this.processHandle);
            this.processHandle = null;
        }
    }
};

export { SITLProcess, SitlSerialPortUtils };
