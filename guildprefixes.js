const fs = require("fs");
const path = require("path");

class PrefixManager {

	constructor(defaultprefix) {
		this.defaultprefix = defaultprefix;
	}

	get prefixes() {
		if (!this._prefixes) {
			this._prefixes = require("./guildprefixes.json");
		}
		return this._prefixes;
	}

	// Returns the prefix in this guild (if DM, returns default prefix)
	getPrefix(guild) {
		if (!guild) {
			return this.defaultprefix;
		}

		let id = guild.id;
		if (typeof this.prefixes[id] == "string") {
			return this.prefixes[id];
		}
		return this.defaultprefix;
	};

	setPrefix(guild, prefix) {
		this.prefixes[guild.id] = prefix;
		fs.writeFile(path.resolve(__dirname, "guildprefixes.json"), JSON.stringify(guildprefixes, null, 4), err => { if (err) { log(err); } });
	}
}

module.exports = new PrefixManager("!");
