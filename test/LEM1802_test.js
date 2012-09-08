var CPU = require("cpu");
var Assembler = require("assembler");
var LEM1802 = require("LEM1802");
var assert = require("assert");
var test_utils = require("test_utils");

var assembleOnCpu = test_utils.assembleOnCpu;

module.exports = {
    'The LEM1802 should identify itself correctly': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["HWQ 0"]);
        cpu.run();
        assert.equal(cpu.get("a"), 0xf615);
        assert.equal(cpu.get("b"), 0x7349);
        assert.equal(cpu.get("c"), 0x1802);
        assert.equal(cpu.get("x"), 0x8b36);
        assert.equal(cpu.get("y"), 0x1c6c);
    },

    'Interrupt 0 of the LEM1802 should set the address of video RAM': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["SET a, 0",
                            "SET b, 0xa000",
                            "HWI 0"]);
        cpu.run();
        assert.equal(display.screenMemoryMap, 0xa000);
    },

    'The onStartup method of the display should be called': function () {
        var started = false;
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        display.onStartup = function () { started = true; };
        assembleOnCpu(cpu, ["SET a, 0",
                            "SET b, 0xa000",
                            "HWI 0"]);
        cpu.run();
        assert.equal(started, true);
    },

    'Interrupt 1 of the LEM1802 should set the address of a user defined font': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["SET a, 1",
                            "SET b, 0xb000",
                            "HWI 0"]);
        cpu.run();
        assert.equal(display.fontMemoryMap, 0xb000);
    },

    'Interrupt 2 of the LEM1802 should set the address of a user defined palette': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["SET a, 2",
                            "SET b, 0xc000",
                            "HWI 0"]);
        cpu.run();
        assert.equal(display.paletteMemoryMap, 0xc000);
    },

    'Interrupt 3 of the LEM1802 should set the border color': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["SET a, 3",
                            "SET b, 8",
                            "HWI 0"]);
        cpu.run();
        assert.equal(display.borderPaletteIndex, 8);
    },

    'Interrupt 4 of the LEM1802 should dump the default font data to memory': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["SET [0x80ff], 0xffff",
                            "SET [0x8100], 0xffff",
                            "SET a, 4",
                            "SET b, 0x8000",
                            "HWI 0"]);
        cpu.run();
        var address = 0x8000 + ("A".charCodeAt(0)) * 2;
        assert.equal(cpu.get(address), 0x7e09);
        assert.equal(cpu.get(address + 1), 0x7e00);
        assert.equal(cpu.get(0x80ff), 0x0200);
        assert.equal(cpu.get(0x8100), 0xffff);
    },

    'Interrupt 4 of the LEM1802 should take 256 cycles to complete': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["SET a, 4",
                            "SET b, 0x1e",
                            "HWI 0"]);
        cpu.run();
        assert.equal(cpu.cycle, (1 + 1 + 4 + 256));
    },

    'Interrupt 5 of the LEM1802 should dump the default palette data to memory': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["SET [0x800f], 0xffff",
                            "SET [0x8010], 0xffff",
                            "SET a, 5",
                            "SET b, 0x8000",
                            "HWI 0"]);
        cpu.run();
        assert.equal(cpu.get(0x8006), 0x0a50);
        assert.equal(cpu.get(0x800f), 0x0fff);
        assert.equal(cpu.get(0x8010), 0xffff);
    },

    'Interrupt 5 of the LEM1802 should take 16 cycles to complete': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["SET a, 5",
                            "SET b, 0x1e",
                            "HWI 0"]);
        cpu.run();
        assert.equal(cpu.cycle, (1 + 1 + 4 + 16));
    },

    'LEM1802#getScreenCharacter should fail when no video RAM is mapped': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assert.throws(function () { display.getScreenCharacter(0, 0); });
    },

    'LEM1802#getScreenCharacter should properly decode video RAM': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["SET a, 0",
                            "SET b, 0x8000",
                            "HWI 0",
                            "SET [0x8001], 0x007f",
                            "SET [0x8002], 0x0080",
                            "SET [0x8020], 0x0f00",
                            "SET [0x8021], 0xf000"]);
        cpu.run();
        assert.eql(display.getScreenCharacter(0, 0), { character: 0, foreground: 0, background: 0, blink: 0 });
        assert.eql(display.getScreenCharacter(0, 1), { character: 0x7f, foreground: 0, background: 0, blink: 0 });
        assert.eql(display.getScreenCharacter(0, 2), { character: 0, foreground: 0, background: 0, blink: 1 });
        assert.eql(display.getScreenCharacter(1, 0), { character: 0, foreground: 0, background: 0xf, blink: 0 });
        assert.eql(display.getScreenCharacter(1, 1), { character: 0, foreground: 0xf, background: 0, blink: 0 });
    },

    'LEM1802#getFontCharacter should use the default font when no user font is mapped': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assert.eql([0x85f9, 0xb158], display.getFontCharacter(3));
    },

    'LEM1802#getFontCharacter should use the user font when it is mapped': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["SET a, 1",
                            "SET b, 0x8000",
                            "HWI 0",
                            "SET [0x8006], 0x1234",
                            "SET [0x8007], 0xcdef"]);
        cpu.run();
        assert.eql([0x1234, 0xcdef], display.getFontCharacter(3));
    },

    'LEM1802#getPaletteColor should use the default palette when no user palette is mapped': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assert.eql(0xa50, display.getPaletteColor(6));
    },

    'LEM1802#getPaletteColor should use the user palette when it is mapped': function () {
        var cpu = new CPU();
        var display = new LEM1802(cpu);
        assembleOnCpu(cpu, ["SET a, 2",
                            "SET b, 0x8000",
                            "HWI 0",
                            "SET [0x8006], 0x123"]);
        cpu.run();
        assert.eql(0x123, display.getPaletteColor(6));
    }
};
