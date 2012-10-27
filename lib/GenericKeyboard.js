(function (root) {
    function GenericKeyboard(cpu) {
        this.id = 0x30cf7406;
        this.version = 0x1;
        this.manufacturer = 0xe625af18;

        this.cpu = cpu;
        this.cpu.addDevice(this);

        this.buffer = [];
        this.keyState = {};
        this.interruptMessage = 0;
    }

    GenericKeyboard.BACKSPACE = 0x10;
    GenericKeyboard.RETURN = 0x11;
    GenericKeyboard.INSERT = 0x12;
    GenericKeyboard.DELETE = 0x13;
    GenericKeyboard.ASCII_MIN = 0x20;
    GenericKeyboard.ASCII_MAX = 0x7f;
    GenericKeyboard.UP = 0x80;
    GenericKeyboard.DOWN = 0x81;
    GenericKeyboard.LEFT = 0x82;
    GenericKeyboard.RIGHT = 0x83;
    GenericKeyboard.SHIFT = 0x90;
    GenericKeyboard.CONTROL = 0x91;

    GenericKeyboard.prototype.onInterrupt = function (callback) {
        switch (this.cpu.get("a")) {
        case INTERRUPTS.CLEAR_BUFFER:
            this.buffer = [];
            break;
        case INTERRUPTS.GET_NEXT:
            this.cpu.set("c", this.buffer.shift() || 0);
            break;
        case INTERRUPTS.GET_STATE:
            this.cpu.set("c", this.keyState[this.cpu.get("b")]);
            break;
        case INTERRUPTS.SET_INTERRUPT:
            this.interruptMessage = this.cpu.get("b");
            break;
        }
        return false;
    };

    GenericKeyboard.prototype.keyDown = function (key) {
        this.keyState[key] = 1;
        this.buffer.push(key);
        if (this.interruptMessage) {
            this.cpu.interrupt(this.interruptMessage);
        }
    };
    GenericKeyboard.prototype.keyUp = function (key) {
        this.keyState[key] = 0;
        if (this.interruptMessage) {
            this.cpu.interrupt(this.interruptMessage);
        }
    };

    var INTERRUPTS = {
        CLEAR_BUFFER: 0,
        GET_NEXT: 1,
        GET_STATE: 2,
        SET_INTERRUPT: 3
    };

    if (typeof module === 'undefined') {
        (root.DCPU16 = (root.DCPU16 || {})).GenericKeyboard = GenericKeyboard;
    } else {
        module.exports = GenericKeyboard;
    }

}(this));
