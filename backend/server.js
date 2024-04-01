const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const port = 8080;
const wss = new WebSocket.Server({ port: port });

const players = []
const players_has_ws = {}
const partidas = []

console.log(`servidor rodando na porta ${port}`);

wss.on('connection', function connection(ws) {
    associacaoDeJogadores(ws);

    ws.on('close', function closeConnection() {
        let playerId = getKeyByValue(players_has_ws, ws);
        console.log('cliente desconectado: ', playerId)

        let partida = obterPartidaPorPlayerId(playerId);

        if (playerId === partida.player1.id) {
            partida.player1 = null;
        } else if (playerId === partida.player2.id) {
            partida.player2 = null;
        }
    });
});

function associacaoDeJogadores(ws) {
    let player = adicionarJogador();
    
    players_has_ws[player.id] = ws;

    let partida = obterPartidasEmEspera();

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

    console.log('Novo cliente foi conectado: ', player.id);
    return player;
}

function startGame(partida) {
    console.log('partida iniciada: ', partida.id);
    
    partida.espera = false;

    let indexDaPartida = partidas.findIndex(({ id }) => id != partida.id);
    partidas[indexDaPartida] = partida

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

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function createPartida() {
    let tabuleiro = generateTable();

    let partida = {
        id: uuidv4(),
        player1: null,
        player2: null,
        espera: true,
        tabuleiro_player1: tabuleiro,
        tabuleiro_player2: tabuleiro
    }

    console.log('Partida criada: ', partida.id)
    
    return partida;
}

function obterPartidasEmEspera() {
    let partidaEmEspera = partidas.find(({ espera }) => espera === true);
    
    if (!partidaEmEspera) {
        partidaEmEspera = createPartida();
        partidas.push(partidaEmEspera);
    }
    
    return partidaEmEspera;
}


function obterPartidaPorPlayerId(playerId) {
    let partida = partidas.find(({ player1, player2 }) => player1.id === playerId || player2.id === playerId);
    return partida;
}