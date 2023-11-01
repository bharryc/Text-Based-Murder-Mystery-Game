const express = require('express');
const readline = require('readline');
const expressWs = require('express-ws');
const fs = require('fs');

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
        this.characters = [];
    }

    addChar(char) {
        if (this.characters.length < 2) {
            this.characters.push(char);
            char.currentRoom = this;
        }

        //DONT FORGET TO REMOVE PLS
        // console.log(`Char: ${char.name} has been added to ${this.name}`);
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
        return `${this.currentRoom.description}\nExits: ${Object.keys(this.currentRoom.exits).join(', ')} \nCharacters nearby: ${this.currentRoom.characters.map(char => char.name).join(',')}`;
    }
}
// class for character 
class Character {
    constructor(name, isMurderer, isVictim, characterData) {
        this.name = name;
        this.isMurderer = isMurderer;
        this.isVictim = isVictim;
        this.characterData = characterData;
        this.currentRoom = null;

        // tracks how many times char has been questioned.
        this.questionedNumber = 0;

        // responses for char.
        this.response1 = "";
        this.response2 = "";
        this.clue1 = "";
        this.clue2 = "";
        this.reason = "";
    }

    // assigns the responses based on if the charcater is a murderer or not and who has died, reads from the json file.
    assignResponses(victim, murderer) {

        this.gameEndWin = this.characterData["gameEndWin"];
        this.gameEndLoss = this.characterData["gameEndLoss"];

        if (!this.isVictim) {
            if (this.isMurderer) {
                this.reason = this.characterData[victim]['reason'];
                this.response1 = this.characterData[victim]['guiltyResponse1'];
                this.response2 = this.characterData[victim]['guiltyResponse2'];
                this.clue1 = this.characterData[victim]['clue1'];
                this.clue2 = this.characterData[victim]['clue2'];
            } else {
                this.response1 = this.characterData[victim]['innocentResponse1'];
                this.response2 = this.characterData[victim]['innocentResponse2'];
            }
        }

        //DON'T FOREGT TO REMOVE PLS :)
        // console.log(" ");
        // console.log(this.name);
        // console.log(murderer);
        // console.log(victim);
        // console.log(this.response1);
        // console.log(this.response2);
        // console.log(this.clue1);
        // console.log(this.clue2);

    }
}

// super class for puzzle
class Puzzle {
    constructor(instructions, answer) {
        this.answer = answer;
        this.instructions = instructions;
        this.solved = false;
        this.isSolving = false;
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

        // debugging stuff 
        // console.log(`shuffled word ${shuffledWord}`);
        console.log(`original word ${randomWord}`);
        // DONT FORGET TO REMOVE PLS.

        super(`Unscramble these letters to form a word: ${shuffledWord}`, randomWord);
    }
}

// class for maths puzzle 
class MathPuzzle extends Puzzle {
    constructor() {
        let question, answer, op;
        const num1 = Math.floor(Math.random() * 50) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const operations = ['+', '=', '*', '/'];
        op = operations[Math.floor(Math.random() * operations.length)];

        do {
            switch (op) {
                case '+':
                    question = `${num1} + ${num2}`;
                    answer = num1 + num2;
                    break;
                case '-':
                    question = `${num1} - ${num2}`;
                    answer = num1 - num2;
                    break;
                case '*':
                    question = `${num1} * ${num2}`;
                    answer = num1 * num2;
                    break;
                case '/':
                    if (num1 % num2 == 0) {
                        question = `${num1} / ${num2}`;
                        answer = num1 / num2;
                    }
                    break;
            }
        } while (answer == undefined);

        console.log(`maths answer ${answer}`);

        super(`Solve this problem:  ${question}`, answer.toString());
    }
}

// class for caesar cipher puzzle
class CaesarCipherPuzzle extends Puzzle {
    constructor() {
        const texts = ["detective", "secret", "clue", "evidence", "the garden outside is overgrown hiding secrets", "the dining room is set for a meal that never happened",
            "the suspects are gathering in the living room", "a broken pool cue is resting on the table in the games room"];

        const randomIndex = Math.floor(Math.random() * texts.length);
        const text = texts[randomIndex];

        const shift = Math.floor(Math.random() * 25) + 1;

        let encrypted = '';

        // apply cipher. 
        // random chance that letter gets encrypted
        // if not encrypted then makes it capital letter
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ') {
                encrypted += ' ';
            } else {
                const chanceToEncrypt = Math.random() < 0.75;
                if (chanceToEncrypt) {
                    const charCode = char.charCodeAt(0);
                    const shiftedCharCode = ((charCode - 97 + shift) % 26) + 97;

                    encrypted += String.fromCharCode(shiftedCharCode);
                } else {
                    encrypted += char.toUpperCase();
                }
            }
        }

        super(`Decrypt this Caesar Cipher text (random shift from 1-25 applied. Uppercase letters are unencrypted): ${encrypted}`, text);

        //debuging stuff - DONT FORGET TO REMOVE LATER 
        console.log(`original text ${text}`);
        // console.log(`encrypted text ${encrypted}`);
        // console.log(`cipher shift ${shift}`);
    }
}

// class for game
class Game {
    constructor() {

        this.characterList = null;
        // list of rooms in the game
        this.rooms = {
            'garage': new Room('Garage', 'You are in the garage. There are exits to the east and south.', { east: 'kitchen', south: 'garden' }),
            'kitchen': new Room('Kitchen', 'You are in the kitchen. There are exits to the west, east and south.', { east: 'games_room', west: 'garage', south: 'courtyard' }),
            'games_room': new Room('Games Room', 'You are in the games room. There are exits to the west and south.', { west: 'kitchen', south: 'dining_room' }),
            'dining_room': new Room('Dining Room', 'You are in the dining room. There are exits to the north, west and south.', { north: 'games_room', west: 'courtyard', south: 'living_room' }),
            'living_room': new Room('Living Room', 'You are in the living room. There are exits to the north and west.', { north: 'dining_room', west: 'bedroom' }),
            'bedroom': new Room('Bedroom', 'You are in the bedroom. There are exits to the north, west and east.', { north: 'courtyard', west: 'bathroom', east: 'living_room' }),
            'garden': new Room('Garden', 'You are in the garden. There are exits to the north, east and south.', { north: 'garage', east: 'courtyard', south: 'bathroom' }),
            'bathroom': new Room('Bathroom', 'You are in the bathroom. There are exits to the north, east.', { north: 'garden', east: 'bedroom' }),
            'courtyard': new Room('Courtyard', 'You are in the courtyard. There are exits to the north, east, west and south.', { north: 'kitchen', west: 'garden', south: 'bedroom', east: 'dining_room' })
        }

        // creates characters, randomly picks murder and victim
        const charactersData = loadCharData();
        let jay, matt, saint, steven, jamal, julian, emma, aria;
        const listOfChars = [
            jay = new Character('Jay', false, false, charactersData['jay']),
            matt = new Character('Matt', false, false, charactersData['matt']),
            saint = new Character('Saint', false, false, charactersData['saint']),
            steven = new Character('Steven', false, false, charactersData['steven']),
            jamal = new Character('Jamal', false, false, charactersData['jamal']),
            julian = new Character('Julian', false, false, charactersData['julian']),
            emma = new Character('Emma', false, false, charactersData['emma']),
            aria = new Character('Aria', false, false, charactersData['aria'])
        ];

        this.characterList = listOfChars;
        this.murderer = null;
        this.clues = null;

        // console.log(listOfChars)

        this.addCharToRoom(listOfChars)

        // randomly selects murderer and victim 
        const randomVictimIndex = Math.floor(Math.random() * listOfChars.length);
        let randomMurdererIndex;
        do {
            randomMurdererIndex = Math.floor(Math.random() * listOfChars.length);
        } while (randomVictimIndex == randomMurdererIndex);

        const victim = listOfChars[randomVictimIndex];
        const murderer = listOfChars[randomMurdererIndex];

        victim.isVictim = true;
        murderer.isMurderer = true;

        this.murderer = murderer;
        this.victim = victim;

        console.log(`Victim is: ${victim.name}`);
        console.log(`Murderer is: ${murderer.name}`);

        // calls the method to assign the responses
        jay.assignResponses(victim.name.toLowerCase(), murderer.name.toLowerCase());
        matt.assignResponses(victim.name.toLowerCase(), murderer.name.toLowerCase());
        saint.assignResponses(victim.name.toLowerCase(), murderer.name.toLowerCase());
        steven.assignResponses(victim.name.toLowerCase(), murderer.name.toLowerCase());
        jamal.assignResponses(victim.name.toLowerCase(), murderer.name.toLowerCase());
        julian.assignResponses(victim.name.toLowerCase(), murderer.name.toLowerCase());
        emma.assignResponses(victim.name.toLowerCase(), murderer.name.toLowerCase());
        aria.assignResponses(victim.name.toLowerCase(), murderer.name.toLowerCase());


        // randomly select murder weapon
        const listOfWeapons = ['kitchen knife', 'candlestick', 'poisoned drink', 'poisoned food', 'crowbar', 'rope', 'letter opener', ' trophy', 'fire poker', 'pool cue',
            'broken bottle'];
        const murderWeapon = listOfWeapons[Math.floor(Math.random() * listOfWeapons.length)];
        let weaponStr = "";
        if (murderWeapon == 'poisoned drink' || 'poisoned food'){
           weaponStr = `Looking around the area you find a poison bottle that has been used to kill ${victim.name}`;
        }else {
            weaponStr = `Looking around the area you find a bloody ${murderWeapon} that was used to kill ${victim.name}`;
        }

        // list of available clues 
        const clues = [murderer.clue1, murderer.clue2, weaponStr];
        this.clues = clues;
        // console.log(clues);

        // creates player and starting room
        this.player = new Player();
        this.player.moveToRoom(this.rooms['courtyard']);

        // list of rooms
        const listOfRooms = Object.keys(this.rooms);
        listOfRooms.sort(() => Math.random() - 0.5);

        // list of available puzzles
        const puzzles = [new AnagramPuzzle(), new MathPuzzle(), new CaesarCipherPuzzle()];
        puzzles.sort(() => Math.random() - 0.5);

        // assigns puzzle to room
        for (let i = 0; i < puzzles.length && i < listOfRooms.length; i++) {
            this.rooms[listOfRooms[i]].puzzle = puzzles[i];

            //debugging
            console.log(listOfRooms[i]);
        }

        this.setUp();
    }


    // function to add a character to a room randomly.
    addCharToRoom(listOfChars) {
        const roomsList = Object.values(this.rooms);
        roomsList.sort(() => Math.random() - 0.5);
        for (let i = 0; i < listOfChars.length; i++) {
            const room = roomsList[i % roomsList.length];
            room.addChar(listOfChars[i]);
        }
    }


    setUp() {

        const suspects = this.characterList.filter(character => !character.isVictim).map(character => character.name);
        const firstSuspects = suspects.slice(0, -1).join(', ');
        const finalSuspect = suspects[suspects.length -1];

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
            ws.send('You are detective that has been called to a large estate in the British countryside.');
            ws.send(`Upon arrival you have found ${this.victim.name} dead in the ${this.victim.currentRoom.name}`);
            ws.send('You have narrowed down your suspects down to these people: ');
            ws.send(`${firstSuspects} and ${finalSuspect}`);
            ws.send(`Your job is to uncover the truth and figure out what happened to ${this.victim.name}`);
            ws.send(' ');
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

        let gameEnded = false;
        
        if(this.gameEnded){
            return;
        }

        ws.send(" ");
        ws.send(input);
        ws.send(" ");

        // needed as game parses player input as command 
        // checks to see if player is currently solving a puzzle  
        if (this.player.currentRoom.puzzle && this.player.currentRoom.puzzle.isSolving) {
            const playerAnswer = input;
            if (this.player.currentRoom.puzzle.isSolved(playerAnswer)) {
                ws.send(' ');
                if (this.clues.length > 0){
                    const clue = this.clues.pop();
                    ws.send(clue);
                }
                ws.send(' ');
            } else {
                ws.send(' ');
                ws.send('Incorrect... the device breaks in your hand');
                ws.send(' ');
            }

            this.player.currentRoom.puzzle.isSolving = false;
            //ws.send(this.player.getRoomInfo());

        } else {
            const command = input.split(' ')[0];
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
                case 'question':
                    const characterName = input.split(' ')[1];
                    if (characterName) {
                        ws.send(' ');
                        const character = this.player.currentRoom.characters.find(char => char.name.toLowerCase() === characterName.toLowerCase());
                        if (character) {
                            if (character.isVictim) {
                                ws.send('Dead people cant speak.')
                            } else {
                                if (character.questionedNumber < 2) {
                                    ws.send(`You ask ${character.name} a question.`);
                                    ws.send(' ');
                                    if (character.questionedNumber == 0) {
                                        ws.send(character.response1)
                                    } else {
                                        ws.send(character.response2);
                                    }
                                    ws.send(' ');
                                    character.questionedNumber++;
                                } else {
                                    ws.send('I have nothing else to say.');
                                    ws.send(' ');
                                }
                            }
                        } else {
                            ws.send('No character with that name is in the room.')
                        }
                    } else {
                        ws.send('You forgot to say who you are questioning.')
                    }
                    break;
                case 'accuse':
                    const char = input.split(' ')[1];
                    if (char){
                        ws.send(' ');
                        const character = this.characterList.find(c => c.name.toLowerCase() === char.toLowerCase());
                        if (character){
                            if (character.isMurderer){
                                ws.send(this.murderer.gameEndWin);
                                this.gameEnded = true;
                            }else{
                                ws.send(this.murderer.gameEndLoss);
                                this.gameEnded = true;
                            }
                        }else {
                            ws.send('No character with that name is at the party.')
                        }
                    }else {
                        ws.send('You forgot to say who you are accusing.')
                    }
                    break;
                case 'help':
                    ws.send(' ');
                    ws.send('List of available commands: ');
                    ws.send('"go <diretion> : move to a room');
                    ws.send('"description" : gives current room description');
                    ws.send('"map" : displays map');
                    ws.send('"search" : searches the current room you are in')
                    ws.send('"solve" : solves the puzzle in the current room')
                    ws.send('"question <character name> : questions character in room')
                    ws.send('"quit" : exits game');
                    ws.send(' ');
                    break;
                case 'map':
                    ws.send(' ');
                    ws.send('*-------------*-------------*-------------*');
                    ws.send('|             |             |             |');
                    ws.send('|    garage   |   kitchen   |  games room |');
                    ws.send('|             |             |             |');
                    ws.send('*-------------*-------------*-------------*');
                    ws.send('|             |             |             |');
                    ws.send('|    garden   |  courtyard  | dining room |');
                    ws.send('|             |             |             |');
                    ws.send('*-------------*-------------*-------------*');
                    ws.send('|             |             |             |');
                    ws.send('|   bathroom  |   bedroom   | living room |');
                    ws.send('|             |             |             |');
                    ws.send('*-------------*-------------*-------------*');
                    ws.send(` You are in the ${this.player.currentRoom.name}`);
                    ws.send(' ');
                    break;
                case 'quit':
                    ws.send(' ');
                    ws.send('Goodbye');
                    ws.send(' ');
                    this.gameEnded = true;
                default:
                    ws.send(' ');
                    ws.send('Invalid command');
                    ws.send(' ');
            }
        }
    }
}

// reads the json file to be used in the game.
function loadCharData() {
    try {
        const data = fs.readFileSync('characterData.json', 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error loading character data: ${err}`);
        return {};
    }
}

const game = new Game();