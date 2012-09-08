var LEM1802 = require('./LEM1802');

function LEM1802_ansi(cpu) {
    this.cpuInterface = new LEM1802(cpu);
    this.foreground = null;
    this.background = null;
    this.blink = null;
    this.borderColumns = "  ";
    this.borderRow = "                                    ";
}

var CSI="\x1b[";
var COLOR_SGRS = [30, 34, 32, 36, 31, 35, 33, 37, 90, 94, 92, 96, 91, 95, 93, 97];
var BLINK_SGRS = [25, 5];

function sgr(parameters) {
    return CSI + parameters.join(";") + "m";
}

function displayableCharacterFromCode(code) {
    return String.fromCharCode(code >= 0x20 ? code : 0x20);
}

LEM1802_ansi.prototype.write = function () {
    process.stdout.write.apply(process.stdout, arguments);
};

LEM1802_ansi.prototype.sgrReset = function () {
    this.write(sgr([0]));
    this.foreground = 0;
    this.background = 0;
    this.blink = 0;
};

LEM1802_ansi.prototype.clear = function () {
    this.write(CSI + "2J");
};

LEM1802_ansi.prototype.home = function () {
    this.write(CSI + "0;0H");
};

LEM1802_ansi.prototype.sgrBorder = function () {
    var background = this.cpuInterface.borderPaletteIndex;
    if (this.background !== background) {
        this.background = background;
        this.write(sgr([COLOR_SGRS[background] + 10]));
    }
};

LEM1802_ansi.prototype.sgrCharacter = function (character) {
    var parameters = [];
    if (this.foreground !== character.foreground) {
        this.foreground = character.foreground;
        parameters.push(COLOR_SGRS[character.foreground]);
    }
    if (this.background !== character.background) {
        this.background = character.background;
        parameters.push(COLOR_SGRS[character.background] + 10);
    }
    if (this.blink !== character.blink) {
        this.blink = character.blink;
        parameters.push(BLINK_SGRS[character.blink]);
    }
    if (parameters.length) {
        this.write(sgr(parameters));
    }
};

LEM1802_ansi.prototype.initDraw = function () {
    this.sgrReset();
    this.clear();
};

LEM1802_ansi.prototype.drawScreen = function () {
    this.home();
    this.sgrBorder();
    this.write(this.borderRow + "\n");
    for (var y = 0; y < 12; y++) {
        this.write(this.borderColumns);
        for (var x = 0; x < 32; x++) {
            var c = this.cpuInterface.getScreenCharacter(y, x);
            this.sgrCharacter(c);
            this.write(displayableCharacterFromCode(c.character));
        }
        this.sgrBorder();
        this.write(this.borderColumns + "\n");
    }
    this.write(this.borderRow + "\n");
    this.sgrReset();
};

module.exports = LEM1802_ansi;

