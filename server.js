const WebSocket = require('ws');

const port = 8080;
const wss = new WebSocket.Server({ port: port });

let conectados = 0;
let partidas = [];
let jogadores = [];

wss.on('connection', function connection(ws) {
    conectados++;
    console.log('Um cliente se conectou, agora são: ', conectados);

    ws.on('message', function incoming(message) {
        console.log('Mensagem recebida:', message.toString());
    });

    ws.on('close', function close() {
        conectados--;
        console.log('Um cliente se desconectou, agora são: ', conectados);
    });

    ws.send('Bem vindo cliente');
    
    if (conectados % 2 != 0) {
        ws.send('Você é o jogador N° 1');
        ws.send('Aguarde o jogador N° 2');
    } else {
        ws.send('Você é o jogador N° 2');
        ws.send('partida iniciada!');
    }
});

console.log(`servidor rodando na porta ${port}`);