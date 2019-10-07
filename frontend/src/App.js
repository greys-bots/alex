import React from 'react';
import * as fetch from 'node-fetch';
import './App.css';

import Commands from './components/commands';
import Stats from './components/stats';

function App() {
  return (
    <div className="App">
      <div className="App-header">
        <img src="/icon.png" className="App-avatar"/>
        <p className="App-title">Alex </p>
        <a className="App-button" href="https://discord.gg/EvDmXGt">need help?</a>
        <a className="App-button" href="https://github.com/greys-bots/alex">view source</a>
      </div>
      <div className="App-container">
        <section className="App-about">
          <div>
          <h1>Alex</h1>
          <h3><em>A <span className="App-color">heavy lifter</span> bot for Discord</em></h3>
          <p><strong>Alex</strong> is a Discord bot created by <a href="https://github.com/greysdawn">@greysdawn</a>{" "}
            to help hub-style servers. She can be used for listing and delisting servers, as well as creating a gated entryway{" "}
            and reaction roles. Her prefix is <em>ha!</em>, which stands for "hey alex."<br/>
            You can invite her using <a href="https://discordapp.com/api/oauth2/authorize?client_id=547849702465339403&permissions=268561526&scope=bot">this link</a>
          </p>
          </div>
        </section>
        <Stats />
        <Commands />
        <div className="App-note">
        <h1>Notes</h1>
        <p>This website is still a work in progress - check back later for more in-depth info on the commands! We're also working on a dashboard to make server management easier</p>
        <p><strong>Prefix:</strong> Alex's prefix is ha!</p>
        <p><strong>Permissions:</strong> The permissions that Alex needs are Manage Messages (for pruning),{" "}
                   Manage Roles (for creating, editing, etc roles), Send Messages (obviously), Embed Links (for the color embeds),{" "}
                   and Ban Members (speaks for itself). Giving him admin permissions may be the easiest way to go.
        </p>
        </div>
        <section className="App-footer">
          <div>
          <h1>Want to support the bot?</h1>
          <p>
            Currently, Alex is being run on a Vultr VPS along with a few other bots and the rest of our sites. At the moment this means that{" "}
            he only has 2gb of RAM to share with everything else, and we will eventually need an upgraded{" "}
            environment to run in. We're also without a job right now, and rely on patrons and donations to get by.<br/>
            If you'd like to donate, you can send money to our Ko-Fi or choose to become a Patron.
          </p>
          </div>
          <div className="App-links">
            <a href="https://ko-fi.com/greysdawn" className="App-button">Ko-Fi</a><br/>
            <a href="https://patreon.com/greysdawn" className="App-button">Patreon</a><br/>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
