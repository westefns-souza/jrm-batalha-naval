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
        
        desconectarJogador(playerId);
    });

    ws.on('message', function incoming(message) {
        let conteudo = JSON.parse(message);
        console.log(conteudo.corpo.mensagem);

        if (conteudo.tipo === "SELECIONANDOLOCALTABULEIRO") {
            updateTable(conteudo.corpo.player.id, conteudo.corpo.tabuleiro)
        } else if (conteudo.tipo === "PRONTOPARAJOGAR") {
            readyToStart(conteudo.corpo.player.id);
        }
    });
});

function associacaoDeJogadores(ws) {
    let player = adicionarJogador();
    
    players_has_ws[player.id] = ws;

    let partida = obterPartidasEmEspera();

    if (partida.player1 === null) {
        partida.player1 = player;
        console.log(`Jogador 1 (${player.id}) foi associado na partida: ${partida.id}`);
        sendMensagemWait(player);
    } else {
        partida.player2 = player;
        console.log(`Jogador 2 (${player.id}) foi associado na partida: ${partida.id}`);

        startGame(partida);
    }
}

function adicionarJogador() {
    let player = {
        id: uuidv4(),
    }

    players.push(player)

    console.log('Novo jogador foi conectado: ', player.id);
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
        player1_ready: false,
        player2: null,
        player2_ready: false,
        espera: true,
        iniciada: false,
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

function desconectarJogador(playerId) {
    let partida = obterPartidaPorPlayerId(playerId);
    delete players_has_ws[playerId];

    if (playerId === partida.player1.id) {
        partida.player1 = null;
        console.log(`Jogador 1 (${playerId}) foi desconectado da partida: ${partida.id}`,)
        
        if (partida.player2 != null) {
            partida.player1 = partida.player2;
            partida.tabuleiro_player1 = partida.tabuleiro_player2;
            partida.player2 = null;
            partida.tabuleiro_player2 = generateTable();
            
            console.log(`Jogador 2 (${playerId}) se tornou o Jogador 1 na partida: ${partida.id}`);
            waitPlayer(partida);
            sendMensagemWait(partida.player1);
        }
    } else if (playerId === partida.player2.id) {
        partida.player2 = null;
        partida.tabuleiro_player2 = generateTable();
        console.log(`Jogador 2 (${playerId}) foi desconectado da partida: ${partida.id}`,)
        waitPlayer(partida);
        sendMensagemWait(partida.player1);
    }
}

function sendMensagemWait(player) {
    players_has_ws[player.id].send(JSON.stringify({
        tipo: 'AGUARDANDOJOGADOR',
        corpo: {
            player: player,
            mensagem: 'Aguardando pelo segundo jogador...'
        }
    }));
}

function waitPlayer(partida) {
    console.log('Partida voltou para espera: ', partida.id);
    
    partida.espera = true;

    let indexDaPartida = partidas.findIndex(({ id }) => id != partida.id);
    partidas[indexDaPartida] = partida;
}

function updateTable(playerId, table) {    
    let partida = obterPartidaPorPlayerId(playerId);

    let indexDaPartida = partidas.findIndex(({ id }) => id != partida.id);
    
    if (partida.player1.id === playerId) {
        partida.tabuleiro_player1 = table;
    } else {
        partida.tabuleiro_player2 = table;
    }

    partidas[indexDaPartida] = partida;
}

function readyToStart(playerId) {
    let partida = obterPartidaPorPlayerId(playerId);

    let indexDaPartida = partidas.findIndex(({ id }) => id != partida.id);
    
    if (partida.player1.id === playerId) {
        partida.player1_ready = true;
    } else {
        partida.player2_ready = true;
    }

    partidas[indexDaPartida] = partida;

    if (partida.player1_ready && partida.player2_ready) {
        startFase2Gagem(partida);
    }
}

function startFase2Gagem(partida) {
    console.log('partida iniciada: ', partida.id);
    
    partida.iniciada = true;

    let indexDaPartida = partidas.findIndex(({ id }) => id != partida.id);
    partidas[indexDaPartida] = partida

    players_has_ws[partida.player1.id].send(JSON.stringify({
        tipo: 'INICIARPARTIDA',
        corpo: {
            player: partida.player1,
            mensagem: 'Partida iniciada',
            tabuleiro: partida.tabuleiro_player1,
            tabuleiro_inimigo: partida.tabuleiro_player2,
        }
    }));

    players_has_ws[partida.player2.id].send(JSON.stringify({
        tipo: 'INICIARPARTIDA',
        corpo: {
            player: partida.player2,
            mensagem: 'Partida iniciada',
            tabuleiro: partida.tabuleiro_player2,
            tabuleiro_inimigo: partida.tabuleiro_player1,
        }
    }));
}