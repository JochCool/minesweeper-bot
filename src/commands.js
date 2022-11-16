const Discord = require("discord.js");
const { generateGame, checkGameSettings } = require("./generateGame.js");
const AutoChannel = require("./AutoChannel.js");
const log = require("./log.js");
const settings = require("../settings.json");
const updates = require("../news.json");
const package = require("../package.json");

// The commands object stores the syntax and function of all of the bot's commands. It is structured in the same way as Discord's Application Command structure:
// https://discord.com/developers/docs/interactions/application-commands

const types = {
	command: 1,
	root: 2,
	string: 3,
	integer: 4,
	boolean: 5,
	channel: 7,
	number: 10,
};

/**
 * @callback CommandRunFunction
 * @param {Discord.Message|Discord.CommandInteraction} source The Discord message or slash command interaction that triggered this command.
 * @param {Array} inputs The the values of the options specified by the user, in the same order as listed in the command.
 * @param {Discord.Client} client The Discord client that received the command.
 */

/**
 * Represents either the root object of the commands tree, a command, or an option within a command. Command groups are currently unsupported.
 * 
 * The root object contains other commands in their 'options', and command objects can contain an ordered list of options that the user can give values for.
 * Options are their own subclass: {@link CommandOption}, which can be optional or required. Optional arguments must be at the end of the options list.
 * 
 * Arguments can have a run function. If the last argument specified by the user is this argument, then this argument's run function will be executed.
 * If this is not the last argument specified, but the specified arguments after this don't have a run function, then this argument's run function will be executed instead.
 * There must always be an argument containing a run function before the first optional argument, otherwise the command has no functionality if no optional arguments are specified.
 */
class CommandArgument {

	/**
	 * Constructs a CommandArgument.
	 * @param {number} type The type of command argument.
	 * @param {string} name The name of the command or option.
	 * @param {string} description The description of the command or option.
	 * @param {boolean} [isTextOnly] Whether this command can only be executed as a text command.
	 */
	constructor(type, name, description, isTextOnly) {

		/**
		 * The type of command argument.
		 * @type {number}
		 */
		this.type = type;

		/**
		 * The name of the command or option.
		 * @type {string}
		 */
		this.name = name;

		/**
		 * The description of the command or option (displayed in the slash commands UI and in the help command output).
		 * @type {string}
		 */
		this.description = description;
		
		if (isTextOnly) {
			/**
			 * True if this command can only be executed as a text command.
			 * @type {boolean}
			 */
			this.isTextOnly = true;
		}
	}

	/**
	 * True if this is the root object or a command; otherwise, false.
	 */
	get isCommand() {
		return this.type <= types.root;
	}

	/**
	 * False if this is a required argument or a command; otherwise, true.
	 */
	get isOptional() {
		return !(this.isCommand || this.required);
	}

	/**
	 * Sets the options of this command.
	 * @param {Array<CommandOption>} options The options for this command.
	 * @returns {CommandArgument} This object.
	 */
	setOptions(options) {
		/**
		 * The options for this command.
		 * @type {Array<CommandOption>}
		 */
		this.options = options;
		return this;
	}

	/**
	 * Sets the run function of this argument.
	 * @param {CommandRunFunction} runFunction The function to run upon execution.
	 * @returns {CommandArgument} This object.
	 */
	setRunFunction(runFunction) {
		/**
		 * The function that is run upon execution of this command at this argument.
		 * @type {CommandRunFunction}
		 */
		this.run = runFunction;
		return this;
	}

	/**
	 * Sets the default permissions for this command.
	 * @param {string} permissions The stringified permissions bitset. See: https://discord.com/developers/docs/topics/permissions
	 * @returns {CommandArgument} This object.
	 */
	setDefaultMemberPermissions(permissions) {
		this.default_member_permissions = permissions;
		return this;
	}

	/**
	 * Checks if the first input in the command string is a valid input for this argument. If so, parses the input. If not, creates an error message.
	 * @param {string} input The input to check and parse.
	 * @returns {{input: any, inputEnd: number|undefined, error: string|undefined}} Returns an object containing the parsed/checked input. If there was an error, the `error` property is set to an error message. If not, the `inputEnd` property is set to the position in the input string where the parsing ended.
	 */
	checkInput(input) {
		if (input == "") {
			return {
				input: "",
				error: "Missing argument"
			};
		}

		// Literals
		if (this.type == types.command) {
			if (input.startsWith(this.name)) {
				return {
					input: this.name,
					inputEnd: this.name.length
				};
			}
			return {
				input: input,
				error: "Invalid option"
			};
		}
		
		let inputEnd;

		// Quotes
		if (input.startsWith('"')) {
			inputEnd = input.slice(1).indexOf('"') + 2;
			if (inputEnd == 1) {
				return {
					input: input,
					error: "Unmatched quote"
				};
			}
			input = input.slice(1, inputEnd - 1);
		}

		// Spaces / new lines
		else {
			// Find the first space or new line
			let nextSpace = input.indexOf(' '), nextNewLine = input.indexOf('\n');
			if (nextSpace < 0) {
				inputEnd = nextNewLine;
			}
			else if (nextNewLine >= 0) {
				inputEnd = Math.min(nextSpace, nextNewLine);
			}
			else {
				inputEnd = nextSpace;
			}

			if (inputEnd >= 0) {
				input = input.substring(0, inputEnd);
			}
		}

		// Convert inputs
		switch (this.type) {
			case types.boolean:
				if (input.startsWith("false") || input.startsWith("no")) {
					return {
						input: false,
						inputEnd: inputEnd < 0 ? 5 : inputEnd
					};
				}
				return {
					input: true,
					inputEnd: inputEnd < 0 ? 4 : inputEnd
				};
			
			case types.number:
			case types.integer:
				let num = Number(input);
				if (isNaN(num)) {
					return {
						input: input,
						error: "Not a valid number"
					};
				}
				if (this.type == types.integer && num % 1 != 0) {
					return {
						input: input,
						error: "Not an integer"
					};
				}
				return {
					input: num,
					inputEnd: inputEnd
				};

			case types.string:
				return {
					input: input,
					inputEnd: inputEnd
				};
			
			case types.channel:
				const match = /^<#(\d+)>$/.exec(input);
				if (!match) {
					return {
						input: input,
						error: "Not a channel mention"
					};
				}
				return {
					input: match[1],
					inputEnd: inputEnd
				};
			
			default:
				return {
					input: input,
					error: "This argument is only supported in slash commands"
				};
		}
	}

	/**
	 * Returns the syntax of this argument's options, properly formatted.
	 * @param {number} fromIndex The index in the options array to start at.
	 * @param {boolean} requiredOnly Whether only required options need to be shown (so nothing in square brackets).
	 * @returns {string} The syntax of this command's options.
	 */
	getOptionsSyntax(fromIndex, requiredOnly) {
		if (!this.options) {
			return "";
		}
		fromIndex = fromIndex || 0;
		let syntax;

		// Command group: list commands as OR-gate

		if (this.type == types.root) {
			var hasOptions;
			syntax = "(";
			for (var i = 0; i < this.options.length; i++) {
				if (i > 0) {
					syntax += "|";
				}
				syntax += this.options[i].name;

				if (this.options[i].options && !(requiredOnly && this.options[i].options[0].isOptional)) {
					hasOptions = true;
				}
			}
			syntax += ")";

			if (hasOptions) {
				syntax += " ...";
			}
		}
		
		// Command; list arguments from start index as param list

		else if (requiredOnly && this.options[fromIndex].isOptional) {
			syntax = `<${this.options[fromIndex].name}>`;
		}
		else {
			syntax = "";
			var bracketsToClose = 0;
			for (var i = fromIndex; i < this.options.length; i++) {
				if (requiredOnly && this.options[i].isOptional) {
					break;
				}

				if (syntax != "") {
					syntax += " ";
				}
				if (this.options[i].isOptional) {
					syntax += "[";
					bracketsToClose++;
				}
				syntax += `<${this.options[i].name}>`;
			}
			while (bracketsToClose --> 0) {
				syntax += "]";
			}
		}

		return syntax;
	}
};

/**
 * Represents an option in a command.
 */
class CommandOption extends CommandArgument {
	/**
	 * Constructs a CommandOption.
	 * @param {number} type The type of command option.
	 * @param {string} name The name of the command option.
	 * @param {string} description The description of the command option.
	 * @param {boolean} [isRequired] Whether this option is required.
	 */
	constructor(type, name, description, isRequired) {
		super(type, name, description);

		/**
		 * True if this option is required; otherwise, false.
		 */
		this.required = isRequired;
	}

	/**
	 * Sets the minimum value permitted for this option.
	 * 
	 * Note: this restriction is not enforced in text commands right now, only in slash commands by Discord.
	 * @param {number} value The minimum value permitted for this option.
	 * @returns {CommandOption} This object.
	 */
	setMinValue(value) {
		/**
		 * The minimum value permitted for this option.
		 * @type {number}
		 */
		this.min_value = value;
		return this;
	}
	
	/**
	 * Sets the maximum value permitted for this option.
	 * 
	 * Note: this restriction is not enforced in text commands right now, only in slash commands by Discord.
	 * @param {number} value The maximum value permitted for this option.
	 * @returns {CommandOption} This object.
	 */
	setMaxValue(value) {
		/**
		 * The maximum value permitted for this option.
		 * @type {number}
		 */
		this.max_value = value;
		return this;
	}

	/**
	 * Sets the channel types permitted for this option.
	 * 
	 * Note: this restriction is not enforced in text commands right now, only in slash commands by Discord.
	 * @param {Array<number>} channelTypes The types of channels permitted for this option.
	 * @returns {CommandOption} This object.
	 */
	setChannelTypes(channelTypes) {
		/**
		 * The channel types permitted for this option.
		 * @type {Array<number>}
		 */
		this.channel_types = channelTypes;
		return this;
	}
}

const gameWidthOption = new CommandOption(types.integer, "game-width", "Amount of squares horizontally.", false).setMinValue(1).setMaxValue(settings.maxGameWidth);
const gameHeightOption = new CommandOption(types.integer, "game-height", "Amount of squares vertically.", false).setMinValue(1).setMaxValue(settings.maxGameHeight);
const numMinesOption = new CommandOption(types.integer, "num-mines", "Number of mines in the game.", false).setMinValue(1).setMaxValue(settings.maxGameWidth*settings.maxGameHeight);
const dontStartUncoveredOption = new CommandOption(types.boolean, "dont-start-uncovered", "Option to not uncover the first part of the minesweeper field automatically.", false);

const minesweeperOptions = [
	gameWidthOption,
	gameHeightOption,
	numMinesOption,
	dontStartUncoveredOption
];

function checkAndGenerateGame(inputs, isRaw) {

	let gameSettings = {
		width: inputs[0],
		height: inputs[1],
		numMines: inputs[2],
		startsNotUncovered: inputs[3]
	}

	let error = checkGameSettings(gameSettings);
	if (error) return error;

	return generateGame(gameSettings, isRaw)
};

const commands = new CommandArgument(types.root, settings.prefix, null).setOptions([

	new CommandArgument(types.command, "help", "Lists available commands.", true)
		.setRunFunction(source => {
			// Loop through commands and add their syntax
			let returnTxt = "";
			for (var i = 0; i < commands.options.length; i++) {
				let command = commands.options[i];

				// Skip if no permission
				if (command.default_member_permissions) {
					if (!source.guild || !source.member.permissions.has(command.default_member_permissions)) {
						continue;
					}
				}

				let syntax = settings.prefix + command.name;
				let optionsSyntax = command.getOptionsSyntax();
				if (optionsSyntax != "") {
					syntax += " " + optionsSyntax;
				}
				returnTxt += `\n• \`${syntax}\`\n\t\t${command.description}`;
			}
			if (returnTxt == "") {
				return "You cannot execute any commands!";
			}
			return `You can execute the following commands: ${returnTxt}`;
		}),
	
	new CommandArgument(types.command, "minesweeperraw", "Creates a Minesweeper game and shows the markdown code for copy-pasting.")
		.setRunFunction((source, inputs) => checkAndGenerateGame(inputs, true))
		.setOptions(minesweeperOptions),

	new CommandArgument(types.command, "msraw", "Alias of the minesweeperraw command.", true)
		.setRunFunction((source, inputs) => checkAndGenerateGame(inputs, true))
		.setOptions(minesweeperOptions),

	new CommandArgument(types.command, "minesweeper", "Creates a Minesweeper game for you to play!")
		.setRunFunction((source, inputs) => checkAndGenerateGame(inputs, false))
		.setOptions(minesweeperOptions),

	new CommandArgument(types.command, "ms", "Alias of the minesweeper command.", true)
		.setRunFunction((source, inputs) => checkAndGenerateGame(inputs, false))
		.setOptions(minesweeperOptions),

	new CommandArgument(types.command, "auto", "Creates Minesweeper games at regular intervals in this channel.")
		.setDefaultMemberPermissions("16") // Manage Channels
		.setRunFunction(async (source, inputs) => {

			let interval = inputs[0];
			if (interval == 0) {
				if (AutoChannel.delete(source.channelId)) {
					return "I will no longer send Minesweeper games in this channel.";
				}
				return { content: "You set the interval to 0, which means I should stop auto-sending games, but I was not doing that in this channel to begin with.", ephemeral: true };
			}

			if (interval < 0) return { content: "I cannot create games in a negative amount of time.", ephemeral: true };
			if (interval > settings.maxAutoChannelIntervalMinutes) return { content: "That takes far too long! The maximum is 3 weeks.", ephemeral: true };

			let gameSettings = {
				width: inputs[1],
				height: inputs[2],
				numMines: inputs[3],
				startsNotUncovered: inputs[4]
			};

			let error = AutoChannel.checkChannel(source.channel) || checkGameSettings(gameSettings);
			if (error) return { content: error, ephemeral: true };
			
			AutoChannel.create(source.channel, interval * 60000, gameSettings);
			log("New autochannel created!");

			if (interval == 1) {
				return `I will send a Minesweeper game in ${source.channel} every minute.`;
			}
			return `I will send a Minesweeper game in ${source.channel} every ${interval} minutes.`;
		})
		.setOptions([
			new CommandOption(types.integer, "interval", "The number of minutes between messages. Set this to 0 to make me stop.", true).setMinValue(0).setMaxValue(settings.maxAutoChannelIntervalMinutes),
			gameWidthOption,
			gameHeightOption,
			numMinesOption,
			dontStartUncoveredOption
		]),

	new CommandArgument(types.command, "info", "Gives info about the bot.")
		.setRunFunction(() => {
			let minesweeperSyntax = commands.options.find(arg => arg.name == "minesweeper").getOptionsSyntax();

			return `Hello, I'm a bot that can generate a random Minesweeper game using the new spoiler tags, for anyone to play! To generate a new minesweeper game, use the \`/minesweeper\` command:\n\`\`\`\n/minesweeper ${minesweeperSyntax}\n\`\`\`\`<game-width>\` and \`<game-height>\` tell me how many squares the game should be wide and tall, for a maximum of 40x20. Default is 8x8.\n\`<num-mines>\` is how many mines there should be in the game, the more mines the more difficult it is. If omitted, I will pick a number based on the size of the game.\nWhen you run this command, I will reply with a grid of spoiler tags. Unless you set the \`<dont-start-uncovered>\` parameter to true, the first zeroes will have already been opened for you.\n\nIf you don't know how to play Minesweeper, get out of the rock you've been living under and use the \`/howtoplay\` command. For a list of all commands and their syntaxes, use \`/help\`.\n\nMy creator is @JochCool#1314 and I'm at version ${package.version}. For those interested, my source code is available on GitHub: ${package.repository}. You can submit bug reports and feature requests there.\nThank you for using me!`;
		}),
	
	new CommandArgument(types.command, "howtoplay", "Teaches you how to play Minesweeper.")
		.setRunFunction(() => `In Minesweeper, you get a rectangular grid of squares. In some of those squares, mines are hidden, but you don't know which squares. The objective is 'open' all the squares that don't have a hidden mine, but to not touch the ones that do.\n\nLet's start with an example. ${generateGame({width: 5, height: 5, numMines: 3})}\nTo open a square, click the spoiler tag. So go click one now. The contents of that square will be revealed when you do so. If it's a mine (:bomb:), you lose! If it's not a mine, you get a mysterious number instead, like :two:. This number is there to help you, as it indicates how many mines are in the eight squares that touch it (horizontally, vertically or diagonally). Using this information and some good logic, you can figure out the location of most of the mines!`),

	new CommandArgument(types.command, "news", "Lists the past three updates to the bot.")
		.setRunFunction(() => {
			let returnTxt = "These were my past three updates:\n";
			for (var i = 0; i < 3 && i < updates.length; i++) {
				returnTxt += `\nVersion ${updates[i].name} \u2013 ${updates[i].description}`; // U+2015 = en dash
			}
			return returnTxt + "\nSee the GitHub repository if you want to more closely follow development. And you are welome to leave feedback! https://github.com/JochCool/minesweeper-bot";
		}),

	new CommandArgument(types.command, "ping", "Pong?")
		.setRunFunction((source, inputs, client) => `pong (${Math.floor(client.ws.ping)}ms heartbeat)`)
]);

module.exports = commands;
