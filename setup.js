// Registers application commands
// Has a required command line argument for the bot's client ID
// Also has an optional command line argument for the guild to register the commands in

const log = require("./log.js");

if (!process.argv[2]) {
	log("Please specify the application ID of your Discord bot as a command line argument (can be found at https://discordapp.com/developers/applications)");
	return;
}

const auth = require("./auth.json");

if (!auth.bottoken || auth.bottoken == "CENSORED") {
	log("Please fill in the token of your Discord Bot (can be found at https://discordapp.com/developers/applications).");
	return;
}

const { REST } = require("@discordjs/rest");
const commands = require("./commands.js");

log(`All modules loaded; registering ${commands.options.length} commands.`)

const rest = new REST({ version: '10' }).setToken(auth.bottoken);

var path;
if (process.argv[3]) {
	path = `/applications/${process.argv[2]}/guilds/${process.argv[3]}/commands`;
}
else {
	path = `/applications/${process.argv[2]}/commands`;
}

rest.put(path, { body: commands.options }).then(
	() => {
		log("Success!");
	},
	error => {
		log("Failed.");
		log(error);
	}
);
