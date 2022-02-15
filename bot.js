// Welcome to the Minesweeper Bot source code!
// What you're probably looking for is the generateGame.js file, which contains the actually minesweeper-related code.
// This code manages the bot's connection and interprets commands.

const package = require("./package.json");
const log = require("./log.js");

log(`Starting Minesweeper Bot version ${package.version}`);

/** ───── BECOME A DISCORD BOT ───── **/
// This section is to load the modules, initialise the bot and create some general functions

// Load everything
const Discord = require("discord.js");
const auth = require("./auth.json");
const commands = require("./commands.js");
const guildprefixes = require("./guildprefixes.js");

log("All modules loaded");

// Censored bot token?
if (!auth.bottoken || auth.bottoken == "CENSORED") {
	log("Please fill in the token of your Discord Bot (can be found at https://discordapp.com/developers/applications).");
	process.exit();
}

// Initialise Discord Bot
const client = new Discord.Client({
	intents: [
		"GUILDS",
		"GUILD_MESSAGES",
		"DIRECT_MESSAGES"
	],

	presence: {
		activity: {
			type: "PLAYING",
			name: "!minesweeper"
		}
	},

	makeCache: Discord.Options.cacheWithLimits({
		MessageManager: 0,
		PresenceManager: 0
	})
});

client.login(auth.bottoken).catch(log);

// Initalise connetion with the Top.gg API
if (auth.dbltoken && auth.topggtoken != "CENSORED") {
	require("topgg-autoposter").AutoPoster(auth.topggtoken, client).on("error", log);
}
else {
	log("Starting bot without Top.gg connection.");
}

function getGuildCount() {
	return client.guilds.cache.size;
};

// setup for hourly reports in the log
var commandsThisHour = 0;
var reconnectsThisHour = 0;
function report() {
	log(`Hourly report: ${commandsThisHour} commands, ${reconnectsThisHour} reconnects.`);
	commandsThisHour = 0;
	reconnectsThisHour = 0;
	setTimeout(report, getTimeUntilNextHour());
};
// This function appears to work but time is weird and hard to test so if there is an oversight please tell me
function getTimeUntilNextHour() {
	let now = new Date();
	return (59 - now.getMinutes())*60000 + (60 - now.getSeconds())*1000;
};

setTimeout(report, getTimeUntilNextHour());

// Misc event handlers
// IMPORTANT: WHEN ADDING EVENTS, DO NOT FORGET TO ALSO CHECK THE GATEWAY INTENTS IN THE CLIENT CONSTRUCTOR

client.on("ready", () => {
	log(`Ready! Current guild count: ${getGuildCount()}`);
});

client.on("disconnected", event => {
	log("WebSocket disconnected! CloseEvent:");
	console.log(event);
});

client.on("reconnecting", () => {
	//log("Reconnecting...");
	reconnectsThisHour++;
});

/*
client.on("resume", replayed => {
	log(`Resumed! Replayed ${replayed} events.`);
});
//*/

client.on("ratelimit", info => {
	log("Being ratelimited! Info:");
	console.log(info);
});

client.on("error", () => {
	log("WebSocket error");
});

client.on("warn", warning => {
	log(`Emitted warning: ${warning}`);
});

/*
client.on("debug", info => {
	log(`Emitted debug: ${info});
]);
//*/

client.on("guildCreate", guild => {
	log(`Joined a new guild! It's called "${guild.name}" (Current count: ${getGuildCount()})`);
});

client.on("guildDelete", guild => {
	log(`Left a guild :(. It was called "${guild.name}" (Current count: ${getGuildCount()})`);
});

/** ───── MESSAGE PARSER ───── **/
// This section is to evaluate your commands and reply to your messages

client.on('messageCreate', message => {
	
	// Don't parse if
	if (message.guild && !message.guild.available || message.author.bot) {
		return;
	}
	
	// Commands
	let prefix = guildprefixes.getPrefix(message.guild);
	if (message.content.startsWith(prefix) && (!message.guild || message.channel.memberPermissions(message.guild.me).has("SEND_MESSAGES"))) {
		executeCommand(message, message.content.substring(prefix.length));
	}
});

function executeCommand(message, command) {
	try {
		//log("Executing command: "+command);

		command = command.trim();

		// The last function that gets encountered will be executed.
		let runFunction = commands.run;

		// Find the command that was run
		let argument;
		for (var a = 0; a < commands.options.length; a++) {
			let checkResult = commands.options[a].checkInput(command);
			if (!checkResult.error) {
				argument = commands.options[a];
				if (argument.run) {
					runFunction = argument.run;
				}
				command = command.substring(checkResult.inputEnd).trim();
				break;
			}
		}
		if (!argument) {
			return;
		}
		commandsThisHour++;
		
		// Get the options
		let inputs = [];
		if (argument.options) {
			for (var i = 0; i < argument.options.length; i++) {

				// No more input?
				if (command == "") {
					if (argument.options[i].required) {
						message.channel.send(`You're missing one or more required arguments: \`${argument.getOptionsSyntax(i, true)}\`.`).catch(log);
						return;
					}
					break;
				}
	
				// Check input
				let checkResult = argument.options[i].checkInput(command);
				if (checkResult.error) {
					message.channel.send(`${checkResult.error}: \`${checkResult.input}\` (at \`${argument.getOptionsSyntax(i, true)}\`).`).catch(log);
					return;
				}
	
				inputs[i] = checkResult.input;
				if (checkResult.inputEnd < 0) {
					command = "";
				}
				else {
					command = command.substring(checkResult.inputEnd).trim();
				}

				if (argument.options[i].run) {
					runFunction = argument.options[i].run;
				}
			}
		}

		if (!runFunction) {
			log("WARNING: no command execution method found.");
			message.channel.send("It looks like this command has not been implemented yet. Please contact my owner if you think this is an error.");
			return;
		}
		
		// Run the command
		let commandResult = runFunction(message, inputs, client);
		if (typeof commandResult == "string" && commandResult.length > 0) {
			message.channel.send(commandResult).catch(log);
		}
	}
	catch (err) {
		log(err);
		commandsThisHour++;
		message.channel.send("An unknown error occurred while evaluating your command.").catch(log);
	}
};

// The generateGame function and the command tree used to be here, but they have been moved to their own files.
