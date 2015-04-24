Monodify

## Synopsis

Monodify allows you to control (pre-build 1.0) Spotify from a browser. Currently it works
by talking to Spotify via its AppleScript interface, so only OS X is supported
at the moment. Any Spotify version after 0.9.15.27 will not work.

![Screenshot](http://i.imgur.com/puLukgj.png)

## Installation

This assumes you already have Spotify installed

1. Install [Node.js](http://nodejs.org/)
2. Close Spotify
3. Lock Spotify from upgrading to that 1.0 + bullshit going forward (you might need to sudo su this)
```
$ rm -f ~/Library/Application\ Support/Spotify/Spotify_new.archive && touch ~/Library/Application\ Support/Spotify/Spotify_new.archive && chflags uchg ~/Library/Application\ Support/Spotify/Spotify_new.archive
$ rm -f ~/Library/Application\ Support/Spotify/Spotify_new.archive.sig && touch ~/Library/Application\ Support/Spotify/Spotify_new.archive.sig && chflags uchg ~/Library/Application\ Support/Spotify/Spotify_new.archive.sig
```
4. Download the last 3rd party supported version [Spotify 0.9.15.27] (http://mac.filehorse.com/download-spotify/4704/)
5. Replace your current version of Spotify with the old version
6. Install this repo:

```
$ git clone https://github.com/troyxmccall/monodify.git
$ cd monodify
$ npm install -g grunt-cli
$ npm install
$ npm start
$ open http://localhost:3333
```

To run jshint and the test suite, do the following:

```
$ npm test
```


## License

[Spotify](http://www.spotify.com) is a registered trademark of Spotify Ltd.
Monodify is in no way affiliated with Spotify

Use the however you want. Just be nice. Support indie music. Rock out to some doom folk. Buy me a coffee.
