import { Room, Client } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState";


export class MyRoom extends Room {

  onCreate (options: any) {
    console.log("Room created", options);

    this.setState(new MyRoomState());

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });

  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId + " joined");
    this.broadcast("messages", `${ client.sessionId } joined.`);
    this.state.players.set(client.sessionId, new Player());
  }

  async onLeave (client: Client, consented?: boolean) {
    console.log(client.sessionId, "left", { consented });
    // flag client as inactive for other users
    this.state.players[client.sessionId].connected = false; // This is not working

    try {
      if (consented) {
        throw new Error("consented leave");
      }

      console.log("awaiting reconnection");
      // allow disconnected client to reconnect into this room until 20 seconds
      await this.allowReconnection(client, 60);
      console.log("Reconnected!");

      // client returned! let's re-activate it
      this.state.players[client.sessionId].connected = true;

    } catch (e) {

      // 20 seconds expired. let's remove the client.
      delete this.state.players[client.sessionId];
    }
    client.send("status", "welcome back!");
  }

  onDispose() {
    console.log("Disposed MyRoom");
  }

}
