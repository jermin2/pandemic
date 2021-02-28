import { Schema, MapSchema, type } from "@colyseus/schema";

export class Player extends Schema{
  @type("number")
  x: number = 0.11;

  @type("number")
  y: number = 2.22;
}

export class MyRoomState extends Schema {

  @type("string")
  mySynchronizedProperty: string = "Hello world";

  @type({ map: Player })
  players = new MapSchema<Player>();
}