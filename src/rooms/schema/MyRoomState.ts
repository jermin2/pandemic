import { Schema, MapSchema, type } from "@colyseus/schema";
import { Client } from "colyseus.js";

export class Player extends Schema{
  @type("number")
  vaccines: number = 0;

  @type("number")
  infected: number = 0;

  @type("string")
  name: string = "";

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
  gameState: string;

  @type({ map: Player })
  players = new MapSchema<Player>();

  @type("number")
  startingInfected: number = 1;

  player_interacts = new Set();

  infected_players = new Array();

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

  startGame(){
    this.gameState = "assign";
    this.assignPlayers();
  }

  endGame(){
    this.gameState = "ended";
  }

  assignPlayers(){
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

  showPlayers(){

    this.players.forEach((value, key) => {
      console.log("key =>", key)
      console.log("infected =>", value.infected)
      console.log("vaccines =>", value.vaccines)
    });
  }




}