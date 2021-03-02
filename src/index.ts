import http from "http";
import express from "express";
import cors from "cors";
import { Server, LobbyRoom } from "colyseus";
import { monitor } from "@colyseus/monitor";
// import socialRoutes from "@colyseus/social/express"

import { MyRoom } from "./rooms/MyRoom";

const port = Number(process.env.PORT || 2567);
const HOST = process.env.HOST||'127.0.0.1';
const app = express()

app.use(cors());
app.use(express.json())

const server = http.createServer(app);
const gameServer = new Server({
  server,
});

// Define "lobby" room
gameServer.define("lobby", LobbyRoom);

// register your room handlers
gameServer.define('game', MyRoom).enableRealtimeListing();

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/server/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);
app.engine('html', require('ejs').renderFile);

app.use(express.static('./'));



app.use('/lobby', function(req, res) {
  res.render('lobby.html');
})

app.use('/game', function(req,res) {
  res.render('game.html');
})

app.get('/admin', function(req, res) {
  res.render('admin.html');
});

app.get('/test', function(req, res) {
  res.render('index.html');
});
// app.use('/', function(req, res, next){
//   console.log("hello");
//   res.render('views/index.html');
//   next();

// })

// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());

app.use('/', function(req, res) {
  res.render('index.html');
})

gameServer.listen(port);
console.log(`Listening on ws://${HOST}:${ port }`)
