'use strict'

const { spawn } = require('node:child_process');
const pathMod = require('path');
const { chmod, rm } = require('node:fs');

const serialRXProtocolls = [
{
    name : "SBus",
    baudrate: 100000,
    stopBits: "Two",
    parity: "Even"
},
{
    name : "SBus Fast",
    baudrate: 200000,
    stopBits: "Two",
    parity: "Even"
},
{
    name : "Crossfire/Ghost",
    baudrate: 420000,
    stopBits: "One",
    parity: "None"
},
{
    name : "FPort/IBus/Spektrum/SRXL2/SUMD",
    baudrate: 115200,
    stopBits: "One",
    parity: "None"
},
{
    name : "JETI EX Bus",
    baudrate: 125000,
    stopBits: "One",
    parity: "None"
},
];

var Ser2TCP = {

    isRunning: false,
    process: null,
    portsList: [],
    stopPolling: false,

    getProtocolls: function() {
        return serialRXProtocolls;
    },

    start: function(comPort, serialPortOptions, ipAddress, tcpPort, callback) {

        if (this.isRunning)
            this.stop();

        var path;
        if (GUI.operating_system == 'Windows') {
            path = './resources/sitl/windows/Ser2TCP.exe'
        } else if (GUI.operating_system == 'Linux') {
            path = './resources/sitl/linux/Ser2TCP'
            chmod(path, 0o755, (err) => {
                if (err)
                    console.log(err);
            });
        } else {
            return;
        }

        var protocoll = serialRXProtocolls.find(proto => {
            return proto.name == serialPortOptions.protocollName;
        });

        var args = [];
        if (protocoll && protocoll.name != "manual") {
            args.push(`--comport=${comPort}`)
            args.push(`--baudrate=${protocoll.baudrate}`);
            args.push(`--stopbits=${protocoll.stopBits}`)
            args.push(`--parity=${protocoll.parity}`)
            args.push(`--ip=${ipAddress}`);
            args.push(`--tcpport=${tcpPort}`);
        } else {
            args.push(`--comport=${comPort}`)
            args.push(`--baudrate${proserialPortOptionstocoll.baudrate}`);
            args.push(`--stopbits=${protserialPortOptionsocoll.stopBits}`)
            args.push(`--parity=${serialPortOptions.parity}`)
            args.push(`--ip=${ipAddress}`);
            args.push(`--tcpport=${tcpPort}`);
        }

        var opts = undefined;
        if (GUI.operating_system == 'Linux')
            opts = { useShell: true };

        this.process = spawn(path, args, opts);
        this.isRunning = true;

        this.process.stdout.on('data', (data) => {
            if (callback)
                callback(data);
        });

        this.process.stderr.on('data', (data) => {
            if (callback)
                callback(data);
        });

        this.process.on('error', (error) => {
            if (callback)
                callback(error);
            this.isRunning = false;
        });

        this.process.on('exit', () => {
            if (this.isRunning)
               this.spawn(path, args, callback);
        });
    },

    stop: function() {
        if (this.isRunning) {
            this.isRunning = false;
            this.process.kill();
        }
    },

    getDevices: function(callback) {
        chrome.serial.getDevices((devices_array) => {
            var devices = [];
            devices_array.forEach((device) => {

                if (GUI.operating_system == 'Windows') {
                    var m = device.path.match(/COM\d?\d/g)
                        if (m)
                          devices.push(m[0]);
                } else {
                    if (device.displayName != null) {
			var m = device.path.match(/\/dev\/.*/)
                        if (m)
                          devices.push(m[0]);
                    }
		}
            });
            callback(devices);
        });
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
    process: null,

    deleteEepromFile(filename) {
        rm(`${nw.App.dataPath}/${filename}`, error => {
            if (error) {
                GUI.log(`Unable to reset Demo mode: ${error.message}`);
            }
        });
    },

    start: function(eepromFileName, sim, useIMU, simIp, simPort, channelMap, callback) {

        if (this.isRunning)
            this.stop();

        var sitlExePath, eepromPath;
        if (GUI.operating_system == 'Windows') {
            sitlExePath = './resources/sitl/windows/inav_SITL.exe'
            eepromPath = `${nw.App.dataPath}\\${eepromFileName}`
        } else if (GUI.operating_system == 'Linux') {
            sitlExePath = './resources/sitl/linux/inav_SITL';
            eepromPath = `${nw.App.dataPath}/${eepromFileName}`
            chmod(sitlExePath, 0o755, err => {
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
        this.spawn(sitlExePath, args, callback);
    },

    spawn: function(path, args, callback) {

        var opts = undefined;
        if (GUI.operating_system == 'Linux')
            opts = { useShell: true };

        this.process = spawn(path, args, opts);
        this.isRunning = true;

        this.process.stdout.on('data', (data) => {
            if (callback)
                callback(data);
        });

        this.process.stderr.on('data', (data) => {
            if (callback)
                callback(data);
        });

        this.process.on('error', (error) => {
            if (callback)
                callback(error);
            this.isRunning = false;
        });
    },

    stop: function() {
        if (this.isRunning) {
            this.isRunning = false;
            this.process.kill();
        }
    }
};
