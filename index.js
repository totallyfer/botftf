const { 
    Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, 
    ChannelType, PermissionFlagsBits, AttachmentBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder 
} = require('discord.js');
const fs = require('fs');
const express = require('express');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

// --- Servidor Web para manter ativo ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Unificado (1v1 + Cidade + Tickets) a funcionar perfeitamente!'));
app.listen(PORT, () => console.log(`Servidor web na porta ${PORT}`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1551768205444259862";

// --- Mapeamento de Cores ---
const COLOR_MAP = {
    'lavanda': '#9b59b6',
    'azul': '#3498db',
    'dourado': '#f1c40f',
    'verde': '#2ecc71',
    'cinza': '#34495e',
    'branco': '#ecf0f1',
    'rosa': '#e91e63',
    'amarelo': '#f39c12',
    'ciano': '#00bcd4'
};

// --- Base de dados local (1v1) ---
const DB_FILE = './database.json';
function loadDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ guilds: {} }, null, 2));
    }
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        if (!data.guilds) data.guilds = {};
        return data;
    } catch {
        return { guilds: {} };
    }
}
function saveDB(data) {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, DB_FILE);
}
function getGuildData(db, guildId) {
    if (!db.guilds[guildId]) {
        db.guilds[guildId] = { 
            settings: { 
                ligaNome: '', 
                ligaCor: 'dourado',
                cargoProcurando: null,
                cargoTop1: null,
                cargoTop2: null,
                cargoTop3: null
            },
            players: {}
        };
    }
    if (!db.guilds[guildId].settings) {
        db.guilds[guildId].settings = { 
            ligaNome: '', 
            ligaCor: 'dourado',
            cargoProcurando: null,
            cargoTop1: null,
            cargoTop2: null,
            cargoTop3: null
        };
    }
    if (!db.guilds[guildId].players) {
        db.guilds[guildId].players = {};
    }
    return db.guilds[guildId];
}

// --- Base de dados local (Cidade) ---
const CIDADE_DB_FILE = './cidade_database.json';
function loadCidadeDB() {
    if (!fs.existsSync(CIDADE_DB_FILE)) {
        fs.writeFileSync(CIDADE_DB_FILE, JSON.stringify({ guilds: {} }, null, 2));
    }
    try {
        const data = JSON.parse(fs.readFileSync(CIDADE_DB_FILE, 'utf8'));
        if (!data.guilds) data.guilds = {};
        return data;
    } catch {
        return { guilds: {} };
    }
}
function saveCidadeDB(data) {
    const tmp = CIDADE_DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, CIDADE_DB_FILE);
}
function getCidadeGuildData(db, guildId) {
    if (!db.guilds[guildId]) {
        db.guilds[guildId] = { 
            settings: { 
                tabelaNome: 'CIDADE - RANKING', 
                tabelaCor: 'dourado' 
            },
            users: {} 
        };
    }
    if (!db.guilds[guildId].settings) {
        db.guilds[guildId].settings = { tabelaNome: 'CIDADE - RANKING', tabelaCor: 'dourado' };
    }
    if (!db.guilds[guildId].users) {
        db.guilds[guildId].users = {};
    }
    return db.guilds[guildId];
}

// --- Base de dados local (Tickets) ---
const TICKET_DB_FILE = './ticket_database.json';
function loadTicketDB() {
    if (!fs.existsSync(TICKET_DB_FILE)) {
        fs.writeFileSync(TICKET_DB_FILE, JSON.stringify({ guilds: {} }, null, 2));
    }
    try {
        const data = JSON.parse(fs.readFileSync(TICKET_DB_FILE, 'utf8'));
        if (!data.guilds) data.guilds = {};
        return data;
    } catch {
        return { guilds: {} };
    }
}
function saveTicketDB(data) {
    const tmp = TICKET_DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, TICKET_DB_FILE);
}
function getTicketGuildData(db, guildId) {
    if (!db.guilds[guildId]) {
        db.guilds[guildId] = { 
            config: {
                titulo: 'CENTRAL DE SUPORTE - TICKETS',
                descricao: 'Selecione abaixo o motivo do seu atendimento para abrir um ticket com a nossa equipe.',
                cargoStaff: null,
                canalEnvio: null,
                bannerUrl: null,
                opcoes: [
                    { label: 'Suporte Geral', value: 'suporte_geral', description: 'Dúvidas gerais e ajuda', emoji: '💬' },
                    { label: 'Sorteios & Prêmios', value: 'sorteios', description: 'Assuntos relacionados a sorteios', emoji: '🎁' }
                ]
            },
            ticketsAtivos: {}
        };
    }
    if (!db.guilds[guildId].config) {
        db.guilds[guildId].config = {
            titulo: 'CENTRAL DE SUPORTE - TICKETS',
            descricao: 'Selecione abaixo o motivo do seu atendimento para abrir um ticket com a nossa equipe.',
            cargoStaff: null,
            canalEnvio: null,
            bannerUrl: null,
            opcoes: [
                { label: 'Suporte Geral', value: 'suporte_geral', description: 'Dúvidas gerais e ajuda', emoji: '💬' },
                { label: 'Sorteios & Prêmios', value: 'sorteios', description: 'Assuntos relacionados a sorteios', emoji: '🎁' }
            ]
        };
    }
    if (!db.guilds[guildId].ticketsAtivos) {
        db.guilds[guildId].ticketsAtivos = {};
    }
    return db.guilds[guildId];
}

const cidadeCooldowns = {
    work: new Map(),
    job: new Map(),
    slut: new Map(),
    daily: new Map(),
    rob: new Map()
};

// ============================================================
// --- ATUALIZAR CARGOS DO PÓDIO (1V1) ---
// ============================================================
async function atualizarCargosPodio(guild, guildData) {
    if (!guild) return;
    const settings = guildData.settings;
    const sortedPlayers = Object.values(guildData.players)
        .filter(p => p.points > 0)
        .sort((a, b) => b.points - a.points);

    const top1Id = sortedPlayers[0]?.userId || null;
    const top2Id = sortedPlayers[1]?.userId || null;
    const top3Id = sortedPlayers[2]?.userId || null;

    const pods = [
        { roleId: settings.cargoTop1, targetUserId: top1Id },
        { roleId: settings.cargoTop2, targetUserId: top2Id },
        { roleId: settings.cargoTop3, targetUserId: top3Id }
    ];

    for (const pod of pods) {
        if (!pod.roleId) continue;
        const role = await guild.roles.fetch(pod.roleId).catch(() => null);
        if (!role) continue;

        for (const member of role.members.values()) {
            if (member.id !== pod.targetUserId) {
                await member.roles.remove(role).catch(() => {});
            }
        }

        if (pod.targetUserId) {
            const member = await guild.members.fetch(pod.targetUserId).catch(() => null);
            if (member && !member.roles.cache.has(role.id)) {
                await member.roles.add(role).catch(() => {});
            }
        }
    }
}

// ============================================================
// --- FUNÇÕES AUXILIARES DE CANVAS ---
// ============================================================
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function drawRoundImage(ctx, img, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
}

// ============================================================
// --- GERADOR DE IMAGEM: MONEYINFO ---
// ============================================================
async function generateMoneyInfoImage(member, userObj, dbSettings = {}) {
    const canvas = createCanvas(900, 480);
    const ctx = canvas.getContext('2d');
    const selectedColor = COLOR_MAP[dbSettings.tabelaCor] || '#f1c40f';

    ctx.fillStyle = selectedColor;
    ctx.fillRect(0, 0, canvas.width, 160);

    ctx.fillStyle = '#121318';
    ctx.fillRect(0, 150, canvas.width, canvas.height - 150);

    ctx.fillStyle = selectedColor;
    ctx.fillRect(0, 146, canvas.width, 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PAINEL FINANCEIRO', 180, 70);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px sans-serif';
    ctx.fillText('Extrato de contas, carteira e património da cidade', 180, 95);

    let avatarImg = null;
    try {
        const avatarURL = member.displayAvatarURL ? member.displayAvatarURL({ extension: 'png', size: 256 }) : `https://cdn.discordapp.com/embed/avatars/0.png`;
        avatarImg = await loadImage(avatarURL);
    } catch {}

    ctx.fillStyle = selectedColor;
    ctx.beginPath();
    ctx.arc(100, 80, 52, 0, Math.PI * 2);
    ctx.fill();

    if (avatarImg) {
        drawRoundImage(ctx, avatarImg, 50, 30, 100);
    } else {
        ctx.fillStyle = '#2c2d30';
        ctx.beginPath();
        ctx.arc(100, 80, 48, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    const username = member.displayName || member.username || 'Cidadão';
    ctx.fillText(`@${username.slice(0, 20)}`, canvas.width - 50, 70);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px sans-serif';
    ctx.fillText('STATUS: Cidadão Ativo 🏙️', canvas.width - 50, 92);

    const wallet = userObj.wallet || 0;
    const bank = userObj.bank || 0;
    const total = wallet + bank;

    const cardY = 195;
    const cardW = 245;
    const cardH = 230;
    const cardSpacing = 30;
    const startX = 50;

    // Carteira
    ctx.fillStyle = '#1b1d24';
    roundRect(ctx, startX, cardY, cardW, cardH, 16, true, false);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    roundRect(ctx, startX, cardY, cardW, cardH, 16, false, true);

    ctx.fillStyle = '#2ecc71';
    roundRect(ctx, startX + 25, cardY + 25, 45, 45, 10, true, false);
    ctx.fillStyle = '#1b1d24';
    ctx.fillRect(startX + 35, cardY + 40, 25, 22);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(startX + 45, cardY + 48, 8, 6);

    ctx.fillStyle = '#a0a2ab';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DINHEIRO EM MÃOS', startX + 25, cardY + 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CARTEIRA', startX + 25, cardY + 118);

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`🪙 ${wallet.toLocaleString()}`, startX + 25, cardY + 175);

    // Banco
    const x2 = startX + cardW + cardSpacing;
    ctx.fillStyle = '#1b1d24';
    roundRect(ctx, x2, cardY, cardW, cardH, 16, true, false);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    roundRect(ctx, x2, cardY, cardW, cardH, 16, false, true);

    ctx.fillStyle = '#3498db';
    roundRect(ctx, x2 + 25, cardY + 25, 45, 45, 10, true, false);
    ctx.fillStyle = '#1b1d24';
    ctx.fillRect(x2 + 35, cardY + 40, 4, 18);
    ctx.fillRect(x2 + 45, cardY + 40, 4, 18);
    ctx.fillRect(x2 + 55, cardY + 40, 4, 18);

    ctx.fillStyle = '#a0a2ab';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PROTEGIDO NO COFRE', x2 + 25, cardY + 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('BANCO CENTRAL', x2 + 25, cardY + 118);

    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`🏦 ${bank.toLocaleString()}`, x2 + 25, cardY + 175);

    // Património
    const x3 = x2 + cardW + cardSpacing;
    ctx.fillStyle = '#1b1d24';
    roundRect(ctx, x3, cardY, cardW, cardH, 16, true, false);
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2;
    roundRect(ctx, x3, cardY, cardW, cardH, 16, false, true);

    ctx.fillStyle = selectedColor;
    roundRect(ctx, x3 + 25, cardY + 25, 45, 45, 10, true, false);
    ctx.fillStyle = '#1b1d24';
    ctx.fillRect(x3 + 34, cardY + 52, 6, 12);
    ctx.fillRect(x3 + 44, cardY + 45, 6, 19);
    ctx.fillRect(x3 + 54, cardY + 37, 6, 27);

    ctx.fillStyle = '#a0a2ab';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SOMA GERAL', x3 + 25, cardY + 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('PATRIMÓNIO TOTAL', x3 + 25, cardY + 118);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`💰 ${total.toLocaleString()}`, x3 + 25, cardY + 175);

    return canvas.toBuffer('image/png');
}

// ============================================================
// --- GERADOR DE IMAGEM: ANÁLISE DE PERFIL (1V1) ---
// ============================================================
async function generateAnaliseImage(member, stats, rankPosition, dbSettings = {}) {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');
    const selectedColor = COLOR_MAP[dbSettings.ligaCor] || '#e74c3c';

    ctx.fillStyle = selectedColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(15, 15, 18, 0.82)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2;
    roundRect(ctx, 480, 30, 280, 50, 10, false, true);
    ctx.fillStyle = '#888888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LIGA ATUAL', 620, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText((dbSettings.ligaNome || '').toUpperCase(), 620, 68);

    let avatarImg = null;
    try {
        const avatarURL = member.displayAvatarURL ? member.displayAvatarURL({ extension: 'png', size: 256 }) : `https://cdn.discordapp.com/embed/avatars/0.png`;
        avatarImg = await loadImage(avatarURL);
    } catch {}

    if (avatarImg) {
        drawRoundImage(ctx, avatarImg, 75, 125, 150);
    } else {
        ctx.fillStyle = '#2c2d30';
        ctx.beginPath();
        ctx.arc(150, 200, 75, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    const username = member.displayName || member.username || 'Jogador';
    ctx.fillText(username.slice(0, 20), 270, 170);

    ctx.fillStyle = selectedColor;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`RANK #${rankPosition} •${stats.points} PTS`, 270, 210);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '11px sans-serif';
    ctx.fillText('TAXA DE VITÓRIA', 270, 260);
    ctx.textAlign = 'right';

    const totalJogos = (stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0);
    const winRate = totalJogos > 0 ? ((stats.wins / totalJogos) * 100).toFixed(1) : '0.0';
    ctx.fillText(`${winRate}%`, 760, 260);

    ctx.fillStyle = '#2c2d30';
    roundRect(ctx, 270, 275, 490, 8, 4, true, false);
    
    ctx.fillStyle = selectedColor;
    const barraWidth = Math.max(10, (490 * parseFloat(winRate)) / 100);
    roundRect(ctx, 270, 275, barraWidth, 8, 4, true, false);

    const boxWidth = 153;
    const boxHeight = 100;
    const boxY = 310;

    // Vitórias
    ctx.fillStyle = 'rgba(30, 31, 34, 0.9)';
    roundRect(ctx, 270, boxY, boxWidth, boxHeight, 12, true, false);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(270, boxY, 4, boxHeight);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VITÓRIAS', 290, boxY + 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(stats.wins || 0, 290, boxY + 75);

    // Empates
    ctx.fillStyle = 'rgba(30, 31, 34, 0.9)';
    roundRect(ctx, 438, boxY, boxWidth, boxHeight, 12, true, false);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(438, boxY, 4, boxHeight);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('EMPATES', 458, boxY + 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(stats.draws || 0, 458, boxY + 75);

    // Derrotas
    ctx.fillStyle = 'rgba(30, 31, 34, 0.9)';
    roundRect(ctx, 606, boxY, boxWidth, boxHeight, 12, true, false);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(606, boxY, 4, boxHeight);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DERROTAS', 626, boxY + 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(stats.losses || 0, 626, boxY + 75);

    return canvas.toBuffer('image/png');
}

// ============================================================
// --- GERADOR DE IMAGEM: TABELA DE RANKING (1V1) ---
// ============================================================
const ROW_H = 75, W = 800, HEADER_H = 130;

async function generateRankingImage(playersArray, page = 0, dbSettings = {}) {
    const PER_PAGE = 4;
    const startIdx = page * PER_PAGE;
    const current = playersArray.slice(startIdx, startIdx + PER_PAGE);
    const H = HEADER_H + Math.max(current.length, 1) * ROW_H + 60;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    const selectedColor = COLOR_MAP[dbSettings.ligaCor] || '#e74c3c';

    ctx.fillStyle = selectedColor;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(15, 15, 18, 0.85)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TABELA 1V1', W / 2, 45);

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 250, 60, 300, 35, 8, false, true);
    ctx.fillStyle = '#888888';
    ctx.font = '9px sans-serif';
    ctx.fillText('LIGA ATUAL', W / 2, 75);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText((dbSettings.ligaNome || '').toUpperCase(), W / 2, 88);

    if (current.length === 0) {
        ctx.fillStyle = '#888888';
        ctx.font = '20px sans-serif';
        ctx.fillText('Nenhum jogador pontuado.', W / 2, HEADER_H + 50);
        return canvas.toBuffer('image/png');
    }

    let startY = 120;
    for (let i = 0; i < current.length; i++) {
        const p = current[i];
        const rank = startIdx + i + 1;

        ctx.fillStyle = 'rgba(30, 31, 34, 0.85)';
        roundRect(ctx, 50, startY, 700, 60, 10, true, false);

        if (rank === 1) ctx.fillStyle = '#f1c40f';
        else if (rank === 2) ctx.fillStyle = '#95a5a6';
        else if (rank === 3) ctx.fillStyle = '#d35400';
        else ctx.fillStyle = selectedColor;
        ctx.fillRect(50, startY, 5, 60);

        ctx.fillStyle = rank === 1 ? '#f1c40f' : rank === 2 ? '#95a5a6' : rank === 3 ? '#d35400' : '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`#${rank}`, 75, startY + 36);

        let avatarImg = null;
        try {
            if (p.avatarURL) avatarImg = await loadImage(p.avatarURL);
        } catch {}

        if (avatarImg) {
            drawRoundImage(ctx, avatarImg, 130, startY + 10, 40);
        } else {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(150, startY + 30, 20, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText((p.username || 'Jogador').slice(0, 18), 185, startY + 36);

        const total = (p.wins || 0) + (p.losses || 0) + (p.draws || 0);
        const wr = total > 0 ? ((p.wins / total) * 100).toFixed(1) : '0.0';
        ctx.fillStyle = '#2ecc71';
        ctx.font = '12px sans-serif';
        ctx.fillText(`TAXA DE VITÓRIA: ${wr}%`, 480, startY + 36);

        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(p.points, 725, startY + 38);

        startY += 70;
    }

    return canvas.toBuffer('image/png');
}

async function getRankedPlayers(guildPlayersObj, clientInstance) {
    const players = Object.values(guildPlayersObj || {})
        .filter(p => p.points > 0)
        .sort((a, b) => b.points - a.points);

    const enriched = [];
    for (const p of players) {
        const u = await clientInstance.users.fetch(p.userId).catch(() => null);
        enriched.push({
            userId: p.userId,
            points: p.points,
            wins: p.wins || 0,
            losses: p.losses || 0,
            draws: p.draws || 0,
            username: u ? u.username : 'Jogador',
            avatarURL: u ? u.displayAvatarURL({ extension: 'png', size: 128 }) : null
        });
    }
    return enriched;
}

async function buildTabelaMessage(players, page, dbSettings = {}) {
    const PER_PAGE = 4;
    const buffer = await generateRankingImage(players, page, dbSettings);
    const attachment = new AttachmentBuilder(buffer, { name: `tabela_pagina_${page + 1}.png` });

    const totalPages = Math.ceil(players.length / PER_PAGE) || 1;
    const ligaTitulo = dbSettings.ligaNome ? ` - ${dbSettings.ligaNome}` : '';
    const embed = new EmbedBuilder()
        .setTitle(`<a:brasil:1554216254187765960> Tabela de Classificação${ligaTitulo}`)
        .setColor(COLOR_MAP[dbSettings.ligaCor] || 0xE74C3C)
        .setImage(`attachment://tabela_pagina_${page + 1}.png`)
        .setTimestamp()
        .setFooter({ text: `Página ${page + 1} de${totalPages}` });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`tabela_prev_${page}`).setLabel('◀ Anterior').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId(`tabela_next_${page}`).setLabel('Próxima ▶').setStyle(ButtonStyle.Primary).setDisabled((page + 1) * PER_PAGE >= players.length)
    );

    return { embeds: [embed], files: [attachment], components: [row] };
}

// ============================================================
// --- GERADOR DE IMAGEM: TABELA DA CIDADE (1-10) ---
// ============================================================
async function generateCidadeRankingImage(playersArray, page = 0, dbSettings = {}) {
    const PER_PAGE = 10;
    const startIdx = page * PER_PAGE;
    const current = playersArray.slice(startIdx, startIdx + PER_PAGE);
    
    const ROW_H = 65;
    const HEADER_H = 120;
    const W = 800;
    const H = HEADER_H + Math.max(current.length, 1) * ROW_H + 50;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    const selectedColor = COLOR_MAP[dbSettings.tabelaCor] || '#f1c40f';

    ctx.fillStyle = selectedColor;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(15, 15, 18, 0.90)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((dbSettings.tabelaNome || 'CIDADE - RANKING').toUpperCase(), W / 2, 45);

    ctx.fillStyle = selectedColor;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`EXIBINDO DO 1 AO 10 (BANCO)`, W / 2, 75);

    if (current.length === 0) {
        ctx.fillStyle = '#888888';
        ctx.font = '18px sans-serif';
        ctx.fillText('Nenhum cidadão com dinheiro no banco.', W / 2, HEADER_H + 50);
        return canvas.toBuffer('image/png');
    }

    let startY = 105;
    for (let i = 0; i < current.length; i++) {
        const p = current[i];
        const rank = startIdx + i + 1;

        ctx.fillStyle = 'rgba(30, 31, 34, 0.85)';
        roundRect(ctx, 40, startY, 720, 55, 8, true, false);

        if (rank === 1) ctx.fillStyle = '#f1c40f';
        else if (rank === 2) ctx.fillStyle = '#95a5a6';
        else if (rank === 3) ctx.fillStyle = '#d35400';
        else ctx.fillStyle = selectedColor;
        ctx.fillRect(40, startY, 5, 55);

        ctx.fillStyle = rank === 1 ? '#f1c40f' : rank === 2 ? '#95a5a6' : rank === 3 ? '#d35400' : '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`#${rank}`, 65, startY + 34);

        let avatarImg = null;
        try {
            if (p.avatarURL) avatarImg = await loadImage(p.avatarURL);
        } catch {}

        if (avatarImg) {
            drawRoundImage(ctx, avatarImg, 115, startY + 7, 40);
        } else {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(135, startY + 27, 20, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText((p.username || 'Cidadão').slice(0, 20), 175, startY + 34);

        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`🪙 ${p.bank.toLocaleString()} moedas`, 735, startY + 35);

        startY += 62;
    }

    return canvas.toBuffer('image/png');
}

async function getRankedCidadePlayers(guildUsersObj, clientInstance) {
    const usersObj = guildUsersObj || {};
    const filtered = Object.values(usersObj).filter(u => (u.bank || 0) > 0);
    filtered.sort((a, b) => b.bank - a.bank);

    const enriched = [];
    for (const p of filtered) {
        const u = await clientInstance.users.fetch(p.userId).catch(() => null);
        enriched.push({
            userId: p.userId,
            bank: p.bank,
            wallet: p.wallet || 0,
            username: u ? u.username : 'Cidadão',
            avatarURL: u ? u.displayAvatarURL({ extension: 'png', size: 128 }) : null
        });
    }
    return enriched;
}

async function buildCidadeTabelaMessage(players, page, dbSettings, clientInstance) {
    const PER_PAGE = 10;
    const buffer = await generateCidadeRankingImage(players, page, dbSettings);
    const attachment = new AttachmentBuilder(buffer, { name: `tabela_cidade_pagina_${page + 1}.png` });

    const totalPages = Math.ceil(players.length / PER_PAGE) || 1;
    const embed = new EmbedBuilder()
        .setTitle(`<:moeda:1554577755121917994> ${dbSettings.tabelaNome}`)
        .setDescription('Ranking dos cidadãos mais ricos com moedas guardadas no **Banco**.')
        .setColor(COLOR_MAP[dbSettings.tabelaCor] || 0xF1C40F)
        .setImage(`attachment://tabela_cidade_pagina_${page + 1}.png`)
        .setTimestamp()
        .setFooter({ text: `Página ${page + 1} de${totalPages}` });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`cidade_prev_${page}`).setLabel('◀ Anterior').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId(`cidade_next_${page}`).setLabel('Próxima ▶').setStyle(ButtonStyle.Primary).setDisabled((page + 1) * PER_PAGE >= players.length)
    );

    return { embeds: [embed], files: [attachment], components: [row] };
}

// ============================================================
// --- REGISTO DE TODOS OS COMANDOS SLASH ---
// ============================================================
client.once('ready', async () => {
    console.log(`Bot Unificado online como ${client.user.tag}!`);

    const commands = [
        new SlashCommandBuilder().setName('tabela').setDescription('Mostra a tabela 1v1').addStringOption(o => o.setName('modo').setDescription('Modo').setRequired(true).addChoices({ name: '1v1', value: '1v1' })),
        new SlashCommandBuilder().setName('desafiar').setDescription('Cria desafio 1v1').addStringOption(o => o.setName('modo').setDescription('Modo').setRequired(true).addChoices({ name: '1v1', value: '1v1' })).addUserOption(o => o.setName('adversario').setDescription('Adversário').setRequired(false)),
        new SlashCommandBuilder().setName('analise').setDescription('Perfil de membro').addStringOption(o => o.setName('modo').setDescription('Modo').setRequired(true).addChoices({ name: '1v1', value: '1v1' })).addUserOption(o => o.setName('utilizador').setDescription('Membro').setRequired(false)),
        new SlashCommandBuilder().setName('painel').setDescription('Painel administrativo').addSubcommand(sub => sub.setName('cidade').setDescription('Cidade')).addSubcommand(sub => sub.setName('ticket').setDescription('Tickets').addAttachmentOption(o => o.setName('banner').setDescription('Banner').setRequired(false))).setDMPermission(false),
        new SlashCommandBuilder().setName('reset').setDescription('Reseta 1v1').addStringOption(o => o.setName('modo').setDescription('Modo').setRequired(true).addChoices({ name: '1v1', value: '1v1' })),
        new SlashCommandBuilder().setName('tabelacidade').setDescription('Tabela da cidade'),
        new SlashCommandBuilder().setName('work').setDescription('Trabalha'),
        new SlashCommandBuilder().setName('job').setDescription('Emprego'),
        new SlashCommandBuilder().setName('slut').setDescription('Arriscar sorte'),
        new SlashCommandBuilder().setName('daily').setDescription('Prêmio diário'),
        new SlashCommandBuilder().setName('moneyinfo').setDescription('Informações financeiras').addUserOption(o => o.setName('usuario').setDescription('Usuário').setRequired(false)),
        new SlashCommandBuilder().setName('dep').setDescription('Deposita no banco').addStringOption(o => o.setName('quantidade').setDescription('Qtd').setRequired(true)),
        new SlashCommandBuilder().setName('rob').setDescription('Roubar').addUserOption(o => o.setName('usuario').setDescription('Vítima').setRequired(true)),
        new SlashCommandBuilder().setName('pay').setDescription('Transferir').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addStringOption(o => o.setName('quantidade').setDescription('Qtd').setRequired(true))
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Comandos registados!');
    } catch (error) {
        console.error(error);
    }
});

// ============================================================
// --- GESTÃO DE INTERAÇÕES ---
// ============================================================
client.on('interactionCreate', async interaction => {
    if (!interaction.guildId) return;

    const db = loadDB();
    const guildData = getGuildData(db, interaction.guildId);

    const cidadeDb = loadCidadeDB();
    const cidadeGuildData = getCidadeGuildData(cidadeDb, interaction.guildId);

    const ticketDb = loadTicketDB();
    const ticketGuildData = getTicketGuildData(ticketDb, interaction.guildId);

    const ensureCidadeUser = (userId) => {
        if (!cidadeGuildData.users[userId]) {
            cidadeGuildData.users[userId] = { userId, wallet: 0, bank: 0 };
        }
        return cidadeGuildData.users[userId];
    };

    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'tabela') {
            await interaction.deferReply();
            const players = await getRankedPlayers(guildData.players, client);
            if (players.length === 0) {
                return await interaction.editReply({ content: '⚠ Ainda não existem jogadores com pontuação positiva na tabela 1v1!' });
            }
            try {
                const payload = await buildTabelaMessage(players, 0, guildData.settings);
                return await interaction.editReply(payload);
            } catch (err) {
                console.error(err);
                return await interaction.editReply({ content: '❌ Erro ao gerar a imagem da tabela.' });
            }
        }

        if (commandName === 'desafiar') {
            const adversario = interaction.options.getUser('adversario');
            if (adversario && adversario.id === interaction.user.id) return await interaction.reply({ content: '❌ Não podes desafiar a ti próprio!', ephemeral: true });
            if (adversario && adversario.bot) return await interaction.reply({ content: '❌ Não podes desafiar um bot!', ephemeral: true });

            const titleStatus = adversario ? `<a:carregando:1554216030128177152> AGUARDANDO ${adversario.username.toUpperCase()} ACEITAR` : `<a:carregando:1554216030128177152> AGUARDANDO ALGUÉM ACEITAR`;

            const embed = new EmbedBuilder()
                .setTitle(titleStatus)
                .setDescription('Selecione o mapa no menu abaixo:')
                .setColor(0xFF4500)
                .addFields(
                    { name: 'Desafiante', value: `${interaction.user}`, inline: true },
                    { name: 'Adversário', value: adversario ? `${adversario}` : '`Aberto`', inline: true }
                );

            const mapSelect = new StringSelectMenuBuilder()
                .setCustomId(`escolher_mapa_${interaction.user.id}_${adversario ? adversario.id : 'aleatorio'}`)
                .setPlaceholder('🗺 Selecione o mapa...')
                .addOptions([
                    { label: 'Homestead', value: 'Homestead' },
                    { label: 'Airport', value: 'Airport' },
                    { label: 'Facility', value: 'Facility' },
                    { label: 'Abandoned Prison', value: 'Abandoned Prison' },
                    { label: 'Arcade', value: 'Arcade' },
                    { label: 'Abandoned Facility', value: 'Abandoned Facility' }
                ]);

            return await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(mapSelect)], ephemeral: true });
        }

        if (commandName === 'analise') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('utilizador') || interaction.user;
            const pData = guildData.players[targetUser.id] || { points: 0, wins: 0, draws: 0, losses: 0 };
            
            const allPlayers = Object.values(guildData.players).sort((a, b) => b.points - a.points);
            const position = allPlayers.findIndex(p => p.userId === targetUser.id);
            const posText = position >= 0 ? position + 1 : allPlayers.length + 1;

            const memberObj = await interaction.guild.members.fetch(targetUser.id).catch(() => targetUser);

            try {
                const buffer = await generateAnaliseImage(memberObj, pData, posText, guildData.settings);
                const attachment = new AttachmentBuilder(buffer, { name: `analise_${targetUser.username}.png` });

                const embed = new EmbedBuilder()
                    .setTitle(`Perfil - ${targetUser.username}`)
                    .setColor(COLOR_MAP[guildData.settings.ligaCor] || 0xE74C3C)
                    .setImage(`attachment://analise_${targetUser.username}.png`);

                return await interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch (err) {
                console.error(err);
                return await interaction.editReply({ content: '❌ Erro ao gerar o cartão de análise.' });
            }
        }

        if (commandName === 'painel') {
            const sub = interaction.options.getSubcommand(false);
            if (sub === 'cidade') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return await interaction.reply({ content: 'Sem permissão!', ephemeral: true });
                const embed = new EmbedBuilder().setTitle('🏙️ Painel Cidade').setDescription(`Título: \`${cidadeGuildData.settings.tabelaNome}\``).setColor(0xF1C40F);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('cidade_mudar_titulo').setLabel('Mudar Título').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('cidade_mudar_cor').setLabel('Mudar Cor').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('cidade_add_remover').setLabel('Moedas').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('cidade_resetar').setLabel('Resetar').setStyle(ButtonStyle.Danger)
                );
                return await interaction.reply({ embeds: [embed], components: [row] });
            }
            if (sub === 'ticket') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return await interaction.reply({ content: 'Sem permissão!', ephemeral: true });
                const cfg = ticketGuildData.config;
                const embed = new EmbedBuilder().setTitle('Painel Tickets').setDescription(`Título: \`${cfg.titulo}\``).setColor(0x3498DB);
                const r1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_cfg_texto').setLabel('Textos').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('ticket_cfg_cargo').setLabel('Cargo Staff').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('ticket_cfg_canal').setLabel('Canal').setStyle(ButtonStyle.Secondary)
                );
                const r2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_cfg_add_opcao').setLabel('Add Opção').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('ticket_cfg_del_opcao').setLabel('Del Opção').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('ticket_enviar_painel').setLabel('Enviar Painel').setStyle(ButtonStyle.Success)
                );
                return await interaction.reply({ embeds: [embed], components: [r1, r2] });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return await interaction.reply({ content: 'Sem permissão!', ephemeral: true });
            const embed = new EmbedBuilder().setTitle('Painel 1v1').setDescription(`Liga: \`${guildData.settings.ligaNome || 'Nenhuma'}\``).setColor(0xE74C3C);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('painel_mudar_titulo').setLabel('Mudar Título').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('painel_mudar_cor').setLabel('Mudar Cor').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('painel_config_cargos').setLabel('Cargos').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('painel_nova_liga').setLabel('Nova Liga').setStyle(ButtonStyle.Danger)
            );
            return await interaction.reply({ embeds: [embed], components: [row] });
        }

        if (commandName === 'reset') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: 'Apenas admins!', ephemeral: true });
            guildData.players = {};
            saveDB(db);
            return await interaction.reply({ content: '🔄 Resetado com sucesso!', ephemeral: true });
        }

        if (commandName === 'tabelacidade') {
            await interaction.deferReply();
            const players = await getRankedCidadePlayers(cidadeGuildData.users, client);
            try {
                const payload = await buildCidadeTabelaMessage(players, 0, cidadeGuildData.settings, client);
                return await interaction.editReply(payload);
            } catch (err) {
                console.error(err);
                return await interaction.editReply({ content: '❌ Erro ao gerar tabela da cidade.' });
            }
        }

        if (commandName === 'work' || commandName === 'job') {
            const userId = interaction.user.id;
            const coins = Math.floor(Math.random() * 6000) + 1000;
            const userObj = ensureCidadeUser(userId);
            userObj.wallet += coins;
            saveCidadeDB(cidadeDb);
            return await interaction.reply({ content: `✅ <@${userId}> trabalhou e ganhou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas na carteira!` });
        }

        if (commandName === 'slut') {
            const userId = interaction.user.id;
            const userObj = ensureCidadeUser(userId);
            const success = Math.random() < 0.5;
            if (success) {
                const coins = Math.floor(Math.random() * 4500) + 1500;
                userObj.wallet += coins;
                saveCidadeDB(cidadeDb);
                return await interaction.reply({ content: `🎉 Deu bom! Ganhou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas!` });
            } else {
                const loss = Math.floor(Math.random() * 2000) + 500;
                userObj.wallet = Math.max(0, userObj.wallet - loss);
                saveCidadeDB(cidadeDb);
                return await interaction.reply({ content: `💸 Deu ruim! Perdeu <:moeda:1554577755121917994> **${loss.toLocaleString()}** moedas!` });
            }
        }

        if (commandName === 'daily') {
            const coins = 15000;
            const userObj = ensureCidadeUser(interaction.user.id);
            userObj.wallet += coins;
            saveCidadeDB(cidadeDb);
            return await interaction.reply({ content: `🎁 Resgataste a tua recompensa diária de <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas!` });
        }

        if (commandName === 'moneyinfo') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const userObj = ensureCidadeUser(targetUser.id);
            const memberObj = await interaction.guild.members.fetch(targetUser.id).catch(() => targetUser);

            try {
                const buffer = await generateMoneyInfoImage(memberObj, userObj, cidadeGuildData.settings);
                const attachment = new AttachmentBuilder(buffer, { name: `moneyinfo_${targetUser.username}.png` });

                const embed = new EmbedBuilder()
                    .setTitle(`Informações Financeiras - ${targetUser.username}`)
                    .setColor(COLOR_MAP[cidadeGuildData.settings.tabelaCor] || 0xF1C40F)
                    .setImage(`attachment://moneyinfo_${targetUser.username}.png`);

                return await interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch (err) {
                console.error(err);
                return await interaction.editReply({ content: '❌ Erro ao gerar imagem financeira.' });
            }
        }

        if (commandName === 'dep') {
            const userObj = ensureCidadeUser(interaction.user.id);
            const arg = interaction.options.getString('quantidade').toLowerCase();
            let qtd = arg === 'all' ? userObj.wallet : parseInt(arg, 10);
            if (isNaN(qtd) || qtd <= 0 || userObj.wallet <= 0) return await interaction.reply({ content: 'Valor inválido!', ephemeral: true });
            qtd = Math.min(qtd, userObj.wallet);
            userObj.wallet -= qtd;
            userObj.bank += qtd;
            saveCidadeDB(cidadeDb);
            return await interaction.reply({ content: `✅ Depositaste <:moeda:1554577755121917994> **${qtd.toLocaleString()}** moedas!` });
        }

        if (commandName === 'rob') {
            const target = interaction.options.getUser('usuario');
            if (target.id === interaction.user.id) return await interaction.reply({ content: 'Não podes roubar a ti próprio!', ephemeral: true });
            const robber = ensureCidadeUser(interaction.user.id);
            const victim = ensureCidadeUser(target.id);
            if (victim.wallet <= 0) return await interaction.reply({ content: 'A vítima não tem dinheiro na carteira!', ephemeral: true });
            
            if (Math.random() < 0.3) {
                const stolen = Math.floor(victim.wallet * 0.2);
                victim.wallet -= stolen;
                robber.wallet += stolen;
                saveCidadeDB(cidadeDb);
                return await interaction.reply({ content: `🥷 Roubaste <:moeda:1554577755121917994> **${stolen.toLocaleString()}** moedas de ${target.username}!` });
            } else {
                return await interaction.reply({ content: '🚨 Foste pego pela polícia e falhaste o assalto!' });
            }
        }

        if (commandName === 'pay') {
            const target = interaction.options.getUser('user');
            if (target.id === interaction.user.id) return await interaction.reply({ content: 'Não podes pagar a ti próprio!', ephemeral: true });
            const sender = ensureCidadeUser(interaction.user.id);
            const receiver = ensureCidadeUser(target.id);
            const qtd = parseInt(interaction.options.getString('quantidade'), 10);
            if (isNaN(qtd) || sender.wallet < qtd) return await interaction.reply({ content: 'Saldo insuficiente na carteira!', ephemeral: true });
            sender.wallet -= qtd;
            receiver.wallet += qtd;
            saveCidadeDB(cidadeDb);
            return await interaction.reply({ content: `💸 Transferiste <:moeda:1554577755121917994> **${qtd.toLocaleString()}** para ${target.username}!` });
        }
    }

    // --- BOTÕES E MENUS DE PAGINAÇÃO ---
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('tabela_prev_') || interaction.customId.startsWith('tabela_next_')) {
            await interaction.deferUpdate();
            const pageChange = interaction.customId.startsWith('tabela_next_') ? 1 : -1;
            const currentPage = parseInt(interaction.customId.split('_').pop(), 10);
            const players = await getRankedPlayers(guildData.players, client);
            const payload = await buildTabelaMessage(players, currentPage + pageChange, guildData.settings);
            return await interaction.editReply(payload);
        }
        if (interaction.customId.startsWith('cidade_prev_') || interaction.customId.startsWith('cidade_next_')) {
            await interaction.deferUpdate();
            const pageChange = interaction.customId.startsWith('cidade_next_') ? 1 : -1;
            const currentPage = parseInt(interaction.customId.split('_').pop(), 10);
            const players = await getRankedCidadePlayers(cidadeGuildData.users, client);
            const payload = await buildCidadeTabelaMessage(players, currentPage + pageChange, cidadeGuildData.settings, client);
            return await interaction.editReply(payload);
        }

        // --- PAINEL CIDADE BOTÕES ---
        if (interaction.customId.startsWith('cidade_')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return await interaction.reply({ content: 'Sem permissão!', ephemeral: true });
            }
            if (interaction.customId === 'cidade_mudar_titulo') {
                const modal = new ModalBuilder().setCustomId('modal_cidade_titulo').setTitle('Alterar Título da Cidade');
                const input = new TextInputBuilder().setCustomId('input_novo_titulo').setLabel('Novo Título').setStyle(TextInputStyle.Short).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                return await interaction.showModal(modal);
            }
            if (interaction.customId === 'cidade_mudar_cor') {
                const select = new StringSelectMenuBuilder().setCustomId('select_cidade_cor').setPlaceholder('Selecione a cor...').addOptions(
                    Object.keys(COLOR_MAP).map(c => ({ label: c.toUpperCase(), value: c }))
                );
                return await interaction.reply({ content: 'Escolha a cor:', components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
            }
            if (interaction.customId === 'cidade_resetar') {
                cidadeGuildData.users = {};
                saveCidadeDB(cidadeDb);
                return await interaction.reply({ content: '🔄 Cidade resetada!', ephemeral: true });
            }
        }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'select_cidade_cor') {
        cidadeGuildData.settings.tabelaCor = interaction.values[0];
        saveCidadeDB(cidadeDb);
        return await interaction.update({ content: `✅ Cor alterada para ${interaction.values[0]}!`, components: [] });
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_cidade_titulo') {
        cidadeGuildData.settings.tabelaNome = interaction.fields.getTextInputValue('input_novo_titulo');
        saveCidadeDB(cidadeDb);
        return await interaction.reply({ content: '✅ Título da cidade atualizado!', ephemeral: true });
    }
});

client.login(TOKEN);
