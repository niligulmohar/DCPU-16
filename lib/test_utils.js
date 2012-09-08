var CPU = require("cpu");
var Assembler = require("assembler");

function assembleOnCpu(cpu, lines) {
    var assembler = new Assembler(cpu);
    var code = lines.join("\n");
    assembler.compile(code + "\n BRK");
}

function runOnCpu() {
    var cpu = new CPU();
    assembleOnCpu(cpu, Array.prototype.slice.call(arguments, 0));
    cpu.run();
    return cpu;
}

function memoryForAssembly() {
    var cpu = new CPU();
    var assembler = new Assembler(cpu);
    var code = Array.prototype.join.call(arguments, "\n");
    assembler.compile(code + "\n end: DAT 0 \n .ORG 0xffff \n DAT end");
    return cpu.mem.slice(0, cpu.mem[0xffff]);
}

module.exports = {
    assembleOnCpu: assembleOnCpu,
    runOnCpu: runOnCpu,
    memoryForAssembly: memoryForAssembly
};