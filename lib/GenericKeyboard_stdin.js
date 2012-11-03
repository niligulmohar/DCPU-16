var GenericKeyboard = require('./GenericKeyboard');

// For best results turn off canonical input (which includes
// buffering) and echo on your terminal: stty -icanon -iecho

function GenericKeyboard_stdin(cpu) {
    this.cpuInterface = new GenericKeyboard(cpu);
    process.stdin.setEncoding('utf8');
    var that = this;
    var translationMap = TOP_LEVEL_TRANSLATION_MAP;
    var escapeTimeout = null;
    process.stdin.on('data', function (chunk) {
        for (var i = 0, n = chunk.length; i < n; i++) {
            var charCode = chunk.charCodeAt(i);
            console.log(charCode.toString(16));
            if (escapeTimeout) {
                escapeTimeout = null;
                clearTimeout(escapeTimeout);
            }
            var translation = translationMap[charCode];
            if (translation !== undefined) {
                if (translation.length !== undefined) {
                    translation.forEach(function (key) {
                        that.press(key);
                    });
                } else {
                    escapeTimeout = setTimeout(function () {
                        escapeTimeout = null;
                        translationMap = TOP_LEVEL_TRANSLATION_MAP;
                    }, 5);
                    translationMap = translation;
                }
            } else if (charCode >= GenericKeyboard.ASCII_MIN &&
                       charCode <= GenericKeyboard.ASCII_MAX) {
                translationMap = TOP_LEVEL_TRANSLATION_MAP;
                that.press(charCode);
            }
        }
    });
    process.stdin.resume();
}

GenericKeyboard_stdin.prototype.press = function (keyCode) {
    this.cpuInterface.keyDown(keyCode);
    this.cpuInterface.keyUp(keyCode);
    //console.log(keyCode.toString(16));
};

var TOP_LEVEL_TRANSLATION_MAP = {
    0x7f: [GenericKeyboard.BACKSPACE],
    0xa: [GenericKeyboard.RETURN],
    0x1b: { 0x5b: { 0x33: { 0x7e: [GenericKeyboard.DELETE] },
                    0x41: [GenericKeyboard.UP],
                    0x42: [GenericKeyboard.DOWN],
                    0x43: [GenericKeyboard.RIGHT],
                    0x44: [GenericKeyboard.LEFT] } }
};


module.exports = GenericKeyboard_stdin;

