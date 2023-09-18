const express = require('express');
const readline = require('readline');
const expressWs = require('express-ws');

const app = express();
const port = process.env.PORT || 8080;
const wsInstance = expressWs(app);

// class for room 
class Room {
    constructor(name, description, exits) {
        this.name = name;
        this.description = description;
        this.exits = exits;
        this.puzzle = null;
    }
}

// class for player  
class Player {
    constructor() {
        this.currentRoom = null;
    }

    // moves player to a room
    moveToRoom(room) {
        this.currentRoom = room;
    }

    // returns the room description of the current room
    getRoomInfo() {
        return `${this.currentRoom.description}\nExits: ${Object.keys(this.currentRoom.exits).join(', ')}`;
    }
}

// super class for puzzle
class Puzzle {
    constructor(instructions, answer) {
        this.answer = answer;
        this.instructions = instructions;
        this.solved = false;
    }

    getInstructions() {
        return this.instructions;
    }

    isSolved(playerAnswer) {
        if (!this.solved) {
            if (playerAnswer.toLowerCase() == this.answer.toLowerCase()) {
                this.solved = true;
                return true;
            }
        }
        return false;
    }
}

// class for anagram puzzle
class AnagramPuzzle extends Puzzle {
    constructor() {
        // selects a random word from list
        const words = ['detective', 'investigate', 'criminal', 'sherlock', 'sleuth', 'informant', 'questioner', 'murderer', 'deceive', 'inquiry', 'eyewitness', 'assassin', 'suspects', 'victim', 'reporter', 'homicide', 'officer', 'inspector', 'mystery'];
        const randomIndex = Math.floor(Math.random() * words.length);
        const randomWord = words[randomIndex];

        // shuffles random word
        const shuffled = randomWord.split('');
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const shuffledWord = shuffled.join('');

        // console.log(shuffledWord);
        // console.log(randomWord);

        super(`Unscramble these letters to form a word: ${shuffledWord}`, randomWord);
        this.isSolving = false;
    }
}

// class for game
class Game {
    constructor() {
        // list of rooms in the game
        this.rooms = {
            'garage': new Room('Garage', 'You are in the garage. There are exits to the east and south.', { east: 'kitchen', south: 'garden' }),
            'kitchen': new Room('Kitchen', 'You are in the kitchen. There are exits to the west, east and south.', { east: 'games_room', west: 'garden', south: 'courtyard' }),
            'games_room': new Room('Games Room', 'You are in the games room. There are exits to the west and south.', { west: 'kitchen', south: 'dining_room' }),
            'dining_room': new Room('Dining Room', 'You are in the dining room. There are exits to the north, west and south.', { north: 'games_room', west: 'courtyard', south: 'living_room' }),
            'living_room': new Room('Living Room', 'You are in the living room. There are exits to the north and west.', { north: 'dining_room', west: 'bedroom' }),
            'bedroom': new Room('Bedroom', 'You are in the bedroom. There are exits to the north, west and east.', { north: 'courtyard', west: 'bathroom', east: 'living_room' }),
            'garden': new Room('Garden', 'You are in the garden. There are exits to the north, east and south.', { north: 'garage', east: 'courtyard', south: 'bathroom' }),
            'bathroom': new Room('Bathroom', 'You are in the bathroom. There are exits to the north, east.', { north: 'garden', east: 'bedroom' }),
            'courtyard': new Room('Courtyard', 'You are in the courtyard. There are exits to the north, east, west and south.', { north: 'kitchen', west: 'garden', south: 'bedroom', east: 'dining_room' })
        }

        // creates player and starting room
        this.player = new Player();
        this.player.moveToRoom(this.rooms['courtyard']);

        // list of rooms
        const listOfRooms = Object.keys(this.rooms);
        listOfRooms.sort(() => Math.random() - 0.5);

        // list of available puzzles
        const puzzles = [new AnagramPuzzle()];
        puzzles.sort(() => Math.random() - 0.5);

        // assigns puzzle to room
        for (let i = 0; i < puzzles.length && i < listOfRooms.length; i++) {
            this.rooms[listOfRooms[i]].puzzle = puzzles[i];
            console.log(listOfRooms[i]);
        }

        this.setUp();
    }

    setUp() {
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

    async handleInput(input, ws) {
        const command = input.split(' ')[0];

        if (this.player.currentRoom.puzzle && this.player.currentRoom.puzzle.isSolving) {
            if (this.player.currentRoom.puzzle.isSolved(command)) {
                ws.send(' ');
                ws.send('Correct... the device reveals....');
                ws.send(' ');
            } else {
                ws.send(' ');
                ws.send('Incorrect... the device breaks in your hand');
                ws.send(' ');
            }

            this.player.currentRoom.puzzle.isSolving = false;
            //ws.send(this.player.getRoomInfo());

        } else {
            // execute command
            switch (command) {
                case 'go':
                    const direction = input.split(' ')[1];
                    if (this.player.currentRoom.exits[direction]) {
                        this.player.moveToRoom(this.rooms[this.player.currentRoom.exits[direction]]);
                        ws.send(' ');
                        ws.send(this.player.getRoomInfo());
                        ws.send(' ');
                    } else {
                        ws.send(' ');
                        ws.send('You can\'t go thay way');
                        ws.send(' ');
                    }
                    break;
                case 'description':
                    ws.send(' ');
                    ws.send(this.player.getRoomInfo());
                    ws.send(' ');
                    break;
                case 'search':
                    if (this.player.currentRoom.puzzle) {
                        ws.send(' ');
                        ws.send('There seems to be something here to solve');
                        ws.send(' ');
                    } else {
                        ws.send(' ');
                        ws.send('You found nothing');
                        ws.send(' ');
                    }
                    break;
                case 'solve':
                    if (this.player.currentRoom.puzzle) {
                        ws.send(' ');
                        ws.send('You find a strange device and start investigating it...');
                        ws.send(this.player.currentRoom.puzzle.getInstructions());
                        this.player.currentRoom.puzzle.isSolving = true;
                        ws.send('Please enter your answer:');
                    } else {
                        ws.send(' ');
                        ws.send('There is nothing in this room for you to solve');
                        ws.send(' ');
                    }
                    break;
                case 'help':
                    ws.send(' ');
                    ws.send('List of available commands: ');
                    ws.send('"go x : add direction to command to move to a room');
                    ws.send('"description" : gives current room description');
                    ws.send('"search" : searches the current room you are in')
                    ws.send('"solve" : solves the puzzle in the current room')
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
}

const game = new Game();