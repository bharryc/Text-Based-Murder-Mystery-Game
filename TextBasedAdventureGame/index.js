const express = require('express');
const readline = require('readline');
const expressWs = require('express-ws');

const app = express();
const port = process.env.PORT || 8080;

// class for room 
class Room {
    constructor(name, description, exits){
        this.name = name;
        this.description = description;
        this.exits = exits;
    }
}

// class for player  
class Player {
    constructor(){
        this.currentRoom = null;
    }

    // moves player to a room
    moveToRoom(room){
        this.currentRoom = room;
    }

    // returns the room description of the current room
    getRoomInfo(){
        return `${this.currentRoom.description}\nExits: ${Object.keys(this.currentRoom.exits).join(', ')}`;
    }
}

// class for game
class Game {
    constructor() {
        // list of rooms in the game
        this.rooms = {
            'garage': new Room('Garage', 'You are in the garden. There are exits to the east and south.', { east: 'kitchen', south: 'garden' }),
            'kitchen': new Room('Kitchen', 'You are in the kitchen. There are exits to the west, east and south.', {east: 'games_room', west: 'garden', south: 'courtyard'}),
            'games_room': new Room('Games Room', 'You are in the games room. There are exits to the west and south.', {west: 'kitchen', south: 'dining_room'}),
            'dining_room': new Room('Dining Room', 'You are in the dining room. There are exits to the north, west and south.', {north: 'games_room', west: 'courtyard', south: 'living_room'}),
            'living_room': new Room('Living Room', 'You are in the living room. There are exits to the north and west.', {north: 'dining_room', west: 'bedroom'}),
            'bedroom': new Room('Bedroom', 'You are in the bedroom. There are exits to the north, west and east.', {north: 'courtyard', west: 'bathroom', east: 'living_room'}),
            'garden': new Room('Garden', 'You are in the garden. There are exits to the north, east and south.', {north: 'garage', east: 'courtyard', south: 'bathroom'}),
            'bathroom': new Room('Bathroom', 'You are in the bathroom. There are exits to the north, east.', {north: 'garden', east: 'bedroom'}),
            'courtyard': new Room('Courtyard', 'You are in the courtyard. There are exits to the north, east, west and south.', {north: 'kitchen', west: 'garden', south: 'bedroom', east: 'dining_room'})
        }

        this.player = new Player();
        this.player.moveToRoom(this.rooms['courtyard']);

        this.setUp();
    }

    setUp(){
        // initialise websocket server
        app.ws('/index', (ws, req) => {
            ws.on('message', async (userInput) => {
                const command = userInput.trim().toLowerCase();
                await this.handleInput(command, ws);
            });
            
            // welcome message
            ws.send('Welcome to the text adventure game');
            ws.send('Type commands in to navigate.')
            ws.send('Type "help" for a list of commands');
            ws.send('Type "quit" to exit the game');
            ws.send(' ');
            ws.send('--------------------------------------');
            ws.send(' ');
            ws.send(this.player.getRoomInfo());
        });

        app.get('/', (req, res) => {
            res.sendFile(__dirname + '/index.html');
        });

        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        })
    }

    async handleInput(input, ws){
        const command = input.split(' ')[0];

        // execute command
        switch (command){
            case 'go':
                const direction = input.split(' ')[1];
                if (this.player.currentRoom.exits[direction]){
                    this.player.moveToRoom(this.rooms[this.player.currentRoom.exits[direction]]);
                    ws.send(' ');
                    ws.send(this.player.getRoomInfo());
                    ws.send(' ');
                }else {
                    ws.send(' ');
                    ws.send('You can\'t go thay way');
                    ws.send(' ');
                }
                break;
            case 'description':
                ws.send(' ');
                ws.send(this.player.getRoomInfo());
                ws.send(' ');
            case 'help':
                ws.send(' ');
                ws.send('List of available commands: ');
                ws.send('"go x : add direction to command to move to a room');
                ws.send('"description" : gives current room description');
                ws.send('"quit" : exits game');
                ws.send(' ');
                break;
            case 'quit':
                ws.send(' ');
                ws.send('Goodbye');
                ws.send(' ');
                break;
            default:
                ws.send(' ');
                ws.send('Invalid command');
                ws.send(' ');
        }
    }
}

const game = new Game();