// Simple logger that also logs the time, and also logs errors.

function toTwoDigitString(num) {
	var str = num.toString();
	if (str.length == 1) return "0" + str;
	return str;
};

module.exports = function log(message) {
	if (message instanceof Error) {
		message = message.stack;
	}
	var now = new Date();
	console.log(`[Minesweeper Bot] [${now.getFullYear()}-${toTwoDigitString(now.getMonth()+1)}-${toTwoDigitString(now.getDate())} ${toTwoDigitString(now.getHours())}:${toTwoDigitString(now.getMinutes())}:${toTwoDigitString(now.getSeconds())}] ${message}`);
};
