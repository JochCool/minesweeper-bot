# Minesweeper Bot
Hello! I'm a verified Discord bot that can generate a random Minesweeper game using the new spoiler tags, for anyone to play! [Click here to add me to your server](https://discord.com/api/oauth2/authorize?client_id=540917634695168010&scope=applications.commands%20bot), and then use the command `/minesweeper` to generate a game.

In servers, you can only use [slash commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ). Discord no longer allows text commands in servers, but you can still use them in a DM with me (the prefix is `!`).

## The Minesweeper Command
When you run the `/minesweeper` command, I will reply with a grid of spoiler tags. It has four options:
* `game-width` and `game-height` tell me how many squares the game should be wide and tall, for a maximum of 24x20. Default is 8x8.
* `num-mines` is how many mines there should be in the game; the more mines the more difficult it is. If omitted, I will pick a number based on the size of the game.
* If you set `dont-start-uncovered` to true, all squares will start unopened. Otherwise, the first zeroes will have already been opened for you.

## Other Commands
Here's the other commands I listen to:
* `/minesweeperraw`&nbsp;&ndash; same as `/minesweeper`, but it gives you the raw text/copypasta so you can share the game.
* `/auto`&nbsp;&ndash; makes me send a new Minesweeper game at regular intervals in the channel. (Requires Manage Channel permissions. You can stop me again by setting the interval to 0.)
* `/info`&nbsp;&ndash; displays info about me.
* `/howtoplay`&nbsp;&ndash; displays a tutorial about how to play the game.
* `/news`&nbsp;&ndash; displays info about my latest updates.
* `/ping`&nbsp;&ndash; displays my heartbeat ping.

The following are text commands only:
* `/setprefix`&nbsp;&ndash; allows you to change the prefix of all my text commands. Requires Manage Server permission to execute.
* `/help`&nbsp;&ndash; shows a list of commands.
* `/ms`&nbsp;&ndash; alias of `/minesweeper`.
* `/msraw`&nbsp;&ndash; alias of `/minesweeperraw`.

## Feedback
My creator is @JochCool#1314. If you have any feedback, questions or other remarks, you can DM him, create an issue on GitHub, or join my Discord support server: https://discord.gg/PCxZrrZ.

## Q&A
### I have gone offline and am not responding to any commands!
Oh no! Please ping my creator so he can revive me (see the [contact](#Contact) section)!

### There are no slash commands!
This may be because you do not have the "Use Application Commands" permission. Otherwise, try re-inviting me to the server (and verify that "Create commands in a server" is checked).

## Installation
If you want to try my code out or run me on a private bot, that is allowed, as long as you remember that the code is published under an MIT license. This means that you must include the LICENSE file every time you distribute the code.

1. If you haven't done so already, go to https://discord.com/developers/applications and create a new application and turn it into a bot. Take note of two things: the application ID, and the token (on the "Bot" page). You'll need them later.
2. Clone the repository from GitHub. (Click the green button in the top right corner of the repo that says "code", and click "Download ZIP". Alternatively, if you have Git installed, you can use `git clone https://github.com/JochCool/minesweeper-bot.git`.)
3. Open the file "auth.json" and on the second line of that file (where it says `"bottoken": "CENSORED"`), replace the word `CENSORED` with the token from step 1. You can ignore the `"topggtoken"`.
4. Download and install [NodeJS](https://nodejs.org).
5. Open the command line and navigate (using the `cd` command) to the folder in which you unzipped the repo at step 2. Then type `npm install discord.js @discordjs/rest`.
6. If you want, you can change some of the bot's settings by editing the `settings.json` file.
7. To register the slash commands (optional), type `node setup.js <id>`, and where it says `<id>` paste the application ID from step 1. Note that it may take up to an hour before the commands appear.
8. Run `node ./` to get me online. Have fun!

If you encounter an error, please [open an issue](https://github.com/JochCool/minesweeper-bot/issues) and my creator will take a look.
