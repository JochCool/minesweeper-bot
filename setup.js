// Registers application commands
// Has a required command line argument for the bot's client ID
// Also has an optional command line argument for the guild to register the commands in
// Setting the third command line argument to "delete" will instead make this program delete all registered commands, rather than registering new ones.

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

const rest = new REST({ version: '10' }).setToken(auth.bottoken);

var path;
if (process.argv[3]) {
	path = `/applications/${process.argv[2]}/guilds/${process.argv[3]}/commands`;
}
else {
	path = `/applications/${process.argv[2]}/commands`;
}

if (process.argv[4] == "delete") {
	log("All modules loaded; deleting commands.");

	rest.get(path).then(response => {
		log(response.length + " commands found to delete.");
		for (var i = 0; i < response.length; i++) {
			let id = response[i].id;
			let name = response[i].name;
			rest.delete(`${path}/${id}`).then(() => log(`Deleted command ${id} (${name})`), log);
		}
	}, log);
}
else {
	const commands = require("./commands.js");

	const list = commands.options.filter(command => !command.isTextOnly);

	log(`All modules loaded; registering ${list.length} commands.`)

	rest.put(path, { body: list }).then(
		response => {
			log("Success! Registered commands:");
			for (var i = 0; i < response.length; i++) {
				log(`/${response[i].name} (id ${response[i].id}, version ${response[i].version})`)
			}
		},
		error => {
			log("Failed.");
			log(error);
		}
	);
}
