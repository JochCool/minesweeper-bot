// Welcome to the Minesweeper Bot source code!
// What you're probably looking for is the generateGame.js file, which contains the actually minesweeper-related code.
// This code manages the bot's connection and interprets commands.

const package = require("../package.json");
const log = require("./log.js");

log(`Starting Minesweeper Bot version ${package.version}`);

/** ───── BECOME A DISCORD BOT ───── **/
// This section is to load the modules, initialise the bot and create some general functions

// Load everything
const Discord = require("discord.js");
const auth = require("../auth.json");
const commands = require("./commands.js");
const guildprefixes = require("./guildprefixes.js");

log("All modules loaded");

// Censored bot token?
if (!auth.bottoken || auth.bottoken == "CENSORED") {
	log("Please fill in the token of your Discord Bot (can be found at https://discordapp.com/developers/applications).");
	process.exit();
}

// Initialise Discord bot
const client = new Discord.Client({
	intents: [
		"GUILDS",
		"GUILD_MESSAGES",
		"DIRECT_MESSAGES"
	],

	partials: ["CHANNEL"],

	presence: {
		activities: [
			{
				type: "PLAYING",
				name: "minesweeper"
			}
		]
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

/** ───── COMMAND PARSER ───── **/
// This section is to evaluate your commands and reply to your commands

client.on('messageCreate', message => {
	
	if (message.author.bot) {
		return;
	}
	if (message.guild) {
		if (!message.guild.available) {
			return;
		}
		let permissions = message.channel.memberPermissions(message.guild.me);
		if (!permissions.has("SEND_MESSAGES")) {
			return;
		}
		if (!permissions.has("READ_MESSAGE_HISTORY")) {
			// Replying isn't allowed without this permission; send a regular message instead
			message.reply = content => message.channel.send(content);
		}
	}
	
	// Commands
	let prefix = guildprefixes.getPrefix(message.guild);
	if (message.content.startsWith(prefix)) {
		respondToCommand(message, message.content.substring(prefix.length).trim());
	}
});

client.on('interactionCreate', interaction => {
	if (interaction.isCommand()) {
		respondToCommand(interaction, interaction.commandName, interaction.options);
	}
});

// For text commands, 'command' will be the whole command, for interactions it'll be only the command name and 'options' contains the rest.
async function respondToCommand(source, command, options) {
	let result = executeCommand(source, command, options);
	if (!result) {
		return;
	}
	commandsThisHour++;
	if (Array.isArray(result)) {
		if (result.length == 0) {
			return;
		}
		try {
			await source.reply(convertMessage(result[0]));
			for (var i = 1; i < result.length; i++) {
				await source.channel.send(convertMessage(result[i]));
			}
		}
		catch (err) {
			log(err);
		}
	}
	else {
		source.reply(convertMessage(result)).catch(log);
	}

	function convertMessage(message) {
		if (typeof message == "string") {
			message = { content: message };
		}
		message.allowedMentions = { repliedUser: false };
		return message;
	}
}

function executeCommand(source, command, options) {
	try {
		//log("Executing command: "+command);

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
		
		// Get the options
		let inputs = [];
		if (argument.options) {
			for (var i = 0; i < argument.options.length; i++) {

				// Slash commands
				if (options) {
					let option = options.get(argument.options[i].name);

					if (option) {
						inputs[i] = option.value;
					}
					// I know that Discord will disallow this for me, but it doesn't hurt to check.
					else if (argument.options[i].required) {
						return { content: `You're missing a required argument: \`${argument.getOptionsSyntax(i, true)}\`.`, ephemeral: true };
					}
				}
				// Text commands
				else {
					// No more input?
					if (command == "") {
						if (argument.options[i].required) {
							return { content: `You're missing one or more required arguments: \`${argument.getOptionsSyntax(i, true)}\`.`, ephemeral: true };
						}
						break;
					}

					// Check input
					let checkResult = argument.options[i].checkInput(command);
					if (checkResult.error) {
						return { content: `${checkResult.error}: \`${checkResult.input}\` (at \`${argument.getOptionsSyntax(i, true)}\`).`, ephemeral: true };
					}

					inputs[i] = checkResult.input;
				
					if (checkResult.inputEnd < 0) {
						command = "";
					}
					else {
						command = command.substring(checkResult.inputEnd).trim();
					}
				}

				if (argument.options[i].run) {
					runFunction = argument.options[i].run;
				}
			}
		}

		if (!runFunction) {
			log("WARNING: no command execution method found.");
			return { content: "It looks like this command has not been implemented yet. Please contact my owner if you think this is an error.", ephemeral: true };
		}
		
		// Run the command
		return runFunction(source, inputs, client);
	}
	catch (err) {
		log(err);
		return { content: "An unknown error occurred while evaluating your command.", ephemeral: true };
	}
};

// The generateGame function and the command tree used to be here, but they have been moved to their own files.
