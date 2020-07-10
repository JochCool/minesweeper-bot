// Contains some utility functions & values that are used globally
// Author: JochCool

// Load everything
const path = require("path");
const guildprefixes = require("./guildprefixes.json");

module.exports = {
	log: log,
	saveGuildPrefixes: saveGuildPrefixes,
	
	// Used for hourly reports in index.js
	nextReport: {}
}

function log(message) {
	if (message instanceof Error) {
		message = message.stack;
	}
	var now = new Date();
	console.log(`[Minesweeper Bot] [${now.getUTCFullYear()}-${toTwoDigitString(now.getUTCMonth()+1)}-${toTwoDigitString(now.getUTCDate())} ${toTwoDigitString(now.getUTCHours())}:${toTwoDigitString(now.getUTCMinutes())}:${toTwoDigitString(now.getUTCSeconds())}] ${message}`);
};

function toTwoDigitString(num) {
	var str = num.toString();
	if (str.length == 1) return "0" + str;
	return str;
};

// This is to make sure we never save guildprefixes.json while we're already saving it. 0 = not currently saving, 1 = currently saving (last time), 2 = currently saving (and we need to save again)
var savingState = 0;

function saveGuildPrefixes() {
	if (savingState == 2) return;
	savingState++;
	if (savingState == 2) return;
	
	fs.writeFile(path.resolve(__dirname, "guildprefixes.json"), JSON.stringify(guildprefixes), err => {
		if (err) log(err);
		savingState--;
	});
};