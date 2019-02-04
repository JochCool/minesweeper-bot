const botVersion = "1.3";

// Most of this code is copied from my other project, Entrapment Bot, which is a private bot I use on my own Discord server:
// https://github.com/JochCool/entrapment-bot

// Replacement of console.log
function log(message) {
	if (message instanceof Error) {
		message = message.stack;
	}
	console.log("[" + new Date().toLocaleTimeString() + "] " + message);
};

log("Starting Minesweeper Bot version " + botVersion);

/** ───── BECOME A DISCORD BOT ───── **/
// This section is to load the modules, initialize the bot and create some general functions

// Load everything
const Discord = require('discord.js');
const auth = require('./auth.json');
const package = require('./package.json');
const updates = require('./news.json').updates;

log("All modules loaded");
if (package.version != botVersion) {
	log("Inconsistency between package version (" + package.version + ") and code version (" + botVersion + ")");
}

// Initialize Discord Bot
const client = new Discord.Client();
client.login(auth.token).catch(log);

// Misc event handlers

client.on('ready', () => {
	log("Ready!");
	client.user.setActivity("Minesweeper", {"type": "PLAYING"}).catch(log);
});

client.on('disconnected', function() {
	log("Disconnected from the server. Stopping!");
	process.exit();
});

client.on('error', function() {
	log("WebSocket error");
});

client.on('guildCreate', guild => {
	log("Joined a new guild! It's called \"" + guild.name + "\" (id: " + guild.id + ")");
});

/** ───── MESSAGE PARSER ───── **/
// This section is to evaluate you commands and reply to your messages

const prefix = '!';

client.on('message', message => {
	
	if (message.author.bot) {
		return;
	}
	
	// Commands
	if (message.content.substring(0, 1) == prefix) {
		executeCommand(message, message.content.substring(1));
	}
	
	else if (message.content.toLowerCase().startsWith("good bot")) {
		message.channel.send("Thank you!").catch(log);
	}
	else if (message.content.toLowerCase().startsWith("bad bot")) {
		message.channel.send(":(").catch(log);
	}
});

var input = null, thisInputEnd = -1;

function executeCommand(message, command) {
	try {
		//log("Executing command: "+command);
		
		// No new lines allowed
		if (command.indexOf('\n') >= 0) {
			throw new CommandResult(false, "Please keep your command on one line!");
		}
		
		// init
		let currentArgument = commands;
		let inputs = {};
		command = command.trim();
		
		// loop through arguments to run the command
		while (currentArgument.child) {
			let syntax = currentArgument.getChildSyntax();
			currentArgument = currentArgument.child;
			
			// input type check
			input = null;
			thisInputEnd = -1;
			let inputAllowed = false;
			if (Array.isArray(currentArgument)) {
				for (var a = 0; a < currentArgument.length; a++) {
					if (currentArgument[a].isInputAllowed(command)) {
						currentArgument = currentArgument[a];
						inputAllowed = true;
						break;
					}
				}
			}
			else {
				inputAllowed = currentArgument.isInputAllowed(command);
			}
			
			if (!inputAllowed) {
				if (currentArgument == commands.child) {
					//message.channel.send("Unknown command. Type `" + prefix + "help` for a list of commands").catch(log);
					return;
				}
				else {
					message.channel.send("Invalid argument: `" + input + "`. Expected `" + syntax + "`.").catch(log);
					return;
				}
			}
			
			// add input to inputs list
			inputs[currentArgument.name] = input;
			
			// Next command
			if (thisInputEnd >= 0) {
				command = command.substring(thisInputEnd).trim();
			}
			
			// last input; run the command
			if (thisInputEnd < 0 || command == "" || !currentArgument.child) {
				if (!currentArgument.run) {
					message.channel.send("You're missing one or more required arguments: `" + currentArgument.getChildSyntax(true) + "`").catch(log);
					return;
				}
				let commandResult = currentArgument.run(message, inputs);
				if (typeof commandResult == "string" && commandResult.length > 0) {
					message.channel.send(commandResult).catch(log);
				}
				break;
			}
		}
	}
	catch (err) {
		log(err);
		message.channel.send("An unknown error occurred while evaluating your command.").catch(log);
	}
};

/** ───── COMMANDS ───── **/

/*
The commands object stores the syntax and function of all of the bot's commands, as a tree of arguments.

An argument is represented by either a CommandArgument object, or an array of CommandArgument objects.
If it is an array, you can use any of the arguments in the list as the argument of your command (like an OR-list of possible inputs).

Each CommandArgument object has a name, which is what displays as a one-word description of the argument in the syntax.
Within one branch of the command tree, there should NEVER be multiple arguments with the same name!

There are various types of arguments:
- "literal" (you have to copy the name exactly)
- "text" (you can fill in whatever text you want)
- "number" (you have to fill in a valid number)
- "integer" (you have to fill in a valid integer)
- "date" (you have to fill in a valid Date, preferrably using ISO 8601 format)
- "root" (not an argument, this is the first node in the tree)

Some arguments have a run function. This function gets executed if this argument was the last one to be specified in the command.
If instead of a function, there is null, that means that the child of this argument is not optional. This child then must ALWAYS exist.
If the function does exist, then that means that all child arguments are optional.
The arguments that get passed into this function are:
- Message, the Discord message that triggered this command.
- Object, lists the inputs of the user, with the keys being the name of the argument that was the user input.
*/

function CommandArgument(type, name, runFunction, child) {
	this.type = type;
	this.name = name;
	this.run = runFunction;
	this.child = child;
};

// Returns whether or not the first input in the command string is a valid input for this argument
CommandArgument.prototype.isInputAllowed = function(command) {
	if (command == "") {
		return false;
	}
	input = command;
	
	// Literals
	if (this.type == "literal") {
		if (input.startsWith(this.name)) {
			input = this.name;
			thisInputEnd = this.name.length;
			return true;
		}
		return false;
	}
	
	// Quotes
	if (input.startsWith('"')) {
		thisInputEnd = input.slice(1).indexOf('"')+2;
		if (thisInputEnd < 0) {
			throw new CommandResult(false, "Please close your string!");
		}
		input = input.slice(1, thisInputEnd-1);
	}
	
	// Spaces
	else if (this.child) {
		thisInputEnd = command.indexOf(' ');
		if (thisInputEnd >= 0) {
			input = command.substring(0, thisInputEnd);
		}
	}
	
	// Convert inputs
	// Note: most of these aren't used by this bot, I've just copied this code from my other bot.
	if (this.type == "boolean") {
		if (input.startsWith("true")) {
			input = true;
			thisInputEnd = 4;
			return true;
		}
		if (input.startsWith("false")) {
			input = false;
			thisInputEnd = 5;
			return true;
		}
		return false;
	}
	if (this.type == "number" || this.type == "integer") {
		let num = Number(input);
		if (isNaN(num)) {
			return false;
		}
		input = Number(input);
		if (this.type == "integer" && input % 1 != 0) {
			return false;
		}
		return true;
	}
	if (this.type == "date") {
		let date;
		if (input.startsWith('T')) {
			let now = new Date();
			
			date = Date.parse(now.getFullYear() + "-" + (now.getMonth()+1).getStringWithPrecedingZeroes(2) + "-" + now.getDate().getStringWithPrecedingZeroes(2) + input);
			//log(now.getFullYear() + "-" + now.getMonth() + "-" + now.getDate() + input);
		}
		else {
			date = Date.parse(input);
		}
		log("parsed date: "+date);
		if (isNaN(date)) {
			return false;
		}
		input = date;
		return true;
	}
	
	return this.type == "text";
};

// Returns the syntax of this argument's child, properly formatted.
CommandArgument.prototype.getChildSyntax = function(withChildren) {
	if (typeof this.child != "object") {
		return "";
	}
	let syntax = "";
	let childrenHaveChildren = false;
	if (Array.isArray(this.child)) {
		syntax += "(";
		for (var i = 0; i < this.child.length; i++) {
			if (i > 0) {
				syntax += "|";
			}
			if (this.child[i].type == "literal") {
				syntax += this.child[i].name;
			}
			else {
				syntax += "<" + this.child[i].name + ">";
			}
			if (this.child[i].child) {
				childrenHaveChildren = true;
			}
		}
		syntax += ")";
	}
	else {
		if (this.child.type == "literal") {
			syntax += this.child.name;
		}
		else {
			syntax += "<" + this.child.name + ">";
		}
	}
	if (this.run) {
		syntax = "[" + syntax + "]";
	}
	if (withChildren) {
		if (Array.isArray(this.child)) {
			if (childrenHaveChildren) {
				syntax += " ...";
			}
		}
		else {
			syntax += " " + this.child.getChildSyntax(true);
		}
	}
	return syntax.trim();
};

// Returns an array of all possible child syntaxes (including the children of the children)
CommandArgument.prototype.getAllChildSyntaxes = function() {
	if (!this.child) {
		return [""];
	}
	let syntaxes = [];
	if (Array.isArray(this.child)) {
		for (var i = 0; i < this.child.length; i++) {
			let thesesyntaxes = this.child[i].getAllChildSyntaxes();
			let childName = this.child[i].name;
			if (this.child[i].type != "literal") {
				childName = "<" + childName + ">";
			}
			if (this.run) {
				childName = "[" + childName + "]";
			}
			for (var s = 0; s < thesesyntaxes.length; s++) {
				syntaxes.push(childName + " " + thesesyntaxes[s]);
			}
		}
	}
	else {
		syntaxes = this.child.getAllChildSyntaxes();
		let childName = this.child.name;
		if (this.child.type != "literal") {
			childName = "<" + childName + ">";
		}
		if (this.run) {
			childName = "[" + childName + "]";
		}
		for (var s = 0; s < syntaxes.length; s++) {
			syntaxes[s] = childName + " " + syntaxes[s];
		}
	}
	return syntaxes;
};

// Contains info about all the commands
const commands = new CommandArgument("root", prefix, null, [
	new CommandArgument("literal", "help", message => {
		let returnTxt = "";
		for (var i = 0; i < commands.child.length; i++) {
			returnTxt += "\n• `" + prefix + commands.child[i].name + " " + commands.child[i].getChildSyntax(true) + "`";
		}
		if (returnTxt == "") {
			return new CommandResult(false, "You cannot execute any commands!");
		}
		return "You can execute the following commands:" + returnTxt;
	}),
	new CommandArgument("literal", "minesweeper", null,
		new CommandArgument("integer", "gameWidth", null, 
			new CommandArgument("integer", "gameHeight", (message, inputs) => generateGame(inputs.gameWidth, inputs.gameHeight, undefined, message),
				new CommandArgument("integer", "numMines", (message, inputs) => generateGame(inputs.gameWidth, inputs.gameHeight, inputs.numMines, message))
			)
		)
	),
	new CommandArgument("literal", "ms", null),
	new CommandArgument("literal", "info", () => "Hello, I'm a bot that can generate a random Minesweeper game using the new spoiler tags, for anyone to play! To generate a new minesweeper game, use the `!minesweeper` command (or its alias `!ms`):\n```\n!minesweeper <gameWidth> <gameHeight> [<numMines>]\n````gameWidth` and `gameHeight` tell me how many squares the game should be wide and tall, for a maximum of 40x20.\n`numMines` is how many mines there should be in the game, the more mines the more difficult it is. If omitted, I will pick a number based on the size of the game.\nWhen you run this command, I will reply with a grid of spoiler tags. Click a spoiler tag to open the square and see if there's a mine inside!\n\nIf you don't know how to play Minesweeper, get out of the rock you've been living under and use the `!howtoplay` command. For a list of all commands and their syntaxes, use `!help`.\n\nMy creator is @JochCool#1314 and I'm at version " + botVersion + ". If you have any questions or other remarks, you can DM him. Furthermore, my source code is available on GitHub, for those interested: https://github.com/JochCool/minesweeper-bot. You can submit bug reports and feature requests there.\nNote: sometimes you might not get a response from me when you run a command. Then that's probably because I'm temporarily offline, in which case please DM JochCool so he can fix it.\n\nThank you for using me!"),
	new CommandArgument("literal", "howtoplay", () => "In Minesweeper, you get a rectangular grid of squares. In some of those squares, mines are hidden, but you don't know which squares. The objective is 'open' all the squares that don't have a hidden mine, but to not touch the ones that do.\n\nLet's start with an example. " + generateGame(5, 5, 3) + "\n\nTo open a mine, click the spoiler tag. So go click one now. The contents of that square will be revealed when you do so. If it's a mine (:bomb:), you lose! If it's not a mine, you get a mysterious number instead, like :two:. This number is there to help you, as it indicates how many mines are in the eight squares that touch it (horizontally, vertically or diagonally). Using this information and some good logic, you can figure out the location of most of the mines!\n\nYes, sometimes it's impossible to know which square is a mine; in that case you'll have to guess. But you can usually get very far if you've praciced enough, so go try it out! Use the `!minesweeper` command to generate a new random game."),
	new CommandArgument("literal", "news", () => {
		let returnTxt = "These were my past three updates:\n";
		for (var i = 0; i < 3 && i < updates.length; i++) {
			returnTxt += "\nVersion " + updates[i].name + " — " + updates[i].description;
		}
		return returnTxt;
	}),
	new CommandArgument("literal", "ping", () => "pong (" + client.ping + "ms)")
]);
commands.child[2].child = commands.child[1].child; // cheating here because aliases haven't been implemented yet

// Gets called when you run the `!minesweeper` command
function generateGame(gameWidth, gameHeight, numMines, message) {
	
	// Check game size
	if (gameWidth <= 0 || gameHeight <= 0) {
		return "Uh, I'm not smart enough to generate a maze of that size. I can only use positive numbers. Sorry :cry:";
	}
	if (gameWidth > 40 || gameHeight > 20) {
		return "That's way too large! Think of all the mobile users who are going to see this!";
	}
	
	// Check mine count
	if (isNaN(numMines)) {
		numMines = Math.round(gameWidth * gameHeight / 5);
	}
	else {
		if (numMines <= 0) {
			return "You think you can look clever by solving a Minesweeper game without mines? Not gonna happen my friend.";
		}
		else if (numMines > gameWidth * gameHeight) {
			return "I can't fit that many mines in this game!";
		}
	}
	
	// Generate game (2D array sorted [y][x], -1 means a mine, positive number is the amount of neighbouring mines)
	var game = [];
	
	for (var y = 0; y < gameHeight; y++) {
		game.push([]);
		for (var x = 0; x < gameWidth; x++) {
			game[y].push(0);
		}
	}
	
	// Fill it with mines!
	for (var mine = 0; mine < numMines; mine++) {
		var x = Math.floor(Math.random()*gameWidth),
		    y = Math.floor(Math.random()*gameHeight);
		
		// Retry if there was already a mine there
		if (game[y][x] === -1) {
			mine--;
			continue;
		}
		
		game[y][x] = -1;
		
		// Add 1 to neighbouring tiles
		if (x > 0                && y > 0             && game[y-1][x-1] !== -1) { game[y-1][x-1]++; }
		if (                        y > 0             && game[y-1][x  ] !== -1) { game[y-1][x  ]++; }
		if (x < game[y].length-1 && y > 0             && game[y-1][x+1] !== -1) { game[y-1][x+1]++; }
		if (x < game[y].length-1                      && game[y  ][x+1] !== -1) { game[y  ][x+1]++; }
		if (x < game[y].length-1 && y < game.length-1 && game[y+1][x+1] !== -1) { game[y+1][x+1]++; }
		if (                        y < game.length-1 && game[y+1][x  ] !== -1) { game[y+1][x  ]++; }
		if (x > 0                && y < game.length-1 && game[y+1][x-1] !== -1) { game[y+1][x-1]++; }
		if (x > 0                                     && game[y  ][x-1] !== -1) { game[y  ][x-1]++; }
	}
	
	// Create the reply
	let returnTxt;
	if (numMines === 1) { returnTxt = "Here's a board with 1 mine:"; }
	else 		  { returnTxt = "Here's a board with " + numMines + " mines:"; }
	
	for (var y = 0; y < game.length; y++) {
		returnTxt += "\n"
		for (var x = 0; x < game[y].length; x++) {
			if (game[y][x] === -1) {
				returnTxt += "||:bomb:||";
			}
			else {
				returnTxt += "||" + numberEmoji[game[y][x]] + "||";
			}
		}
	}
	
	// Send the message is it's not longer than 2000 chars (Discord's limit)
	if (returnTxt.length <= 2000) {
		return returnTxt;
	}
	
	// Otherwise, split the message
	let splitReturns = [];
	do {
		let splitIndex = returnTxt.substring(0, 1900).lastIndexOf("\n");
		if (splitIndex === -1) {
			return "Sorry, your message appears to be too large to send. Please try a smaller game next time.";
		}
		splitReturns.push(returnTxt.substring(0, splitIndex));
		returnTxt = returnTxt.substring(splitIndex+1);
	} while (returnTxt.length > 1900)
	
	splitReturns.push(returnTxt);
	
	// Send the messages one by one
	let i = 0;
	function sendNextMessage() {
		if (i < splitReturns.length) { message.channel.send(splitReturns[i++]).then(sendNextMessage, log); }
	};
	sendNextMessage();
};

const numberEmoji = [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:"];

