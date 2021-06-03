# Alex
*A heavy lifter bot for hub-style servers*

Alex aids in the listing and delisting of servers, as well as banning members, using reaction roles, and managing starboards. She's the public version of [hubbot](https://github.com/greys-bots/hubbot)

## Getting started
You can get started by inviting her with [this](https://discordapp.com/api/oauth2/authorize?client_id=547849702465339403&permissions=268561526&scope=bot). After that, you'll need to do some setup- check out `ha!h cfg` for more info. You'll likely want a delist and banlog channel to boot, as well as a ban message.

To add a server, do the following:
1. Use an invite to the server with `ha!add` to fill the link, name, and icon automatically
2. Change the description with `ha!desc`
3. Add a contact with `ha!contact`
4. Make sure it's all correct with `ha!preview`
5. Post it to the desired channel(s) with `ha!post`

That's the basics! You can use `ha!h` to get help with any other commands, or join the support server if something isn't working for you.

## Features
### Listing and delisting
Alex's main function is creating fancy embeds for your partnered servers. These embeds are called *listings.* Removing them is considered delisting. The purpose of these embeds is to make things organizaed and cohesive between different server ads, as well as to make managing them easier for mods.

### Ban syncing
Alex also ships with a feature called *syncing*. Once you set up syncing in your server, anyone that you have listed can ask to sync with you. This will make it so that they'll get notifications in their server whenever you ban someone. You'll also get notifications if they ban someone using Alex's commands. This is intended primarily to help keep raiders, trolls, and other riff-raff out of your network of servers.

### Custom commands
**This feature is a work in progress, but still usable.** You can use custom commands to create commands that add/remove roles, blacklist users from using the bot, and more! Check out `ha!h cc` for more info.

### Extra tools
On top of all this, Alex also ships with features like starboards and reaction roles. Be sure to check out the help command for more info on all the things she can do.

## Support and links
[support server](https://discord.gg/EvDmXGt)  
[our patreon](https://patreon.com/greysdawn)  
[our ko-fi](https://ko-fi.com/greysdawn)

### Commissions
We do commissions! If you're interested in a bot or website, check out [this doc](https://docs.google.com/document/d/1hvqvqdWj0mpHeNjo_mr2AHF7La32nkp4BDLxO1dvTHw/edit?usp=drivesdk) for more info!

## Credit
Original Python version created by [@xSke](https://github.com/xSke), rewritten in JS and maintained by us
