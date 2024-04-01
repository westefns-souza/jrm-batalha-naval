const ws = new WebSocket('ws://localhost:8080');

let tabuleiro = []
let tabuleiro_inimigo = []
let player = null;

ws.onopen = function (event) {
    console.log('Conexão estabelecida');
};

ws.onmessage = function (event) {
    let conteudo = JSON.parse(event.data)

    if (conteudo) {
        console.log(conteudo);
        
        if (conteudo.tipo === "AGUARDANDOJOGADOR") {
            document.getElementById("espera").classList.remove("display-none");
            document.getElementById("preencher-tabuleiro").classList.add("display-none");
            document.getElementById("segunda-fase").classList.add("display-none");
        } else if (conteudo.tipo === "PREENCHERTABULEIRO") {
            document.getElementById("espera").classList.add("display-none");
            document.getElementById("preencher-tabuleiro").classList.remove("display-none");
            document.getElementById("segunda-fase").classList.add("display-none");

            player = conteudo.corpo.player;
            tabuleiro = conteudo.corpo.tabuleiro;
            
            exibirMeuTabuleiro();
        } else if (conteudo.tipo === "ESPEREPRONTODOOUTROJOGADOR") {
            document.getElementById("btn-pronto").classList.add("display-none");
            document.getElementById("msg-pronto").classList.remove("display-none");
        } else if (conteudo.tipo === "INICIARPARTIDA") {
            document.getElementById("espera").classList.add("display-none");
            document.getElementById("preencher-tabuleiro").classList.add("display-none");
            document.getElementById("msg-pronto").classList.add("display-none");
            document.getElementById("segunda-fase").classList.remove("display-none");
            
            player = conteudo.corpo.player;
            tabuleiro = conteudo.corpo.tabuleiro;
            tabuleiro_inimigo = conteudo.corpo.tabuleiro_inimigo;

            exibirTabuleiros();
        }
    }
};

ws.onerror = function (event) {
    console.error('Erro de WebSocket detectado:', event);
};

function exibirMeuTabuleiro() {
    let meu_tabuleiro = document.getElementById("meu-tabuleiro");

    meu_tabuleiro.innerHTML = null;

    tabuleiro.forEach(linha => {
        let nova_linha = '<tr>';

        linha.forEach(coluna => {
            if (coluna.barco) {
                nova_linha = nova_linha + `<td class="selecionado" onclick="deselecionar('${coluna.coordenada}')">${coluna.coordenada}</td>`;
            } else {
                nova_linha = nova_linha + `<td onclick="selecionar('${coluna.coordenada}')">${coluna.coordenada}</td>`;
            }
        });

        nova_linha = nova_linha + '</tr>';

        meu_tabuleiro.innerHTML = meu_tabuleiro.innerHTML + nova_linha;
    });
}

function exibirTabuleiros() {
    let meu_tabuleiro = document.getElementById("meu-tabuleiro-segunda-fase");
    let tabuleiro_oponente = document.getElementById("tabuleiro-oponente-segunda-fase");

    meu_tabuleiro.innerHTML = null;
    tabuleiro_oponente.innerHTML = null;

    tabuleiro.forEach(linha => {
        let nova_linha_meu = '<tr>';

        linha.forEach(coluna => {
            if (coluna.barco) {
                nova_linha_meu = nova_linha_meu + `<td class="selecionado" onclick="deselecionar('${coluna.coordenada}')">${coluna.coordenada}</td>`;
            } else {
                nova_linha_meu = nova_linha_meu + `<td onclick="selecionar('${coluna.coordenada}')">${coluna.coordenada}</td>`;
            }
        });

        nova_linha_meu = nova_linha_meu + '</tr>';

        meu_tabuleiro.innerHTML = meu_tabuleiro.innerHTML + nova_linha_meu;
    });

    tabuleiro_inimigo.forEach(linha => {
        let nova_linha = '<tr>';

        linha.forEach(coluna => {
            nova_linha = nova_linha + `<td onclick="atirar('${coluna.coordenada}')">${coluna.coordenada}</td>`;
        });

        nova_linha = nova_linha + '</tr>';

        tabuleiro_oponente.innerHTML = tabuleiro_oponente.innerHTML + nova_linha;
    });
}

function selecionar(coordenada) {
    tabuleiro.forEach(linha => {
        linha.forEach(coluna => {
            if (coluna.coordenada === coordenada) {
                coluna.barco = true;
            }
        });
    });

    exibirMeuTabuleiro();
    ws.send(JSON.stringify({
        tipo: 'SELECIONANDOLOCALTABULEIRO',
        corpo: {
            player: player,
            mensagem: `O jogador (${player.id}) selecionou a coordenada: ${coordenada}`,
            tabuleiro: tabuleiro
        }
    }));
}

function deselecionar(coordenada) {
    tabuleiro.forEach(linha => {
        linha.forEach(coluna => {
            if (coluna.coordenada === coordenada) {
                coluna.barco = false;
            }
        });
    });

    exibirMeuTabuleiro();
}

function prontoParaJogar() {
    ws.send(JSON.stringify({
        tipo: 'PRONTOPARAJOGAR',
        corpo: {
            player: player,
            mensagem: `O jogador (${player.id}) está pronto para iniciar a partida!`,
        }
    }));
}


function atirar(coordenada) {
    tabuleiro_inimigo.forEach(linha => {
        linha.forEach(coluna => {
            if (coluna.coordenada === coordenada) {
                coluna.selecionar = true;
            }
        });
    });

    exibirTabuleiros();
    ws.send(JSON.stringify({
        tipo: 'SELECIONANDOLOCALTABULEIROOPONENTE',
        corpo: {
            player: player,
            mensagem: `O jogador (${player.id}) selecionou a coordenada: ${coordenada}`,
            tabuleiro_inimigo: tabuleiro_inimigo
        }
    }));
}