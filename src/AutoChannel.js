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
	 * @param {number} interval The number of minutes between sending games.
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
		 * The number of minutes between sending games.
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
		this.timeout = setInterval(() => {
			let message = generateGame(this.gameSettings);
			if (Array.isArray(message)) {
				for (let i = 0; i < message.length; i++) {
					this.channel.send(message[i]).catch(log);
				}
			}
			else {
				this.channel.send(message).catch(log);
			}
		}, this.interval * 60000);
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
	 * Fetches data for a channel and checks if the bot can send a message in this channel (if not, creates an error message).
	 * @param {Discord.Client} client The client to use for fetching channel data.
	 * @param {string} channelId The ID of the channel to fetch.
	 * @returns {Promise<Discord.Channel|string>} Either the successfully fetched channel or the error message.
	 */
	static async tryFetchChannel(client, channelId) {
		let channel = await client.channels.fetch(channelId);
		if (!channel || channel.deleted) return "Cannot find that channel.";
		if (!channel.isText()) return "I can only send in text channels.";
		if (channel.permissionsFor && !channel.permissionsFor(channel.guild.me).has("SEND_MESSAGES")) {
			return "I do not have permission to send messages in that channel.";
		}
		return channel;
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
			let channel = await this.tryFetchChannel(client, channelId);
			if (!(channel instanceof Discord.Channel)) {
				log(`Error with autochannel with ID ${channelId}. ${channel}`);
				continue;
			}

			let autoChannel = Object.assign(new AutoChannel(), json[channelId]);
			autoChannel.channel = channel;
			autoChannels[channelId] = autoChannel;
			autoChannel.start();
		}
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
	 * @param {number} interval The number of minutes between sending games.
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
