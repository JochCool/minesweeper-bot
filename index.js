// Code for managing the shards
// Author: JochCool

// Load everything
const { log, nextReport } = require("./util.js");
const Discord = require("discord.js");
const auth = require("./auth.json");
const package = require("./package.json");

// Censored bot token?
if (!auth.bottoken || auth.bottoken == "CENSORED") {
	log("Please fill in the token of your Discord Bot in auth.json (can be found at https://discordapp.com/developers/applications).");
	process.exit();
}

log(`Starting Minesweeper Bot version ${package.version}`);

// Spawn manager
const manager = new Discord.ShardingManager("./bot.js", { token: auth.bottoken });
manager.spawn();

manager.on("shardCreate", shard => log(`Launched shard id(s) ${shard.ids.join(", ")}`));

// Called each hour, and when the bot launches (with true as param)
function report(first) {
	
	// Fetch total guild count
	manager.fetchClientValues("guilds.cache.size").then(results => {
		var guildCount = results.reduce((accumulator, currentValue) => accumulator + currentValue);
		
		if (first) log(`Guild count: ${guildCount}`);
		else log(`Hourly report: ${nextReport.commands} commands, ${nextReport.reconnects} reconnects, ${nextReport.guilds} new guilds (${guildCount} in total).`);
		
		// (re)set values
		nextReport.commands = 0;
		nextReport.reconnects = 0;
		nextReport.guilds = 0;
	}).catch(log);
	
	// Schedule next report
	setTimeout(report, getTimeUntilNextHour());
};

function getTimeUntilNextHour() {
	let now = new Date();
	return (59 - now.getMinutes())*60000 + (60 - now.getSeconds())*1000;
};

report(true);
