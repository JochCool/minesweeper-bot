# Minesweeper Bot
Hello! I'm a verified Discord bot that can generate a random Minesweeper game using the new spoiler tags, for anyone to play! Use the command `!minesweeper` or `!ms` to generate a game.

## The Minesweeper Command
The `!minesweeper` command works like this:
```
!minesweeper [<gameWidth> <gameHeight> [<numMines> [dontStartUncovered]]]
```
* `gameWidth` and `gameHeight` tell me how many squares the game should be wide and tall, for a maximum of 40x20. Default is 8x8.
* `numMines` is how many mines there should be in the game, the more mines the more difficult it is. If omitted, I will pick a number based on the size of the game.
When you run this command, I will reply with a grid of spoiler tags. Unless you wrote `dontStartUncovered`, the first zeroes will have already been opened for you.

## Other Commands
Here's the other commands I listen to:
* `!ms` — alias of `!minesweeper`.
* `!minesweeperraw` — same as `!minesweeper`, but it gives you the raw text/copypasta so you can share the game.
* `!msraw` — alias of `!minesweeperraw`.
* `!help` — shows this list of commands.
* `!info` — displays info about me.
* `!howtoplay` — displays a tutorial about how to play the game.
* `!news` — displays info about my latest updates.
* `!setprefix` — allows you to change the prefix of all my commands. Requires Manage Server permission to execute.
* `!ping` — displays my heartbeat ping.

## Other info
My creator is @JochCool#1314. If you have any questions or other remarks, you can DM him, or join my Discord support server: https://discord.gg/PCxZrrZ. You can submit bug reports and feature requests on the GitHub page.
Note: sometimes you might not get a response from me when you run a command. Then that's probably because I'm temporarily offline, in which case please DM JochCool so he can fix it.

## Installation
If you want to try this code out or run it on a private bot, that is allowed, as long as you remember that the code is published under an MIT license. This means that you must include the LICENSE file every time you distribute this code.

1. If you haven't done so already, go to https://discord.com/developers/applications and create a new application and turn it into a bot. Go to the "Bot" page and copy the token. You'll need it later.
2. Clone the repository from GitHub. (Click the green button in the top right corner of the repo that says "code", and click "Download ZIP". Alternatively, if you have Git installed, you can use `git clone https://github.com/JochCool/minesweeper-bot.git`.)
3. Open the file "auth.json" and on the second line of that file (where it says `"bottoken": "CENSORED"`), replace the word "CENSORED" with the token you copied at step 1. You can ignore the `"topggtoken"`.
4. Download and install [NodeJS](https://nodejs.org).
5. Open the command line and navigate to the folder in which you unzipped the repo at step 2 (using the `cd` command). Then type `npm install discord.js`.
6. Run `node bot.js`. Have fun!

If you encounter an error, please [open an issue](https://github.com/JochCool/minesweeper-bot/issues) and I'll take a look.

Note: I have plans to change how step 3 works in the future to make it more secure.
