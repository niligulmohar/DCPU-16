var CPU = require("cpu");
var Assembler = require("assembler");
var GenericKeyboard = require("GenericKeyboard");
var assert = require("assert");
var assembleOnCpu = require("test_utils").assembleOnCpu;

module.exports = {
    'The keyboard should identify itself correctly': function () {
        var cpu = new CPU();
        var keyboard = new GenericKeyboard(cpu);
        assembleOnCpu(cpu, ["HWQ 0"]);
        cpu.run();
        assert.equal(cpu.get("a"), 0x7406);
        assert.equal(cpu.get("b"), 0x30cf);
        assert.equal(cpu.get("c"), 0x1);
    },
    'Interrupt 0 of the keyboard should clear its buffer': function () {
        var cpu = new CPU();
        var keyboard = new GenericKeyboard(cpu);
        keyboard.keyDown(65);
        keyboard.keyUp(65);
        assembleOnCpu(cpu, ["SET a, 0",
                            "HWI 0"]);
        cpu.run();
        assert.equal(keyboard.buffer.length, 0);
    },
    'Interrupt 1 of the keyboard should store zero in the C register if the keyboard buffer is empty': function () {
        var cpu = new CPU();
        var keyboard = new GenericKeyboard(cpu);
        assembleOnCpu(cpu, ["SET c, 0xffff",
                            "SET a, 1",
                            "HWI 0"]);
        cpu.run();
        assert.equal(cpu.get("c"), 0);
    },
    'Interrupt 1 of the keyboard should store the next key in the keyboard buffer in the C register': function () {
        var cpu = new CPU();
        var keyboard = new GenericKeyboard(cpu);
        keyboard.keyDown(65);
        keyboard.keyUp(65);
        keyboard.keyDown(66);
        keyboard.keyUp(66);
        assembleOnCpu(cpu, ["SET a, 1",
                            "HWI 0",
                            "SET x, c",
                            "HWI 0",
                            "SET y, c"]);
        cpu.run();
        assert.equal(cpu.get("x"), 65);
        assert.equal(cpu.get("y"), 66);
    },
    'Interrupt 2 of the keyboard should store the state of the key specified by the B register in the C register': function () {
        var cpu = new CPU();
        var keyboard = new GenericKeyboard(cpu);
        keyboard.keyDown(65);
        keyboard.keyUp(65);
        keyboard.keyDown(66);
        assembleOnCpu(cpu, ["SET a, 2",
                            "SET b, 65",
                            "HWI 0",
                            "SET x, c",
                            "SET b, 66",
                            "HWI 0",
                            "SET y, c"]);
        cpu.run();
        assert.equal(cpu.get("x"), 0);
        assert.equal(cpu.get("y"), 1);
    },
    'Interrupt 3 of the keyboard should enable keyboard interrupts with the message specified in the B register': function () {
        var cpu = new CPU();
        var keyboard = new GenericKeyboard(cpu);
        assembleOnCpu(cpu, ["IAS interrupt",
                            "SET a, 3",
                            "SET b, 42",
                            "HWI 0",
                            "BRK",
                            "BRK",
                            ":interrupt",
                            "SET x, a",
                            "RFI z"]);
        cpu.run();
        assert.equal(cpu.get("x"), 0);
        keyboard.keyDown(65);
        cpu.run();
        assert.equal(cpu.get("x"), 42);
    },
    'Interrupt 3 of the keyboard should disable keyboard interrupts if the B register is zero': function () {
        var cpu = new CPU();
        var keyboard = new GenericKeyboard(cpu);
        assembleOnCpu(cpu, ["IAS interrupt",
                            "SET a, 3",
                            "SET b, 0",
                            "HWI 0",
                            "BRK",
                            "BRK",
                            ":interrupt",
                            "SET x, 0xffff",
                            "RFI z"]);
        cpu.run();
        keyboard.keyDown(65);
        cpu.run();
        assert.equal(cpu.get("x"), 0);
    }
};
