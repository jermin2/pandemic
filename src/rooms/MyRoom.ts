import { Room, Client } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState";


export class MyRoom extends Room {

  admin = "admin";
  password = "password";
  
  onCreate (options: any) {

    this.setMetadata( { name: options.name });

    console.log("Room created", options);
    this.admin = options.admin;
    this.password = options.password;


    this.setState(new MyRoomState());

    this.onMessage("type", (client, message) => {
    });

    this.onMessage("state", (client, message) => {
      if(message.new_state == "startGame"){

        if(this.state.players.size < 1){
          this.broadcast("admin", "No players in game!");
          return false;
        }

        console.log("Room locked, no new players can enter");
        this.lock();

        this.state.startGame(message.starting_infected, message.starting_rooms);
        this.broadcast("message", "Game Start");
        this.broadcast("admin", this.state.infected_players);

      } else if (message.new_state == "endGame"){
        console.log("Game ending");
        this.broadcast("admin", "End Game Signal Received");
        this.state.endGame();

        var players = new Array();
        this.state.players.forEach( (value:any, key:Player) => {
          players.push(value);
        });

        // Sort by the largest vaccines, tie broken by if infected or not
        players.sort( function(a:Player,b:Player){
          if(b.vaccines == a.vaccines){
            return a.infected - b.infected; //infected is 1, so we want to sort ascending
          }
          else 
            return b.vaccines - a.vaccines; // vaccines are sorted descending
          });
        this.broadcast("endGame", players);
        this.disconnect();
      }

      
    })

    this.onMessage("interact", (client, data) => {
      var r = this.state.playerInteract(client.sessionId, data.sessionId)
      console.log("r: " + r);
      if(r != false){ //only broadcast if you contacted a player
        this.broadcast("interact", { player1: client.sessionId, player2: data.sessionId, 
          player1name: this.state.players.get(client.sessionId).name,
          player2name: this.state.players.get(data.sessionId).name });

        this.broadcast("admin", r);
      }
      
      // is there a way to check if this returned anything?
      //this.broadcast(client.sessionId, "this is a private message");
    })

    this.onMessage("vaccine", (client, data) => {
      // returns true if a infection was cured
      var result = this.state.players.get(client.sessionId).useVaccine();
      client.send(client.sessionId, "Vaccine Used");

      if (result){
        this.broadcast("admin", this.getName(client.sessionId) + " was cured of infection!" );
      } else{
        this.broadcast("admin", this.getName(client.sessionId) + " used a vaccine but nothing happened");
      }
        
      
    })

    this.onMessage("checkStatus", (client, data) => {
      if(data.room < this.state.startingRooms){
        // check if its free
        var r = this.state.moveIntoRoom(client.sessionId, data.room);
        if(r){
          // If successfully moved into room
          this.broadcast("admin", `${this.getName(client.sessionId)} moved into room ${data.room}`);
          client.send("checkstatus", {inRoom: true, status: this.state.players.get(client.sessionId), room: data.room});
        } else { //return failed if couldn't get in room. is it occupied?
          client.send("checkstatus", {failed: true});
        }
      }
      if(data.action == "leave"){
        var s = this.state.moveOutofRoom(client.sessionId);

        if(s != -1){
          this.broadcast("admin", `${this.getName(client.sessionId)} has left room ${s}`);
          client.send("checkstatus", {leftRoom: true});
        }

      }
      
    })




  }

  getName(sessionId: any){
    return this.state.players.get(sessionId).name + "(" + sessionId + ")";
  }

  onAuth(client: Client, options: any, req: any){
    console.log("onAuth");
    console.log(options);

    if(options.password == this.password)
      return true;
    return false;
  }

  onJoin (client: Client, options: any) {
    console.log(this.admin);
    console.log(client.sessionId + " joined");
    console.log(options);
    if (options.playername)
    {
      // Create a new player and assign the name and sessionId
      var p = new Player();
      p.name = options.playername;
      p.owner = client.sessionId;

      //Add the player to the player list
      this.state.players.set(client.sessionId, p);
      this.broadcast("messages", `${options.playername} with id of ${ client.sessionId } joined.`);
    } else {
      console.log("Something not a player joined");
    }

  }

  async onLeave (client: Client, consented?: boolean) {
    console.log(client.sessionId, "left", { consented });
    // flag client as inactive for other users
    this.state.players[client.sessionId].connected = false; 

    //remove the client from any rooms
    this.state.moveOutofRoom(client.sessionId);

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
    client.send("adminTest", this.admin);
  }

  onDispose() {
    console.log("Disposed MyRoom");
  }

}
