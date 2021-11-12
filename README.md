# Pandemic

An implementation of the Pandemic game from the "Liar Game"
Built using colyseus framekwork for Node.js, Typescript

## How to play
Full list of rules here:
https://jermin-pandemic.herokuapp.com/


## Features
- Lobby where you can find games and play
- Status room to check your status

## Structure

- `index.ts`: main entry point, register an empty room handler and attach [`@colyseus/monitor`](https://github.com/colyseus/colyseus-monitor)
- `src/rooms/MyRoom.ts`: an empty room handler for you to implement your logic
- `src/rooms/schema/MyRoomState.ts`: an empty schema used on your room's state.
- `loadtest/example.ts`: scriptable client for the loadtest tool (see `npm run loadtest`)
- `tsconfig.json`: TypeScript configuration file


## License

MIT
