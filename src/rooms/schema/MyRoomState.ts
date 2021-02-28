import { Schema, MapSchema, type } from "@colyseus/schema";

export class Player extends Schema{
  @type("number")
  vaccines: number = 0;

  @type("number")
  infected: number = 0;
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

  createPlayer(sessionId: string) {
    this.players.set(sessionId, new Player());
  }

  removePlayer(sessionId: string) {
    this.players.delete(sessionId);
  }

  playerInteract(sessionId: string, sessionId_2: string){

    try{
      let player1 = this.players.get(sessionId);
      let player2 = this.players.get(sessionId_2);

      // if one player is infect, the other is also infected
      if (player1.infected == 0){ //if player1 is normal
        if (player2.infected == 1){
          player1.infected = 1;
          console.log(sessionId + " got infected");
  
          // If player 1 had vaccine, player2 gets cured
          if(player1.vaccines > 0){
            player2.infected = 0;
            console.log(sessionId_2 + " got cured");
            player1.vaccines--;
          }
          //if both were normal, increase the vaccines
        } else if (player2.infected == 0){
          player1.vaccines++;
          player2.vaccines++;
        }
      } else if (player1.infected == 1){
        //assume player2 is not infected and player1 is infected
        player2.infected = 1; // player2 becomes infected
        console.log(sessionId_2 + " got infected");
  
        if(player2.vaccines > 0){
          player1.infected = 0; //player1 gets cured
          player2.vaccines--;
        }
      }

    } catch (e) {
      console.log(e);
    }

    
    // // If the normal player had a vaccine, then the other player becomes normal
    // if both players are normal, then vaccine is created
    // if both players are infected, then nothing happens
    console.log("something happened");
  }

  setInfected(num: number) {
    this.startingInfected = num;
  }

  startGame(){
    this.gameState = "assign";
    this.assignPlayers();
  }

  assignPlayers(){
    console.log("assigning players");
    let x;

    let keys = Array.from(this.players);
    for( x=0; x < this.startingInfected; x++){
      let index = Math.floor(Math.random() * keys.length);
      let a = keys[index][0];
      this.players.get(a).infected = 1;
      console.log(a + " is infected!");
      keys.splice(index, 1)

      //console.log(a);
    }
  }

  showPlayers(){
    this.players.forEach((value, key) => {
      console.log("key =>", key)
      console.log("infected =>", value.infected)
      console.log("vaccines =>", value.vaccines)
    });
  }




}