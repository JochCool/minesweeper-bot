# Minesweeper Bot
Hello! I'm a verified Discord bot that can generate a random Minesweeper game using the new spoiler tags, for anyone to play! Use the command `/minesweeper` or `/ms` to generate a game.

I listen to both [slash commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ) and text commands (simply typing in chat). For text commands, the default command prefix is `!`, but this can be changed (see below). Note that starting 1 September 2022, Discord will no longer allow text commands, and you will have to start using slash commands.

[Click here to invite the bot](https://discord.com/api/oauth2/authorize?client_id=540917634695168010&scope=applications.commands%20bot). To execute text commands, the bot will need "View Channel" and "Send Messages" permissions; this is not necessary for slash commands.

## The Minesweeper Command
The `/minesweeper` command works like this:
```
/minesweeper [<game-width> [<game-height> [<num-mines> [<dont-start-uncovered>]]]]
```
* `<game-width>` and `<game-height>` tell me how many squares the game should be wide and tall, for a maximum of 40x20. Default is 8x8.
* `<num-mines>` is how many mines there should be in the game, the more mines the more difficult it is. If omitted, I will pick a number based on the size of the game.

When you run this command, I will reply with a grid of spoiler tags. Unless you set the `<dont-start-uncovered>` parameter to true, the first zeroes will have already been opened for you.

## Other Commands
Here's the other commands I listen to:
* `/minesweeperraw` — same as `/minesweeper`, but it gives you the raw text/copypasta so you can share the game.
* `/info` — displays info about me.
* `/howtoplay` — displays a tutorial about how to play the game.
* `/news` — displays info about my latest updates.
* `/ping` — displays my heartbeat ping.

The following are text commands only:
* `/setprefix` — allows you to change the prefix of all my text commands. Requires Manage Server permission to execute.
* `/help` — shows a list of commands.
* `/ms` — alias of `/minesweeper`.
* `/msraw` — alias of `/minesweeperraw`.

## Q&A
### I have gone offline and am not responding to any commands!
Oh no! Please ping my creator so he can revive me (see the [contact](#Contact) section)!

### There are no slash commands!
This may be because I don't have permissions to add slash commands to your server; to fix this you must re-invite me using the link above. Also, verify that you have the "Use Application Commands" permission in the server. In any case, you should be able to use slash commands in a DM with me.

### Some spoiler tags are missing in large games!
That's Discord's fault, not mine. (See issue [#24](https://github.com/JochCool/minesweeper-bot/issues/24) on GitHub.)

## Contact
My creator is @JochCool#1314. If you have any questions or other remarks, you can DM him, create an issue on GitHub, or join my Discord support server: https://discord.gg/PCxZrrZ.

## Installation
If you want to try my code out or run me on a private bot, that is allowed, as long as you remember that the code is published under an MIT license. This means that you must include the LICENSE file every time you distribute the code.

1. If you haven't done so already, go to https://discord.com/developers/applications and create a new application and turn it into a bot. Take note of two things: the application ID, and the token (on the "Bot" page). You'll need them later.
2. Clone the repository from GitHub. (Click the green button in the top right corner of the repo that says "code", and click "Download ZIP". Alternatively, if you have Git installed, you can use `git clone https://github.com/JochCool/minesweeper-bot.git`.)
3. Open the file "auth.json" and on the second line of that file (where it says `"bottoken": "CENSORED"`), replace the word `CENSORED` with the token from step 1. You can ignore the `"topggtoken"`.
4. Download and install [NodeJS](https://nodejs.org).
5. Open the command line and navigate to the folder in which you unzipped the repo at step 2 (using the `cd` command). Then type `npm install discord.js @discordjs/rest`.
6. To register the slash commands (optional), type `node setup.js <id>`, and where it says `<id>` paste the application ID from step 1. Note that it may take up to an hour before the commands appear.
7. Run `node ./` to get me online. Have fun!

If you encounter an error, please [open an issue](https://github.com/JochCool/minesweeper-bot/issues) and my creator will take a look.
