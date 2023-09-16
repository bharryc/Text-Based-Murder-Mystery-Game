const express = require('express');
const readline = require('readline');
const expressWs = require('express-ws')

const app = express();
const port = process.env.PORT || 8080;
const wsInstance = expressWs(app);

// Rooms in the game
const rooms = {
    'garage' : {
        name: 'Garage', 
        description: "You are in the garden. There are exits to the east and south.", 
        exits: {
            east: 'kitchen', 
            south: 'garden'
        }
    }, 
    'kitchen' : {
        name: 'Kitchen', 
        description: "You are in the kitchen. There are exits to the west, east and south.", 
        exits: {
            east: 'games_room', 
            west: 'garden',
            south: 'courtyard'
        }
    }, 
    'games_room' : {
        name: 'Games Room', 
        description: "You are in the games room. There are exits to the west and south.", 
        exits: {
            west: 'kitchen', 
            south: 'dining_room'
        }
    }, 
    'dining_room' : {
        name: 'Dining Room', 
        description: "You are in the dining room. There are exits to the north, west and south.", 
        exits: {
            north: 'games_room',
            west: 'courtyard', 
            south: 'living_room'
        }
    }, 
    'living_room' : {
        name: 'Living Room', 
        description: "You are in the living room. There are exits to the north and west.", 
        exits: {
            north: 'dining_room',
            west: 'bedroom'
        }
    }, 
    'bedroom' : {
        name: 'Bedroom', 
        description: "You are in the bedroom. There are exits to the north, west and east.", 
        exits: {
            north: 'courtyard',
            west: 'bathroom', 
            east: 'living_room'
        }
    }, 
    'garden' : {
        name: 'Garden', 
        description: "You are in the garden. There are exits to the north, east and south.", 
        exits: {
            north: 'garage',
            east: 'courtyard', 
            south: 'bathroom'
        }
    }, 
    'bathroom' : {
        name: 'Bathroom', 
        description: "You are in the bathroom. There are exits to the north, east.", 
        exits: {
            north: 'garden',
            east: 'bedroom'
        }
    },
    'courtyard' : {
        name: 'Courtyard', 
        description: "You are in the courtyard. There are exits to the north, east, west and south.", 
        exits: {
            north: 'kitchen',
            west: 'garden', 
            south: 'bedroom', 
            east: 'dining_room'
        }
    }
};

let currentRoom = rooms['courtyard'];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Displays current room
function displayRoomInfo(){
    const message = [
        currentRoom.description, `Exits: ${Object.keys(currentRoom.exits).join(', ')}`
    ].join('\n');

    return message;
}

// Game Loop 
async function gameLoop(){
    // Initialise WebSockate sever
    app.ws('/index', (ws, req) => {
        ws.on('message', async (userInput) => {
            const command = userInput.trim().toLowerCase();
            await handleInput(command, ws);
        });

        // Initialise welcome message 
        ws.send('Welcome to the Text Adventure Game!');
        ws.send('Type your commands to navigate.');
        ws.send(' ');
        ws.send('type "help" for a list of commands');
        ws.send('Type "quit" to exit the game');
        ws.send(' --------------------------- ');
        ws.send(' ');
        ws.send(displayRoomInfo());
    });

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

    app.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });
}

// Handle user input
async function handleInput(input, ws){
    const command = input.split(' ')[0];

    // Executes command 
    switch (command){
        case 'go':
            const direction = input.split(' ')[1];
            if (currentRoom.exits[direction]){
                currentRoom = rooms[currentRoom.exits[direction]];
                ws.send(' ');
                ws.send(displayRoomInfo());
                ws.send(' ');
            }else {
                ws.send(' ');
                ws.send('You cant go that way.');
                ws.send(' ');
            }
            break;
        case 'description':
            ws.send(' ');
            ws.send(displayRoomInfo());
            ws.send(' ');
            break;
        case 'quit':
            ws.send(' ');
            ws.send('Goodbye');
            ws.close();
            break;
        case 'help':
            ws.send(' ');
            ws.send('List of available commands: ');
            ws.send('"go ___" : add direction to go to move to a room.');
            ws.send('"description" : gives current description of room.');
            ws.send('"quit" : exits the game.');
            break;
        default:
            ws.send(' ');
            ws.send('Invalid command');
            ws.send(' ');
        }
}

gameLoop();