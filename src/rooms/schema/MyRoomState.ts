import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";
import { Client } from "colyseus.js";

export class Player extends Schema{
  @type("number")
  vaccines: number = 0;

  @type("number")
  infected: number = 0;

  @type("string")
  name: string = "";

  @type("number")
  checks_available: number = 0;

  @type("string")
  owner: string; //contains the sessionId of the player

  // If have more than one vaccine, and is infected, remove infection and reduce vaccines
  useVaccine() {
    if(this.vaccines > 0){
      this.vaccines--;
      if(this.infected == 1){
        this.infected = 0;
        return true;
      }
    }
    return false;
  }
}

export class MyRoomState extends Schema {

  @type("string")
  mySynchronizedProperty: string = "Hello world";

  @type("string")
  gameState: string = "waiting";

  @type({ map: Player })
  players = new MapSchema<Player>();

  @type("number")
  startingInfected: number = 1;

  @type("number")
  startingRooms: number = 1;

  @type("number")
  startingChecks: number = 1;

  @type(["string"])
  statusRooms = new ArraySchema<string>();



  @type("number")
  dummy: number = 0;

  player_interacts = new Set();

  infected_players = new Array();

  setupRooms(num: number){
    for(let i=0; i<num; i++){
      this.statusRooms[i] = "-1";
    }
    console.log("setuprooms");
    console.log(this.statusRooms);
  }

  moveIntoRoom(sessionId: string, room: number){

    this.gameState = "inProgress";
    var player = this.players.get(sessionId);

    if(player.checks_available == 0) return false; //if no more checks. if -1 means unlimited

    //console.log("move into room: " + room);
    // If there is someone in the room, return false
    if(this.statusRooms[room] != "-1"){
      return false;
    } else {
      // Otherwise set the sessionId to the room and return true
      this.statusRooms[room] = sessionId;
      if(player.checks_available > 0)
        player.checks_available--; //reduce checks available if greator than 0
      //console.log("success");
      return true;
    }
  }

  // Move out of the status checking room. Find the room they are occupying. 
  // Remove them from room. If can't find them, return -1
  moveOutofRoom(sessionId: string){
    
    var i = this.statusRooms.indexOf(sessionId);

    //console.log("move out of room:" + i);
    if( i == -1){
      return -1; //not in a room
    } else {
      this.statusRooms[i] = "-1";
      //console.log("success");
      return i;
    }
  }

  // Returns the value to put in the Set
  getSetValue(sessionId: string, sessionId_2:string){
    //compare the two sessionIds, and put one before the other
    if(sessionId.localeCompare(sessionId_2) > 0){
      return sessionId.concat(sessionId_2);
    } else{
      return sessionId_2.concat(sessionId);
    }
  }

  createPlayer(sessionId: string) {
    this.players.set(sessionId, new Player());
  }

  removePlayer(sessionId: string) {
    this.players.delete(sessionId);
  }

  // Return a string message if stuff happened. Otherwise returns false
  playerInteract(sessionId: string, sessionId_2: string){

    if(sessionId == sessionId_2) return false // Can't touch yourself

    console.log("check if player in room");
    //If player is in a room, can't touch
    if(this.statusRooms.indexOf(sessionId) > -1) return false;
    if(this.statusRooms.indexOf(sessionId_2) > -1) return false;

    //check if player exists
    if(this.players.get(sessionId) == null) return false;
    if(this.players.get(sessionId_2) == null) return false;


    console.log("player not in room");
    var k = this.getSetValue(sessionId, sessionId_2);
    if(this.player_interacts.has(k)){
      //They have already interacted, don't do anything
      return false;
    }

    var msg = "";
    // If one player is infected and the other is normal, the normal is now infected
    // If the normal player had a vaccine, then the other player becomes normal
    // if both players are normal, then vaccine is created
    // if both players are infected, then nothing happens

    this.gameState = "inProgress";
    try{
      let player1 = this.players.get(sessionId);
      let player2 = this.players.get(sessionId_2);

      this.player_interacts.add(k); // Add interaction to the set so they can't interact again

      // if one player is infect, the other is also infected
      if (player1.infected == 0){ //if player1 is normal
        if (player2.infected == 1){
          player1.infected = 1;
          msg = msg.concat(sessionId + " got infected; ");
  
          // If player 1 had vaccine, player2 gets cured
          if(player1.vaccines > 0){
            player2.infected = 0;
            msg = msg.concat(sessionId_2 + " got cured; ");
            player1.vaccines--;
          }
          //if both were normal, increase the vaccines
        } else if (player2.infected == 0){
          player1.vaccines++;
          player2.vaccines++;
          msg = msg.concat(sessionId_2, " and ", sessionId, " made contact");
        }
      } else if (player1.infected == 1){
        //assume player2 is not infected and player1 is infected
        if(player2.infected == 0){
          player2.infected = 1; // player2 becomes infected
          msg = msg.concat(sessionId_2 + " got infected; ");

          if(player2.vaccines > 0){
            player1.infected = 0; //player1 gets cured
            player2.vaccines--;
          }
          
        }
        else{
          msg = msg.concat(sessionId_2 + " and " + sessionId + " are both already infected; ");
        }
        
      }

      return msg;

    } catch (e) {
      console.log(e);
      // Invalid sessionId
      return false;
    }

  }

  setInfected(num: number) {
    this.startingInfected = num;
  }

  startGame(starting_infected: number, starting_rooms: number, starting_checks: number){
    this.gameState = "assign";
    // Setup the rooms
    this.startingRooms = starting_rooms;
    this.setupRooms(starting_rooms);

    this.players.forEach( p => {
      p.checks_available = starting_checks;
    })
    this.startingChecks = starting_checks;

    this.startingInfected = starting_infected;
    this.assignPlayers();

    console.log("finished setting up rooms");
    
  }

  endGame(){
    this.gameState = "ended";
  }

  assignPlayers(){

    //Error check the starting_infected
    if (this.startingInfected > this.players.size){
      this.startingInfected = 1;
    }
    console.log("assigning players");
    let x;

    // Get a list of players, randomly assign some to be the starting infected
    let keys = Array.from(this.players);
    for( x=0; x < this.startingInfected; x++){
      let index = Math.floor(Math.random() * keys.length);
      let a = keys[index][0];
      this.players.get(a).infected = 1;
      console.log(a + " is infected!");
      this.infected_players.push(this.players.get(a));
      keys.splice(index, 1)

      //console.log(a);
    }
    this.gameState = "started";
    
  }




}