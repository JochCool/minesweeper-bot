const fs = require("fs/promises");
const Discord = require("discord.js");
const { generateGame } = require("./generateGame.js");
const log = require("./log.js");

// Object that maps channel ID to an AutoChannel instance
let autoChannels = {};

function save() {
	fs.writeFile("autoChannels.json", JSON.stringify(autoChannels)).catch(log);
};

/**
 * Contains data for an autochannel, created by the `/auto` command.
 */
class AutoChannel {

	/**
	 * Constructs an AutoChannel. Normally this should be called through {@link AutoChannel.create}.
	 * @param {Discord.Channel} channel The Discord channel to send the games in.
	 * @param {number} interval The number of milliseconds between sending games.
	 * @param {import("./generateGame.js").GameSettings} gameSettings The settings of the games.
	 */
	constructor(channel, interval, gameSettings) {

		/**
		 * The timestamp at which this autochannel was last created or changed.
		 * @type {Date}
		 */
		this.startTime = new Date();

		/**
		 * The Discord channel to send the games in.
		 * @type {Discord.Channel}
		 */
		this.channel = channel;

		/**
		 * The number of milliseconds between sending games.
		 * @type {number}
		 */
		this.interval = interval;

		/**
		 * The settings of the games.
		 * @type {import("./generateGame.js").GameSettings}
		 */
		this.gameSettings = gameSettings;
	}

	/**
	 * Starts regularly sending Minesweeper games in the channel. This method must only be called once before calling {@link AutoChannel.stop}.
	 */
	start() {
		this.timeout = setInterval(() => this.sendGame().catch(log), this.interval);
	}

	/**
	 * Sends a Minesweeper game in the Discord channel that this autochannel is for.
	 * @private
	 */
	async sendGame() {
		let message = generateGame(this.gameSettings);
		if (Array.isArray(message)) {
			for (let i = 0; i < message.length; i++) {
				let success = await this.sendMessage(message[i]);
				if (!success) return;
			}
		}
		else {
			await this.sendMessage(message);
		}
	}

	/**
	 * Sends a message in the Discord channel that this autochannel is for.
	 * @private
	 * @param {string} text The message to send.
	 * @returns {Promise<boolean>} Whether this message was successfully sent.
	 */
	async sendMessage(text) {
		try {
			let message = await this.channel.send(text);
			
			// In the support server, there is an announcement autochannel where the messages should be crossposted.
			// Join the support server to see: https://discord.gg/PCxZrrZ
			if (this.channel.id == "1042572396864999534") {
				await message.crosspost();
			}
			
			return true;
		}
		catch (err) {
			log("Auto message failed:");
			log(err);
			if (err instanceof Discord.DiscordAPIError) {
				// This likely means that the bot is not allowed to send messages here, so stop the autochannel to prevent more errors.
				AutoChannel.delete(this.channel.id);
			}
			return false;
		}
	}

	/**
	 * Reverses a {@link AutoChannel.start} call.
	 */
	stop() {
		clearTimeout(this.timeout);
	}

	toJSON() {
		return {
			startTime: this.startTime,
			interval: this.interval,
			gameSettings: this.gameSettings
		};
	}

	/**
	 * Checks if the bot can send a message in this channel (if not, creates an error message).
	 * @param {Discord.Channel} channel The channel to check.
	 * @returns {string|undefined} The error message, if the channel is not valid.
	 */
	static checkChannel(channel) {
		if (!channel || channel.deleted) return "This channel does not exist.";
		if (!channel.isText()) return "I can only send in text channels.";
		if (channel.permissionsFor && !channel.permissionsFor(channel.guild.me).has("SEND_MESSAGES")) {
			return "I do not have permission to send messages in this channel.";
		}
	}

	/**
	 * Loads all autochannels from the autoChannels.json file, and starts all autochannels that were loaded.
	 * 
	 * This function also fetches channel data for the loaded channels and determines if the bot can still send messages there; if not, the autochannel is deleted.
	 * @param {Discord.Client} client The client to use to for fetching channel data.
	 * @returns {Promise<void>}
	 */
	static async loadAndStartAll(client) {
		let json;
		try {
			let file = await fs.readFile("autoChannels.json", { encoding: "utf8" });
			json = JSON.parse(file);
		}
		catch (err) {
			log(err);
			log("A new autoChannels.json file will be created.");
			return;
		}
		for (let channelId in json) {
			let channel = await client.channels.fetch(channelId);
			let error = this.checkChannel(channel);
			if (error) {
				log(`Error with autochannel with ID ${channelId}. ${error}`);
				continue;
			}

			let autoChannel = Object.assign(new AutoChannel(), json[channelId]);
			autoChannel.channel = channel;
			autoChannel.startTime = new Date(autoChannel.startTime);
			
			autoChannel.timeout = setTimeout(() => {
				autoChannel.start();
				autoChannel.sendGame().catch(log);
			}, autoChannel.interval - (new Date() - autoChannel.startTime) % autoChannel.interval);
			
			autoChannels[channelId] = autoChannel;
		}
		log("All autochannels started.");
	}

	/**
	 * Gets the AutoChannel instance for a Discord channel.
	 * @param {string} channelId The ID of the Discord channel
	 * @returns {AutoChannel|undefined} The AutoChannel instance, if it exists.
	 */
	static get(channelId) {
		return autoChannels[channelId];
	}

	/**
	 * Creates an AutoChannel and starts it.
	 * @param {Discord.Channel} channel The Discord channel to send the games in.
	 * @param {number} interval The number of milliseconds between sending games.
	 * @param {import("./generateGame.js").GameSettings} gameSettings The settings of the games.
	 */
	static create(channel, interval, gameSettings) {
		if (autoChannels[channel.id]) autoChannels[channel.id].stop();
		let autoChannel = new AutoChannel(channel, interval, gameSettings);
		autoChannels[channel.id] = autoChannel;
		save();
		autoChannel.start();
	}

	/**
	 * Stops and deletes the AutoChannel for a certain Discord channel.
	 * @param {string} channelId The ID of the Discord channel.
	 * @returns {boolean} True if an autochannel was deleted; otherwise, false.
	 */
	static delete(channelId) {
		if (autoChannels[channelId]) {
			autoChannels[channelId].stop();
			autoChannels[channelId] = undefined;
			save();
			return true;
		}
		return false;
	}
}

module.exports = AutoChannel;
