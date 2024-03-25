const WebSocket = require('ws');

const port = 8080;
const wss = new WebSocket.Server({ port: port });

let partida = {
    player1: null,
    player2: null,
    shared: {
        espera: true,
        mensagem: "",
        tabuleiro_player1: [],
        tabuleiro_player2: []
    }
}

wss.on('connection', function connection(ws) {
    console.log('Novo cliente conectado');

    if (partida.player1 === null) {
        partida.player1 = ws;
        ws.send('Aguardando pelo segundo jogador...');
    } else {
        partida.player2 = ws;
        ws.send('Partida começará. Prepare-se!');

        startGame(partida);
    }

    ws.on('close', function () {
        if (ws === partida.player1) {
            partida.player1 = null;
        } else if (ws === partida.player2) {
            partida.player2 = null;
        }
    });
});

function startGame(partida) {
    partida.player1.send('A partida começou');
    partida.player2.send('A partida começou');
}

console.log(`servidor rodando na porta ${port}`);