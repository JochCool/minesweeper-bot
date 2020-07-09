# Minesweeper Bot
Hello! I'm a bot that can generate a random Minesweeper game using the new spoiler tags, for anyone to play! Use the command `!minesweeper` or `!ms` to generate a game.

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
My creator is @JochCool#1314. If you have any questions or other remarks, you can DM him. You can submit bug reports and feature requests on the GitHub page.
Note: sometimes you might not get a response from me when you run a command. Then that's probably because I'm temporarily offline, in which case please DM JochCool so he can fix it.
