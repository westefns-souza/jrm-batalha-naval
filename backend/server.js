const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const port = 8080;
const wss = new WebSocket.Server({ port: port });

const players = []
const players_has_ws = {}

let partida = {
    player1: null,
    player2: null,
    espera: true,
    mensagem: "",
    tabuleiro_player1: [],
    tabuleiro_player2: []
}

console.log(`servidor rodando na porta ${port}`);

wss.on('connection', function connection(ws) {
    console.log('Novo cliente foi conectado');

    associacaoDeJogadores(ws);

    ws.on('close', function close() {
        if (ws === partida.player1) {
            partida.player1 = null;
        } else if (ws === partida.player2) {
            partida.player2 = null;
        }
    });
});

function associacaoDeJogadores(ws) {
    let player = adicionarJogador();
    
    players_has_ws[player.id] = ws;

    if (partida.player1 === null) {
        partida.player1 = player;
        players_has_ws[player.id].send(JSON.stringify({
            tipo: 'AGUARDANDOJOGADOR',
            corpo: {
                player: partida.player1,
                mensagem: 'Aguardando pelo segundo jogador...'
            }
        }));
    } else {
        partida.player2 = player;

        startGame(partida);
    }
}

function adicionarJogador() {
    let player = {
        id: uuidv4(),
    }

    players.push(player)

    return player;
}

function startGame(partida) {
    let initialTable = generateTable();
    partida.tabuleiro_player1 = initialTable;
    partida.tabuleiro_player2 = initialTable;

    players_has_ws[partida.player1.id].send(JSON.stringify({
        tipo: 'PREENCHERTABULEIRO',
        corpo: {
            player: partida.player1,
            mensagem: 'Preencha seu tabuleiro',
            tabuleiro: partida.tabuleiro_player1
        }
    }))

    players_has_ws[partida.player2.id].send(JSON.stringify({
        tipo: 'PREENCHERTABULEIRO',
        corpo: {
            player: partida.player2,
            mensagem: 'Preencha seu tabuleiro',
            tabuleiro: partida.tabuleiro_player2
        }
    }))
}

function generateTable() {
    let letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    let tabela = [];
    let matriz = [];

    for (let i = 1; i <= 10; i++) {
        for (let j = 0; j < 10; j++) {
            tabela.push({ 
                coordenada: letras[j] + i.toString(),
                barco: false,
            });
        }

        matriz.push(tabela);
        tabela = [];
    }

    return matriz;
}