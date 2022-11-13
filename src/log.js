
function toTwoDigitString(num) {
	var str = num.toString();
	if (str.length == 1) return "0" + str;
	return str;
};

/**
 * Logs a message with the time, and also handles errors.
 * @param {string|Error} message The thing to log.
 */
function log(message) {
	if (message instanceof Error) {
		message = message.stack;
	}
	var now = new Date();
	console.log(`[Minesweeper Bot] [${now.getFullYear()}-${toTwoDigitString(now.getMonth()+1)}-${toTwoDigitString(now.getDate())} ${toTwoDigitString(now.getHours())}:${toTwoDigitString(now.getMinutes())}:${toTwoDigitString(now.getSeconds())}] ${message}`);
}

module.exports = log;
