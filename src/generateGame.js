// This function is the heart of the bot; it generates the Minesweeper game. It gets called whenever the minesweeper command is executed.

const settings = require("../settings.json");

// If you add these xy values to some other coordinate, you'll get the eight neighbours of that coordinate.
const neighbourLocations = [{x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 1}, {x: -1, y: 1}, {x: -1, y: 0}];

const numberEmoji = [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:"];

/**
 * Contains the settings for a Minesweeper game.
 * @typedef {Object} GameSettings
 * @property {number} width The width of the game.
 * @property {number} height The height of the game.
 * @property {number} numMines The number of mines in the game.
 * @property {boolean} startsNotUncovered Whether the game should *not* start partially uncovered.
 */

/**
 * Checks if game settings are valid, and creates an error message if not.
 * @param {GameSettings} gameSettings The settings to check. This object may be modified.
 * @returns {string|undefined} The error message, if the game settings are invalid.
 */
function checkGameSettings(gameSettings) {

	let tooSmall;
	let tooLarge;

	if (isNaN(gameSettings.width)) {
		gameSettings.width = isNaN(gameSettings.height) ? settings.defaultGameSize : gameSettings.height;
	}
	else if (gameSettings.width <= 0) {
		tooSmall = gameSettings.width + " squares wide";
	}
	else if (gameSettings.width > settings.maxGameWidth) {
		tooLarge = "wide";
	}

	if (isNaN(gameSettings.height)) {
		gameSettings.height = gameSettings.width;
	}
	else if (gameSettings.height <= 0) {
		if (tooSmall) tooSmall = `sized ${gameSettings.width} by ${gameSettings.height}`;
		else          tooSmall = gameSettings.height + " squares high";
	}
	else if (gameSettings.height > settings.maxGameHeight) {
		if (tooLarge) tooLarge = "large";
		else          tooLarge = "tall";
	}

	if (tooSmall) {
		return `Uh, I'm not smart enough to generate a game ${tooSmall}. I can only use positive numbers. Sorry :cry:`;
	}
	if (tooLarge) {
		return `That's way too ${tooLarge}! Think of all the mobile users who are going to see this!`;
	}
	
	// Check mine count
	if (isNaN(gameSettings.numMines)) {
		gameSettings.numMines = Math.round(gameSettings.width * gameSettings.height * settings.defaultMineCount);
	}
	else if (gameSettings.numMines <= 0) {
		return "You think you can look clever by solving a Minesweeper game without mines? Not gonna happen my friend.";
	}
	else if (gameSettings.numMines > gameSettings.width * gameSettings.height) {
		return `I can't fit that many mines in a game sized ${gameSettings.width}x${gameSettings.height}!`;
	}
}

/**
 * Returns the text that the bot should reply with based on the given settings (that are already assumed to be valid).
 * @param {GameSettings} gameSettings The settings of the game (must already have been validated).
 * @param {boolean} isRaw True if the game should be within a code block; otherwise, false.
 * @returns {string|Array<string>} The message(s) that the bot should reply with.
 */
function generateGame(gameSettings, isRaw) {
	let { width, height, numMines, startsNotUncovered } = gameSettings;
	
	/** ──────── CREATE GAME ──────── **/
	
	// 2D array that contains the game, sorted [y][x]. -1 means a mine, positive number is the amount of neighbouring mines.
	let game = [];
	
	// Initialise the game array with zeroes
	for (let y = 0; y < height; y++) {
		game.push([]);
		for (let x = 0; x < width; x++) {
			game[y].push(0);
		}
	}
	
	function coordIsInGame(x, y) {
		return y >= 0 && y < game.length &&
		       x >= 0 && x < game[y].length;
	};
	
	// Fill the game with mines!
	for (let mine = 0; mine < numMines; mine++) {
		let x = Math.floor(Math.random()*width),
		    y = Math.floor(Math.random()*height);
		
		// Retry if there was already a mine there
		if (game[y][x] === -1) {
			mine--;
			continue;
		}
		
		game[y][x] = -1;
		
		// Add 1 to all neighbouring tiles
		for (let j = 0; j < neighbourLocations.length; j++) {
			let newX = x + neighbourLocations[j].x;
			let newY = y + neighbourLocations[j].y;
			if (coordIsInGame(newX, newY) && game[newY][newX] !== -1) {
				game[newY][newX]++;
			}
		}
	}
	
	/** ──────── UNCOVERING ──────── **/
	
	// 2D array, each value is either falsy (not uncovered) or true (uncovered)
	let uncoveredLocations = [];
	for (let y = 0; y < game.length; y++) {
		uncoveredLocations.push([]);
	}
	
	if (!startsNotUncovered) {

		// Find the coordinates of all zeroes in the game (array will contain objects with x and y properties)
		let zeroLocations = [];
		for (let y = 0; y < game.length; y++) {
			for (let x = 0; x < game[y].length; x++) {
				if (game[y][x] === 0) {
					zeroLocations.push({x: x, y: y});
				}
			}
		}
		
		// Uncover a random region
		if (zeroLocations.length > 0) {
			
			// Select random starting point
			let locationsToUncover = [];
			let firstCoord = zeroLocations[Math.floor(Math.random()*zeroLocations.length)];
			uncoveredLocations[firstCoord.y][firstCoord.x] = true;
			locationsToUncover.push(firstCoord);
			
			// Uncover neighbouring tiles
			while (locationsToUncover.length > 0) {
				for (let j = 0; j < neighbourLocations.length; j++) {
					
					let newX = locationsToUncover[0].x + neighbourLocations[j].x;
					let newY = locationsToUncover[0].y + neighbourLocations[j].y;
					if (!coordIsInGame(newX, newY) || uncoveredLocations[newY][newX]) continue;
					uncoveredLocations[newY][newX] = true;
					
					// Continue uncovering
					if (game[newY][newX] === 0) {
						locationsToUncover.push({ x: newX, y: newY });
					}
				}
				locationsToUncover.shift();
			}
		}
	}
	
	/** ──────── CREATE REPLY ──────── **/
	
	let messages; // will be an array in case the message needs to be split up
	let message;
	if (numMines === 1) message = `Here's a board sized ${width}x${height} with 1 mine:`;
	else                message = `Here's a board sized ${width}x${height} with ${numMines} mines:`;
	
	if (isRaw) message += "\n```";

	// For some stupid reason, Discord cuts off the message on the 200th emoji or spoiler tag (200 "symbol"s).
	// Therefore, keep track of them and split the message up in case it's too many
	let symbolCount = 0;
	
	for (let y = 0; y < game.length; y++) {
		let newLine = "";
		let newSymbolCount = 0;
		for (let x = 0; x < game[y].length; x++) {
			if (game[y][x] === -1) {
				newLine += "||:bomb:||";
				newSymbolCount += 2;
			}
			else if (!startsNotUncovered && uncoveredLocations[y][x]) {
				newLine += numberEmoji[game[y][x]];
				newSymbolCount += 1;
			}
			else {
				newLine += `||${numberEmoji[game[y][x]]}||`;
				newSymbolCount += 2;
			}
		}
		// Split up if there's either too many characters or too many emoji/spoilers
		if (message.length + newLine.length >= 1996 || symbolCount + newSymbolCount >= 200) {
			if (!messages) messages = [];
			if (isRaw) {
				message += "\n```";
				newLine = "```\n" + newLine;
			}
			messages.push(message);
			message = newLine;
			symbolCount = newSymbolCount;
		}
		else {
			message += "\n" + newLine;
			symbolCount += newSymbolCount;
		}
	}
	
	if (isRaw) message += "\n```";
	if (messages) {
		messages.push(message);
		return messages;
	}
	return message;
};

module.exports = {
	generateGame: generateGame,
	checkGameSettings: checkGameSettings
};
