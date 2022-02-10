const generateGame = require("./generateGame.js");
const guildprefixes = require("./guildprefixes.js");
const updates = require("./news.json").updates;

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
- "root" (not an argument, this is the first node in the tree)

Some arguments have a run function. This function gets executed if this argument was the last one to be specified in the command.
If instead of a function, there is null, that means that the child of this argument is not optional. This child then must ALWAYS exist.
If the function does exist, then that means that all child arguments are optional.
The arguments that get passed into this function are:
- Message, the Discord message that triggered this command.
- Object, lists the inputs of the user, with the keys being the name of the argument that was the user input.
- Client, the Discord client that received the message.
*/

class CommandArgument {

    constructor(type, name, runFunction, child) {
        this.type = type;
        this.name = name;
        this.run = runFunction;
        this.child = child;
    }

    hasChildren() {
        return this.child instanceof CommandArgument || Array.isArray(this.child) && this.child.length > 0;
    }

    // Returns whether or not the first input in the command string is a valid input for this argument
    isInputAllowed(command) {
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
            thisInputEnd = input.slice(1).indexOf('"') + 2;
            if (thisInputEnd == 1) {
                input = input.slice(1);
                return false;
            }
            input = input.slice(1, thisInputEnd - 1);
        }


        // Spaces / new lines
        else if (this.child) {
            // Find the first space or new line
            let nextSpace = command.indexOf(' '), nextNewLine = command.indexOf('\n');
            if (nextSpace == -1) {
                thisInputEnd = nextNewLine;
            }
            else if (nextNewLine >= 0) {
                thisInputEnd = Math.min(nextSpace, nextNewLine);
            }
            else {
                thisInputEnd = nextSpace;
            }

            if (thisInputEnd >= 0) {
                input = command.substring(0, thisInputEnd);
            }
        }

        // Convert inputs
        // Note: most of these aren't used by this bot; I've just copied this code from my other bot.
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

        return this.type == "text";
    }

    // Returns the syntax of this argument's child, properly formatted. (If requiredOnly is true, will never return things in square brackets)
    getChildSyntax(withChildren, requiredOnly) {
        if (!this.hasChildren()) {
            return "";
        }
        let syntax = "";
        let childrenHaveChildren = false;

        // Multiple children: loop through them
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
                    syntax += `<${this.child[i].name}>`;
                }
                if (this.child[i].child) {
                    childrenHaveChildren = true;
                }
            }
            syntax += ")";
        }


        // Single child
        else {
            if (this.child.type == "literal") {
                syntax += this.child.name;
            }
            else {
                syntax += `<${this.child.name}>`;
            }
        }

        // Add children's syntax if desired
        if (withChildren) {
            if (Array.isArray(this.child)) {
                if (childrenHaveChildren) {
                    syntax += " ...";
                }
            }
            else if (this.child.hasChildren() && (!requiredOnly && this.child.run)) {
                syntax += " " + this.child.getChildSyntax(true, requiredOnly);
            }
        }

        // Optional children
        if (!requiredOnly && this.run) {
            syntax = `[${syntax}]`;
        }

        return syntax;
    }

    // Returns an array of all possible child syntaxes (including the children of the children)
    getAllChildSyntaxes() {
        if (!this.hasChildren()) {
            return [""];
        }
        let syntaxes = [];

        // Loop through all children
        if (Array.isArray(this.child)) {
            for (var i = 0; i < this.child.length; i++) {
                let thesesyntaxes = this.child[i].getAllChildSyntaxes();
                let childName = this.child[i].name;
                if (this.child[i].type != "literal") {
                    childName = `<${childName}>`;
                }
                if (this.run) {
                    childName = `[${childName}]`;
                }
                for (var s = 0; s < thesesyntaxes.length; s++) {
                    syntaxes.push(`${childName} ${thesesyntaxes[s]}`);
                }
            }
        }


        // Just the one child
        else {
            syntaxes = this.child.getAllChildSyntaxes();
            let childName = this.child.name;
            if (this.child.type != "literal") {
                childName = `<${childName}>`;
            }
            if (this.run) {
                childName = `[${childName}]`;
            }
            for (var s = 0; s < syntaxes.length; s++) {
                syntaxes[s] = `${childName} ${syntaxes[s]}`;
            }
        }
        return syntaxes;
    }
};

// Contains info about all the commands
const commands = new CommandArgument("root", null, null, [
	new CommandArgument("literal", "help", message => {
        let prefix = guildprefixes.getPrefix(message.guild);
		let returnTxt = "";
		for (var i = 0; i < commands.child.length; i++) {
			returnTxt += `\n• \`${prefix}${commands.child[i].name} ${commands.child[i].getChildSyntax(true)}\``;
		}
		if (returnTxt == "") {
			return "You cannot execute any commands!";
		}
		return `You can execute the following commands: ${returnTxt}`;
	}),
	new CommandArgument("literal", "minesweeperraw", (message, inputs) => generateGame(undefined, undefined, undefined, message, true),
		new CommandArgument("integer", "gameWidth", null, 
			new CommandArgument("integer", "gameHeight", (message, inputs) => generateGame(inputs.gameWidth, inputs.gameHeight, undefined, message, true),
				new CommandArgument("integer", "numMines", (message, inputs) => generateGame(inputs.gameWidth, inputs.gameHeight, inputs.numMines, message, true),
					new CommandArgument("literal", "dontStartUncovered", (message, inputs) => generateGame(inputs.gameWidth, inputs.gameHeight, inputs.numMines, message, true, true))
				)
			)
		)
	),
	new CommandArgument("literal", "msraw", null),
	new CommandArgument("literal", "minesweeper", (message, inputs) => generateGame(undefined, undefined, undefined, message),
		new CommandArgument("integer", "gameWidth", null, 
			new CommandArgument("integer", "gameHeight", (message, inputs) => generateGame(inputs.gameWidth, inputs.gameHeight, undefined, message),
				new CommandArgument("integer", "numMines", (message, inputs) => generateGame(inputs.gameWidth, inputs.gameHeight, inputs.numMines, message),
					new CommandArgument("literal", "dontStartUncovered", (message, inputs) => generateGame(inputs.gameWidth, inputs.gameHeight, inputs.numMines, message, false, true))
				)
			)
		)
	),
	new CommandArgument("literal", "ms", null),
	new CommandArgument("literal", "info", message => {
        let prefix = guildprefixes.getPrefix(message.guild);
		let minesweeperSyntax = commands.child.find(arg => arg.name == "minesweeper").getChildSyntax(true);
		return `Hello, I'm a bot that can generate a random Minesweeper game using the new spoiler tags, for anyone to play! To generate a new minesweeper game, use the \`${prefix}minesweeper\` command (or its alias \`${prefix}ms\`):\n\`\`\`\n${prefix}minesweeper ${minesweeperSyntax}\n\`\`\`\`gameWidth\` and \`gameHeight\` tell me how many squares the game should be wide and tall, for a maximum of 40x20. Default is 8x8.\n\`numMines\` is how many mines there should be in the game, the more mines the more difficult it is. If omitted, I will pick a number based on the size of the game.\nWhen you run this command, I will reply with a grid of spoiler tags. Unless you wrote \`dontStartUncovered\`, the first zeroes will have already been opened for you.\n\nIf you don't know how to play Minesweeper, get out of the rock you've been living under and use the \`${prefix}howtoplay\` command. For a list of all commands and their syntaxes, use \`${prefix}help\`.\n\nMy creator is @JochCool#1314 and I'm at version ${package.version}. For those interested, my source code is available on GitHub: ${package.repository}. You can submit bug reports and feature requests there.\nThank you for using me!`;
	}),
	new CommandArgument("literal", "howtoplay", () => `In Minesweeper, you get a rectangular grid of squares. In some of those squares, mines are hidden, but you don't know which squares. The objective is 'open' all the squares that don't have a hidden mine, but to not touch the ones that do.\n\nLet's start with an example. ${generateGame(5, 5, 3)}\nTo open a mine, click the spoiler tag. So go click one now. The contents of that square will be revealed when you do so. If it's a mine (:bomb:), you lose! If it's not a mine, you get a mysterious number instead, like :two:. This number is there to help you, as it indicates how many mines are in the eight squares that touch it (horizontally, vertically or diagonally). Using this information and some good logic, you can figure out the location of most of the mines!`),
	new CommandArgument("literal", "news", () => {
		let returnTxt = "These were my past three updates:\n";
		for (var i = 0; i < 3 && i < updates.length; i++) {
			returnTxt += `\nVersion ${updates[i].name} \u2015 ${updates[i].description}`; // U+2015 = horizontal bar
		}
		return returnTxt;
	}),
	new CommandArgument("literal", "setprefix", null, 
		new CommandArgument("text", "prefix", (message, inputs) => {
			if (!message.guild) {
				return "The prefix can only be changed in a server, not here.";
			}
			if (!message.member.hasPermission("MANAGE_GUILD")) {
				return "You need the Manage Server permission to change the prefix.";
			}
			if (inputs.prefix.length == 0) {
				return "The prefix must be at least one character long.";
			}

            let prevprefix = guildprefixes.getPrefix(message.guild);
			if (prevprefix == inputs.prefix) {
				return "The prefix didn't change.";
			}

			guildprefixes.setPrefix(message.guild, inputs.prefix);
			return `The prefix of this server has been changed from \`${prevprefix}\` to \`${inputs.prefix}\`.`;
		})
	),
	new CommandArgument("literal", "ping", (message, inputs, client) => `pong (${Math.floor(client.ws.ping)}ms heartbeat)`)
]);

// cheating here because aliases haven't been implemented yet
commands.child[2].child = commands.child[1].child;
commands.child[2].run = commands.child[1].run;
commands.child[4].child = commands.child[3].child;
commands.child[4].run = commands.child[3].run;

module.exports = commands;
