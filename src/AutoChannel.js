const fs = require("fs/promises");
const Discord = require("discord.js");
const { generateGame } = require("./generateGame.js");
const log = require("./log.js");

// Object that maps channel ID to an AutoChannel instance
let autoChannels = {};

function save() {
	fs.writeFile("autoChannels.json", JSON.stringify(autoChannels)).catch(log);
};

class AutoChannel {
	constructor(channel, interval, gameSettings) {
		this.startTime = new Date();
		this.channel = channel;
		this.interval = interval;
		this.gameSettings = gameSettings;
	}

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

	// Returns either a channel or an error message
	static async tryFetchChannel(client, channelId) {
		let channel = await client.channels.fetch(channelId);
		if (!channel || channel.deleted) return "Cannot find that channel.";
		if (!channel.isText()) return "I can only send in text channels.";
		if (channel.permissionsFor && !channel.permissionsFor(channel.guild.me).has("SEND_MESSAGES")) {
			return "I do not have permission to send messages in that channel.";
		}
		return channel;
	}

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

	static get(channelId) {
		return autoChannels[channelId];
	}

	static create(channel, interval, gameSettings) {
		if (autoChannels[channel.id]) autoChannels[channel.id].stop();
		let autoChannel = new AutoChannel(channel, interval, gameSettings);
		autoChannels[channel.id] = autoChannel;
		save();
		autoChannel.start();
	}

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
