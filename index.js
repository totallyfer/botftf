const { 
    Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, 
    ChannelType, PermissionFlagsBits, AttachmentBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder 
} = require('discord.js');
const fs = require('fs');
const express = require('express');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

// --- Servidor Web para manter ativo no Railway ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Unificado (1v1 + Cidade + Tickets) a funcionar perfeitamente no Railway!'));
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

// --- Base de dados local (1v1 Isolado por Servidor) ---
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

// --- Base de dados local (Cidade Isolada por Servidor) ---
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

// --- Base de dados local (Tickets Isolados por Servidor) ---
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

// Cooldowns em memória
const cidadeCooldowns = {
    work: new Map(),
    job: new Map(),
    slut: new Map(),
    daily: new Map(),
    rob: new Map()
};

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
// --- GERADOR DE IMAGEM: MONEYINFO (Usando DejaVu Sans) ---
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
    ctx.font = 'bold 28px DejaVu Sans';
    ctx.textAlign = 'left';
    ctx.fillText('PAINEL FINANCEIRO', 180, 70);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px DejaVu Sans';
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
    ctx.font = 'bold 18px DejaVu Sans';
    const username = member.displayName || member.username || 'Cidadão';
    ctx.fillText(`@${username.slice(0, 20)}`, canvas.width - 50, 70);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px DejaVu Sans';
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
    ctx.font = 'bold 13px DejaVu Sans';
    ctx.textAlign = 'left';
    ctx.fillText('DINHEIRO EM MÃOS', startX + 25, cardY + 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px DejaVu Sans';
    ctx.fillText('CARTEIRA', startX + 25, cardY + 118);

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 22px DejaVu Sans';
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
    ctx.font = 'bold 13px DejaVu Sans';
    ctx.textAlign = 'left';
    ctx.fillText('PROTEGIDO NO COFRE', x2 + 25, cardY + 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px DejaVu Sans';
    ctx.fillText('BANCO CENTRAL', x2 + 25, cardY + 118);

    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 22px DejaVu Sans';
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
    ctx.font = 'bold 13px DejaVu Sans';
    ctx.textAlign = 'left';
    ctx.fillText('SOMA GERAL', x3 + 25, cardY + 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px DejaVu Sans';
    ctx.fillText('PATRIMÓNIO TOTAL', x3 + 25, cardY + 118);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 22px DejaVu Sans';
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
    ctx.font = '10px DejaVu Sans';
    ctx.textAlign = 'center';
    ctx.fillText('LIGA ATUAL', 620, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px DejaVu Sans';
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
    ctx.font = 'bold 36px DejaVu Sans';
    const username = member.displayName || member.username || 'Jogador';
    ctx.fillText(username.slice(0, 20), 270, 170);

    ctx.fillStyle = selectedColor;
    ctx.font = 'bold 20px DejaVu Sans';
    ctx.fillText(`RANK #${rankPosition} •${stats.points} PTS`, 270, 210);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '11px DejaVu Sans';
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
    ctx.font = '11px DejaVu Sans';
    ctx.textAlign = 'left';
    ctx.fillText('VITÓRIAS', 290, boxY + 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px DejaVu Sans';
    ctx.fillText(stats.wins || 0, 290, boxY + 75);

    // Empates
    ctx.fillStyle = 'rgba(30, 31, 34, 0.9)';
    roundRect(ctx, 438, boxY, boxWidth, boxHeight, 12, true, false);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(438, boxY, 4, boxHeight);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '11px DejaVu Sans';
    ctx.textAlign = 'left';
    ctx.fillText('EMPATES', 458, boxY + 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px DejaVu Sans';
    ctx.fillText(stats.draws || 0, 458, boxY + 75);

    // Derrotas
    ctx.fillStyle = 'rgba(30, 31, 34, 0.9)';
    roundRect(ctx, 606, boxY, boxWidth, boxHeight, 12, true, false);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(606, boxY, 4, boxHeight);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '11px DejaVu Sans';
    ctx.textAlign = 'left';
    ctx.fillText('DERROTAS', 626, boxY + 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px DejaVu Sans';
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
    ctx.font = 'bold 32px DejaVu Sans';
    ctx.textAlign = 'center';
    ctx.fillText('TABELA 1V1', W / 2, 45);

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 250, 60, 300, 35, 8, false, true);
    ctx.fillStyle = '#888888';
    ctx.font = '9px DejaVu Sans';
    ctx.fillText('LIGA ATUAL', W / 2, 75);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px DejaVu Sans';
    ctx.fillText((dbSettings.ligaNome || '').toUpperCase(), W / 2, 88);

    if (current.length === 0) {
        ctx.fillStyle = '#888888';
        ctx.font = '20px DejaVu Sans';
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
        ctx.font = 'bold 20px DejaVu Sans';
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
        ctx.font = 'bold 18px DejaVu Sans';
        ctx.fillText((p.username || 'Jogador').slice(0, 18), 185, startY + 36);

        const total = (p.wins || 0) + (p.losses || 0) + (p.draws || 0);
        const wr = total > 0 ? ((p.wins / total) * 100).toFixed(1) : '0.0';
        ctx.fillStyle = '#2ecc71';
        ctx.font = '12px DejaVu Sans';
        ctx.fillText(`TAXA DE VITÓRIA: ${wr}%`, 480, startY + 36);

        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 24px DejaVu Sans';
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
        .setTitle(`<a:brasil:1554216254187765960>  Tabela de Classificação${ligaTitulo}`)
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
    ctx.font = 'bold 28px DejaVu Sans';
    ctx.textAlign = 'center';
    ctx.fillText((dbSettings.tabelaNome || 'CIDADE - RANKING').toUpperCase(), W / 2, 45);

    ctx.fillStyle = selectedColor;
    ctx.font = 'bold 12px DejaVu Sans';
    ctx.fillText(`EXIBINDO DO 1 AO 10 (BANCO)`, W / 2, 75);

    if (current.length === 0) {
        ctx.fillStyle = '#888888';
        ctx.font = '18px DejaVu Sans';
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
        ctx.font = 'bold 18px DejaVu Sans';
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
        ctx.font = 'bold 16px DejaVu Sans';
        ctx.fillText((p.username || 'Cidadão').slice(0, 20), 175, startY + 34);

        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 18px DejaVu Sans';
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
        new SlashCommandBuilder()
            .setName('tabela')
            .setDescription('Mostra a tabela de classificação 1v1 em imagem')
            .addStringOption(option => option.setName('modo').setDescription('Modo').setRequired(true).addChoices({ name: '1v1', value: '1v1' })),
        new SlashCommandBuilder()
            .setName('desafiar')
            .setDescription('Cria um desafio 1v1 com seleção de mapa')
            .addStringOption(option => option.setName('modo').setDescription('Modo').setRequired(true).addChoices({ name: '1v1', value: '1v1' }))
            .addUserOption(option => option.setName('adversario').setDescription('Deixe vazio para aleatório').setRequired(false)),
        new SlashCommandBuilder()
            .setName('analise')
            .setDescription('Mostra o painel de análise detalhado de um membro')
            .addStringOption(option => option.setName('modo').setDescription('Modo').setRequired(true).addChoices({ name: '1v1', value: '1v1' }))
            .addUserOption(option => option.setName('utilizador').setDescription('Membro a analisar (opcional)').setRequired(false)),
        new SlashCommandBuilder()
            .setName('painel')
            .setDescription('Painel de controlo administrativo (1v1, Cidade ou Ticket)')
            .addSubcommand(sub => sub.setName('cidade').setDescription('Abre o painel administrativo da cidade'))
            .addSubcommand(sub => 
                sub.setName('ticket')
                   .setDescription('Abre o painel administrativo de tickets')
                   .addAttachmentOption(option => option.setName('banner').setDescription('Anexe uma imagem para ser o banner do ticket (Opcional)').setRequired(false))
            )
            .setDMPermission(false),
        new SlashCommandBuilder()
            .setName('reset')
            .setDescription('Reseta a tabela e dados de 1v1 (Apenas Admins)')
            .addStringOption(option => option.setName('modo').setDescription('Modo').setRequired(true).addChoices({ name: '1v1', value: '1v1' })),

        new SlashCommandBuilder()
            .setName('tabelacidade')
            .setDescription('Mostra a tabela de classificação da cidade'),
        new SlashCommandBuilder()
            .setName('work')
            .setDescription('Trabalha para ganhar moedas (Flee the Facility)'),
        new SlashCommandBuilder()
            .setName('job')
            .setDescription('Realiza um trabalho comum na cidade'),
        new SlashCommandBuilder()
            .setName('slut')
            .setDescription('Tenta arriscar a sorte para faturar moedas'),
        new SlashCommandBuilder()
            .setName('daily')
            .setDescription('Resgata sua recompensa diária de moedas'),
        new SlashCommandBuilder()
            .setName('moneyinfo')
            .setDescription('Mostra o saldo na carteira, banco e informações financeiras em imagem detalhada')
            .addUserOption(option => option.setName('usuario').setDescription('Ver informações de outro cidadão').setRequired(false)),
        new SlashCommandBuilder()
            .setName('dep')
            .setDescription('Deposita moedas no banco')
            .addStringOption(option => option.setName('quantidade').setDescription('Quantidade numérica ou "all"').setRequired(true)),
        new SlashCommandBuilder()
            .setName('rob')
            .setDescription('Tenta roubar moedas de outro cidadão')
            .addUserOption(option => option.setName('usuario').setDescription('Cidadão a ser roubado').setRequired(true)),
        new SlashCommandBuilder()
            .setName('pay')
            .setDescription('Transfere moedas para outro cidadão')
            .addUserOption(option => option.setName('user').setDescription('Utilizador para quem vai enviar as moedas').setRequired(true))
            .addStringOption(option => option.setName('quantidade').setDescription('Quantidade numérica ou "all"').setRequired(true))
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Todos os comandos registados com sucesso!');
    } catch (error) {
        console.error('Erro ao registar comandos:', error);
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
                return await interaction.editReply({ content: '⚠ Ainda não existem jogadores com pontuação positiva na tabela 1v1 deste servidor!' });
            }
            try {
                const payload = await buildTabelaMessage(players, 0, guildData.settings);
                return await interaction.editReply(payload);
            } catch (err) {
                console.error('Erro ao gerar imagem da tabela:', err);
                return await interaction.editReply({ content: '❌ Erro ao gerar a imagem da tabela.' });
            }
        }

        if (commandName === 'desafiar') {
            const adversario = interaction.options.getUser('adversario');
            if (adversario && adversario.id === interaction.user.id) {
                return await interaction.reply({ content: '❌ Não podes desafiar a ti próprio!', ephemeral: true });
            }
            if (adversario && adversario.bot) {
                return await interaction.reply({ content: '❌ Não podes desafiar um bot!', ephemeral: true });
            }

            const titleStatus = adversario 
                ? `<a:carregando:1554216030128177152> AGUARDANDO ${adversario.username.toUpperCase()} ACEITAR DESAFIO` 
                : `<a:carregando:1554216030128177152> AGUARDANDO ALGUM MEMBRO ACEITAR`;

            const embed = new EmbedBuilder()
                .setTitle(titleStatus)
                .setDescription('Seleciona o mapa desejado no menu abaixo para publicar o desafio!')
                .setColor(0xFF4500)
                .setThumbnail(interaction.user.displayAvatarURL({ extension: 'png' }))
                .addFields(
                    { name: '<:caveira:1554217228671516837> Desafiante', value: `${interaction.user}`, inline: true },
                    { name: '<:imprevisivel:1554217366823633048> Adversário', value: adversario ? `${adversario}` : '`Aberto a qualquer um`', inline: true },
                    { name: '<:analise:1554217532435595505> Regras', value: '• Vitória: **+32 pts** | Derrota: **-32 pts** | Empate: **+10 pts**', inline: false }
                );

            const mapSelect = new StringSelectMenuBuilder()
                .setCustomId(`escolher_mapa_${interaction.user.id}_${adversario ? adversario.id : 'aleatorio'}`)
                .setPlaceholder('🗺️ Selecione o mapa do confronto...')
                .addOptions([
                    { label: 'Homestead', value: 'Homestead' },
                    { label: 'Airport', value: 'Airport' },
                    { label: 'Facility', value: 'Facility' },
                    { label: 'Abandoned Prison', value: 'Abandoned Prison' },
                    { label: 'Arcade', value: 'Arcade' },
                    { label: 'Abandoned Facility', value: 'Abandoned Facility' }
                ]);

            const row = new ActionRowBuilder().addComponents(mapSelect);
            return await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
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
                    .setTitle(`<:trofeu:1554216098319044621> Perfil de Desempenho - ${targetUser.username}`)
                    .setColor(COLOR_MAP[guildData.settings.ligaCor] || 0xE74C3C)
                    .setImage(`attachment://analise_${targetUser.username}.png`)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch (err) {
                console.error('Erro ao gerar imagem de análise:', err);
                return await interaction.editReply({ content: '❌ Erro ao gerar o painel de análise.' });
            }
        }

        if (commandName === 'painel') {
            const sub = interaction.options.getSubcommand(false);
            
            if (sub === 'cidade') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return await interaction.reply({ content: '❌ Apenas membros com permissão de **Moderação** ou **Administrador** podem aceder ao painel da cidade!', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle('🏙️ Painel Administrativo - Cidade')
                    .setDescription(
                        `Gerencie as configurações da cidade neste servidor.\n\n` +
                        `📌 **Título da Tabela:** \`${cidadeGuildData.settings.tabelaNome}\`\n` +
                        `🎨 **Cor Temática:** \`${cidadeGuildData.settings.tabelaCor}\``
                    )
                    .setColor(COLOR_MAP[cidadeGuildData.settings.tabelaCor] || 0xF1C40F)
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('cidade_mudar_titulo').setLabel('Mudar Título').setStyle(ButtonStyle.Primary).setEmoji('✏️️'),
                    new ButtonBuilder().setCustomId('cidade_mudar_cor').setLabel('Mudar Cor').setStyle(ButtonStyle.Secondary).setEmoji('🎨'),
                    new ButtonBuilder().setCustomId('cidade_add_remover').setLabel('Adicionar/Remover Moedas').setStyle(ButtonStyle.Success).setEmoji('🪙'),
                    new ButtonBuilder().setCustomId('cidade_resetar').setLabel('Resetar Cidade').setStyle(ButtonStyle.Danger).setEmoji('🚨')
                );

                return await interaction.reply({ embeds: [embed], components: [row] });
            }

            if (sub === 'ticket') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return await interaction.reply({ content: '❌ Apenas administradores ou moderadores podem aceder ao painel de tickets!', ephemeral: true });
                }

                const bannerAttachment = interaction.options.getAttachment('banner');
                if (bannerAttachment) {
                    ticketGuildData.config.bannerUrl = bannerAttachment.url;
                    saveTicketDB(ticketDb);
                }

                const cfg = ticketGuildData.config;
                const staffRoleText = cfg.cargoStaff ? `<@&${cfg.cargoStaff}>` : '`Não definido`';
                const channelText = cfg.canalEnvio ? `<#${cfg.canalEnvio}>` : '`Não definido`';

                const embed = new EmbedBuilder()
                    .setTitle('<:slaa:1554584672741359616> Painel Administrativo - Sistema de Tickets')
                    .setDescription(
                        `Configure e envie o painel de atendimento em embed para o servidor.\n\n` +
                        `<:sla:1554222927476691064> **Título Atual:** \`${cfg.titulo}\`\n` +
                        `<:analise:1554217532435595505> **Descrição:** \`${cfg.descricao}\`\n` +
                        `<:slaa:1554584672741359616> **Cargo da Staff:** ${staffRoleText}\n` +
                        `<a:verificado:1554216178111610932> **Canal de Envio:** ${channelText}\n` +
                        `<:anexo:1554583319650377750> **Banner Anexado:** \`${cfg.bannerUrl ? 'Sim' : 'Não'}\`\n` +
                        `<:engrenagem:1554223036948021249> **Opções do Menu:** \`${cfg.opcoes.length} categorias cadastradas\``
                    )
                    .setColor(0x3498DB)
                    .setTimestamp();

                if (cfg.bannerUrl) {
                    embed.setImage(cfg.bannerUrl);
                }

                const row1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_cfg_texto').setLabel('Editar Textos').setStyle(ButtonStyle.Primary).setEmoji('✏️'),
                    new ButtonBuilder().setCustomId('ticket_cfg_cargo').setLabel('Definir Cargo Staff').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
                    new ButtonBuilder().setCustomId('ticket_cfg_canal').setLabel('Definir Canal').setStyle(ButtonStyle.Secondary).setEmoji('📢')
                );

                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_cfg_add_opcao').setLabel('Adicionar Opção').setStyle(ButtonStyle.Success).setEmoji('➕'),
                    new ButtonBuilder().setCustomId('ticket_cfg_del_opcao').setLabel('Remover Opção').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
                    new ButtonBuilder().setCustomId('ticket_enviar_painel').setLabel('Enviar Painel Embed').setStyle(ButtonStyle.Success).setEmoji('🚀')
                );

                return await interaction.reply({ embeds: [embed], components: [row1, row2] });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({ content: '❌ Apenas membros com permissão de **Moderação** ou **Administrador** podem aceder a este painel!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('<:moderao:1545806399169101854> Painel de Controle Administrativo - 1v1')
                .setDescription(
                    `Gerencie as configurações da liga neste servidor.\n\n` +
                    `<:trofeu:1554216098319044621> **Liga Atual:** \`${guildData.settings.ligaNome || 'Não configurado'}\`\n` +
                    `<:custo:1554216373285163100> **Cor Temática:** \`${guildData.settings.ligaCor}\`\n` +
                    `<:engrenagem:1554223036948021249> **Cargo de Ping (Desafiar):** ${guildData.settings.cargoProcurando ? `<@&${guildData.settings.cargoProcurando}>` : '`Nenhum`'}\n` +
                    `<:tro:1554226308224131184> **Cargo Top 1:** ${guildData.settings.cargoTop1 ? `<@&${guildData.settings.cargoTop1}>` : '`Nenhum`'}\n` +
                    `<:tro2:1554226635908321293> **Cargo Top 2:** ${guildData.settings.cargoTop2 ? `<@&${guildData.settings.cargoTop2}>` : '`Nenhum`'}\n` +
                    `<:tro3:1554226883183247371> **Cargo Top 3:** ${guildData.settings.cargoTop3 ? `<@&${guildData.settings.cargoTop3}>` : '`Nenhum`'}`
                )
                .setColor(COLOR_MAP[guildData.settings.ligaCor] || 0xE74C3C)
                .setTimestamp();

            const rowButtons1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('painel_mudar_titulo').setLabel('Mudar Título').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('painel_mudar_cor').setLabel('Mudar Cor').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('painel_config_cargos').setLabel('Configurar Cargos').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('painel_nova_liga').setLabel('Nova Liga (Reset)').setStyle(ButtonStyle.Danger)
            );

            return await interaction.reply({ embeds: [embed], components: [rowButtons1] });
        }

        if (commandName === 'reset') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({ content: '❌ Apenas administradores podem usar este comando!', ephemeral: true });
            }
            guildData.players = {};
            saveDB(db);
            return await interaction.reply({ content: '🔄 A tabela e os dados de 1v1 foram resetados com sucesso neste servidor!', ephemeral: true });
        }

        // --- COMANDOS CIDADE / ECONOMIA ---
        if (commandName === 'tabelacidade') {
            await interaction.deferReply();
            const players = await getRankedCidadePlayers(cidadeGuildData.users, client);
            try {
                const payload = await buildCidadeTabelaMessage(players, 0, cidadeGuildData.settings, client);
                return await interaction.editReply(payload);
            } catch (err) {
                console.error('Erro ao gerar tabela da cidade:', err);
                return await interaction.editReply({ content: '❌ Erro ao gerar a tabela da cidade.' });
            }
        }

        if (commandName === 'work') {
            const userId = interaction.user.id;
            const guildId = interaction.guildId;
            const cooldownKey = `${guildId}_${userId}`;
            const now = Date.now();
            const cooldownTime = 10 * 60 * 1000;

            if (cidadeCooldowns.work.has(cooldownKey)) {
                const expiration = cidadeCooldowns.work.get(cooldownKey) + cooldownTime;
                if (now < expiration) {
                    const timeLeft = Math.ceil((expiration - now) / 1000);
                    const mins = Math.floor(timeLeft / 60);
                    const secs = timeLeft % 60;
                    return await interaction.reply({ content: `⏱️ Estás cansado! Aguarda **${mins}m${secs}s** para trabalhar novamente.`, ephemeral: true });
                }
            }

            cidadeCooldowns.work.set(cooldownKey, now);
            const coins = Math.floor(Math.random() * (7000 - 1000 + 1)) + 1000;
            const userObj = ensureCidadeUser(userId);
            userObj.wallet += coins;
            saveCidadeDB(cidadeDb);

            const workMessages = [
                `matou um top br e ganhou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `hackeou os computadores de Facility e recolheu <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `escapou da Besta no mapa Airport e faturou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `resgatou um companheiro na cadeira em Homestead e ganhou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `ganhou um 1v1 épico na prisão abandonada e obteve <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `encontrou uma saída secreta no mapa Arcade e recolheu <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `conseguiu atordoar a Besta com o martelo e ganhou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `consertou todos os computadores sozinho em Abandoned Facility e faturou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `venceu a rodada como sobrevivente mestre e obteve <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `completou a missão noturna no mapa Facility e ganhou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`
            ];

            const randomMsg = workMessages[Math.floor(Math.random() * workMessages.length)];
            const embed = new EmbedBuilder()
                .setTitle('<:wallet:1554579680219373611> Trabalho - Flee the Facility')
                .setDescription(`<:profile:1554579406088044608> <@${userId}>${randomMsg}! (Dinheiro foi para a carteira <:moeda:1554577755121917994>)`)
                .setColor(0x2ECC71);

            return await interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'job') {
            const userId = interaction.user.id;
            const guildId = interaction.guildId;
            const cooldownKey = `${guildId}_${userId}`;
            const now = Date.now();
            const cooldownTime = 10 * 60 * 1000;

            if (cidadeCooldowns.job.has(cooldownKey)) {
                const expiration = cidadeCooldowns.job.get(cooldownKey) + cooldownTime;
                if (now < expiration) {
                    const timeLeft = Math.ceil((expiration - now) / 1000);
                    const mins = Math.floor(timeLeft / 60);
                    const secs = timeLeft % 60;
                    return await interaction.reply({ content: `⏱️ Já trabalhaste recentemente! Descansa mais **${mins}m${secs}s**.`, ephemeral: true });
                }
            }

            cidadeCooldowns.job.set(cooldownKey, now);
            const coins = Math.floor(Math.random() * (7000 - 1000 + 1)) + 1000;
            const userObj = ensureCidadeUser(userId);
            userObj.wallet += coins;
            saveCidadeDB(cidadeDb);

            const jobMessages = [
                `trabalhou atendendo pacientes no hospital e ganhou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `entregou encomendas urgentes pela cidade e ganhou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `trabalhou como segurança noturno no banco central e recebeu <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `consertou encanamentos na prefeitura e faturou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `trabalhou como chef num restaurante famoso e ganhou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `deu aulas particulares de programação e recebeu <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `trabalhou na oficina mecânica consertando carros e faturou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `organizou o estoque do supermercado local e ganhou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `trabalhou como motorista de aplicativo e acumulou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`,
                `pintou murais artísticos nas ruas da cidade e faturou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas`
            ];

            const randomMsg = jobMessages[Math.floor(Math.random() * jobMessages.length)];
            const embed = new EmbedBuilder()
                .setTitle('<:slaa:1554584672741359616> Emprego Diário')
                .setDescription(`<:profile:1554579406088044608> <@${userId}>${randomMsg}! (Dinheiro foi para a carteira <:moeda:1554577755121917994>)`)
                .setColor(0x3498DB);

            return await interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'slut') {
            const userId = interaction.user.id;
            const guildId = interaction.guildId;
            const cooldownKey = `${guildId}_${userId}`;
            const now = Date.now();
            const cooldownTime = 10 * 60 * 1000;

            if (cidadeCooldowns.slut.has(cooldownKey)) {
                const expiration = cidadeCooldowns.slut.get(cooldownKey) + cooldownTime;
                if (now < expiration) {
                    const timeLeft = Math.ceil((expiration - now) / 1000);
                    const mins = Math.floor(timeLeft / 60);
                    const secs = timeLeft % 60;
                    return await interaction.reply({ content: `⏱️ Calma aí! Podes tentar arriscar novamente em **${mins}m${secs}s**.`, ephemeral: true });
                }
            }

            cidadeCooldowns.slut.set(cooldownKey, now);
            const userObj = ensureCidadeUser(userId);
            const success = Math.random() < 0.5;

            if (success) {
                const coins = Math.floor(Math.random() * (6000 - 1500 + 1)) + 1500;
                userObj.wallet += coins;
                saveCidadeDB(cidadeDb);
                const embed = new EmbedBuilder()
                    .setTitle('🎰 Arriscar a Sorte')
                    .setDescription(`🎉 Deu bom! <@${userId}> arriscou nos becos escuros e faturou <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas para a carteira!`)
                    .setColor(0x2ECC71);
                return await interaction.reply({ embeds: [embed] });
            } else {
                const loss = Math.floor(Math.random() * (3000 - 500 + 1)) + 500;
                userObj.wallet = Math.max(0, userObj.wallet - loss);
                saveCidadeDB(cidadeDb);
                const embed = new EmbedBuilder()
                    .setTitle('🎰 Arriscar a Sorte')
                    .setDescription(`💸 Deu ruim! <@${userId}> foi pego pela polícia ou caiu numa armadilha e perdeu <:moeda:1554577755121917994> **${loss.toLocaleString()}** moedas da carteira!`)
                    .setColor(0xE74C3C);
                return await interaction.reply({ embeds: [embed] });
            }
        }

        if (commandName === 'daily') {
            const userId = interaction.user.id;
            const guildId = interaction.guildId;
            const cooldownKey = `${guildId}_${userId}`;
            const now = Date.now();
            const cooldownTime = 24 * 60 * 60 * 1000;

            if (cidadeCooldowns.daily.has(cooldownKey)) {
                const expiration = cidadeCooldowns.daily.get(cooldownKey) + cooldownTime;
                if (now < expiration) {
                    const timeLeft = Math.ceil((expiration - now) / 1000);
                    const hours = Math.floor(timeLeft / 3600);
                    const mins = Math.floor((timeLeft % 3600) / 60);
                    return await interaction.reply({ content: `🎁 Já resgataste o teu prêmio diário! Volta daqui a **${hours}h${mins}m**.`, ephemeral: true });
                }
            }

            const coins = Math.floor(Math.random() * (25000 - 5000 + 1)) + 5000;

            const embed = new EmbedBuilder()
                .setTitle('🎁 Recompensa Diária')
                .setDescription(`Clica no botão abaixo para resgatar o teu prêmio diário aleatório de <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas!`)
                .setColor(0xF1C40F);

            const btnResgatar = new ButtonBuilder()
                .setCustomId(`resgatar_daily_${userId}_${coins}`)
                .setLabel('Resgatar Daily')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(btnResgatar);
            return await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
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
                    .setTitle(`<:estati:1554577205332283473> Informações Financeiras - ${targetUser.username}`)
                    .setColor(COLOR_MAP[cidadeGuildData.settings.tabelaCor] || 0xF1C40F)
                    .setImage(`attachment://moneyinfo_${targetUser.username}.png`)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch (err) {
                console.error('Erro ao gerar imagem moneyinfo:', err);
                return await interaction.editReply({ content: '❌ Erro ao gerar a imagem de informações financeiras.' });
            }
        }

        if (commandName === 'dep') {
            const userId = interaction.user.id;
            const userObj = ensureCidadeUser(userId);
            const arg = interaction.options.getString('quantidade').toLowerCase();

            if (userObj.wallet <= 0) {
                return await interaction.reply({ content: '❌ Não tens moedas na carteira para depositar!', ephemeral: true });
            }

            let amountToDep = 0;
            if (arg === 'all') {
                amountToDep = userObj.wallet;
            } else {
                const parsed = parseInt(arg, 10);
                if (isNaN(parsed) || parsed <= 0) {
                    return await interaction.reply({ content: '❌ Insere um valor numérico válido ou "all".', ephemeral: true });
                }
                amountToDep = Math.min(parsed, userObj.wallet);
            }

            userObj.wallet -= amountToDep;
            userObj.bank += amountToDep;
            saveCidadeDB(cidadeDb);

            const embed = new EmbedBuilder()
                .setTitle('<a:verificado:1554216178111610932> Depósito Realizado')
                .setDescription(`Depositaste com sucesso <:moeda:1554577755121917994> **${amountToDep.toLocaleString()}** moedas no banco! Agora estão seguras contra roubos.`)
                .setColor(0x2ECC71);

            return await interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'rob') {
            const robberId = interaction.user.id;
            const targetUser = interaction.options.getUser('usuario');

            if (targetUser.id === robberId) {
                return await interaction.reply({ content: '❌ Não podes roubar a ti próprio!', ephemeral: true });
            }
            if (targetUser.bot) {
                return await interaction.reply({ content: '❌ Não podes roubar um bot!', ephemeral: true });
            }

            const robberObj = ensureCidadeUser(robberId);
            const targetObj = ensureCidadeUser(targetUser.id);

            if (targetObj.wallet <= 0) {
                return await interaction.reply({ content: `❌ **${targetUser.username}** não tem dinheiro na carteira para ser roubado!`, ephemeral: true });
            }

            const success = Math.random() < 0.30;

            if (success) {
                const stolenAmount = Math.floor(targetObj.wallet * (Math.random() * 0.30 + 0.10));
                targetObj.wallet -= stolenAmount;
                robberObj.wallet += stolenAmount;
                saveCidadeDB(cidadeDb);

                const embed = new EmbedBuilder()
                    .setTitle('🥷 Assalto Bem-Sucedido!')
                    .setDescription(`Fizeste uma operação limpa! Roubaste <:moeda:1554577755121917994> **${stolenAmount.toLocaleString()}** moedas da carteira de **${targetUser.username}**!`)
                    .setColor(0x2ECC71);
                return await interaction.reply({ embeds: [embed] });
            } else {
                const totalRobberMoney = robberObj.wallet + robberObj.bank;
                const penalty = Math.floor(totalRobberMoney * 0.30);

                if (penalty > 0) {
                    if (robberObj.wallet >= penalty) {
                        robberObj.wallet -= penalty;
                    } else {
                        const remainder = penalty - robberObj.wallet;
                        robberObj.wallet = 0;
                        robberObj.bank = Math.max(0, robberObj.bank - remainder);
                    }
                    targetObj.wallet += penalty;
                    saveCidadeDB(cidadeDb);
                }

                const embed = new EmbedBuilder()
                    .setTitle('🚨 Assalto Fracassado!')
                    .setDescription(`Foste pego em flagrante tentando roubar **${targetUser.username}**! Tiveste de pagar uma penalidade de **30%** do teu dinheiro (<:moeda:1554577755121917994> **${penalty.toLocaleString()}** moedas), que foi direto para a vítima!`)
                    .setColor(0xE74C3C);
                return await interaction.reply({ embeds: [embed] });
            }
        }

        if (commandName === 'pay') {
            const senderId = interaction.user.id;
            const targetUser = interaction.options.getUser('user');
            const arg = interaction.options.getString('quantidade').toLowerCase();

            if (targetUser.id === senderId) {
                return await interaction.reply({ content: '❌ Não podes transferir moedas para ti próprio!', ephemeral: true });
            }
            if (targetUser.bot) {
                return await interaction.reply({ content: '❌ Não podes transferir moedas para um bot!', ephemeral: true });
            }

            const senderObj = ensureCidadeUser(senderId);
            const targetObj = ensureCidadeUser(targetUser.id);

            const totalSenderMoney = (senderObj.wallet || 0) + (senderObj.bank || 0);
            if (totalSenderMoney <= 0) {
                return await interaction.reply({ content: '❌ Não tens saldo disponível (nem na carteira, nem no banco) para realizar uma transferência!', ephemeral: true });
            }

            let amountToPay = 0;
            if (arg === 'all') {
                amountToPay = totalSenderMoney;
            } else {
                const parsed = parseInt(arg, 10);
                if (isNaN(parsed) || parsed <= 0) {
                    return await interaction.reply({ content: '❌ Insere um valor numérico válido ou "all".', ephemeral: true });
                }
                amountToPay = parsed;
            }

            if (amountToPay > totalSenderMoney) {
                return await interaction.reply({ content: `❌ Não tens saldo suficiente! O teu património total é de <:moeda:1554577755121917994> **${totalSenderMoney.toLocaleString()}** moedas.`, ephemeral: true });
            }

            let takenFromWallet = 0;
            let takenFromBank = 0;

            if (senderObj.wallet >= amountToPay) {
                senderObj.wallet -= amountToPay;
                takenFromWallet = amountToPay;
            } else {
                takenFromWallet = senderObj.wallet;
                senderObj.wallet = 0;
                takenFromBank = amountToPay - takenFromWallet;
                senderObj.bank -= takenFromBank;
            }

            targetObj.wallet = (targetObj.wallet || 0) + amountToPay;
            saveCidadeDB(cidadeDb);

            const embed = new EmbedBuilder()
                .setTitle('💸 Transferência Concluída')
                .setDescription(`<a:verificado:1554216178111610932> **${interaction.user.username}** enviou com sucesso <:moeda:1554577755121917994> **${amountToPay.toLocaleString()}** moedas para **${targetUser.username}**!`)
                .addFields(
                    { name: '<:wallet:1554579680219373611> Retirado da Carteira', value: `<:moeda:1554577755121917994> ${takenFromWallet.toLocaleString()} moedas`, inline: true },
                    { name: '🏦 Retirado do Banco', value: `<:moeda:1554577755121917994> ${takenFromBank.toLocaleString()} moedas`, inline: true }
                )
                .setColor(0x2ECC71)
                .setTimestamp();

            return await interaction.reply({ embeds: [embed] });
        }
    }

    // --- INTERAÇÕES DE BOTÕES, MENUS E MODAIS ---
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('resgatar_daily_')) {
            const parts = interaction.customId.split('_');
            const userId = parts[2];
            const coins = parseInt(parts[3], 10);
            const guildId = interaction.guildId;
            const cooldownKey = `${guildId}_${userId}`;

            if (interaction.user.id !== userId) {
                return await interaction.reply({ content: '❌ Este botão não é para ti!', ephemeral: true });
            }

            cidadeCooldowns.daily.set(cooldownKey, Date.now());
            const userObj = ensureCidadeUser(userId);
            userObj.wallet += coins;
            saveCidadeDB(cidadeDb);

            await interaction.update({
                content: `✅ Resgataste com sucesso a tua recompensa diária de <:moeda:1554577755121917994> **${coins.toLocaleString()}** moedas para a carteira!`,
                embeds: [],
                components: []
            });
            return;
        }

        if (interaction.customId.startsWith('cidade_prev_') || interaction.customId.startsWith('cidade_next_')) {
            await interaction.deferUpdate();
            const pageChange = interaction.customId.startsWith('cidade_next_') ? 1 : -1;
            const currentPage = parseInt(interaction.customId.split('_').pop(), 10);
            const newPage = currentPage + pageChange;

            const players = await getRankedCidadePlayers(cidadeGuildData.users, client);
            if (players.length === 0) {
                return await interaction.editReply({ content: '⚠️ A tabela da cidade está vazia.', embeds: [], files: [], components: [] });
            }

            try {
                const payload = await buildCidadeTabelaMessage(players, newPage, cidadeGuildData.settings, client);
                return await interaction.editReply(payload);
            } catch (err) {
                console.error('Erro ao paginar tabela cidade:', err);
                return await interaction.followUp({ content: '❌ Erro ao mudar de página.', ephemeral: true });
            }
        }

        if (interaction.customId.startsWith('cidade_')) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({ content: '❌ Não tens permissão para usar estes botões.', ephemeral: true });
            }

            if (interaction.customId === 'cidade_mudar_titulo') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_cidade_titulo')
                    .setTitle('Alterar Título da Tabela');

                const inputTitulo = new TextInputBuilder()
                    .setCustomId('input_novo_titulo')
                    .setLabel('Novo Título da Tabela')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: CIDADE - SEASON 2')
                    .setRequired(true)
                    .setMaxLength(50);

                modal.addComponents(new ActionRowBuilder().addComponents(inputTitulo));
                return await interaction.showModal(modal);
            }

            if (interaction.customId === 'cidade_mudar_cor') {
                const selectCor = new StringSelectMenuBuilder()
                    .setCustomId('select_cidade_cor')
                    .setPlaceholder('🎨 Selecione a cor temática...')
                    .addOptions([
                        { label: 'Lavanda', value: 'lavanda' },
                        { label: 'Azul', value: 'azul' },
                        { label: 'Dourado', value: 'dourado' },
                        { label: 'Verde', value: 'verde' },
                        { label: 'Cinza', value: 'cinza' },
                        { label: 'Branco', value: 'branco' },
                        { label: 'Rosa', value: 'rosa' },
                        { label: 'Amarelo', value: 'amarelo' },
                        { label: 'Ciano', value: 'ciano' }
                    ]);

                const row = new ActionRowBuilder().addComponents(selectCor);
                return await interaction.reply({ content: 'Selecione abaixo a nova cor de fundo/detalhe da tabela:', components: [row], ephemeral: true });
            }

            if (interaction.customId === 'cidade_add_remover') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_cidade_moedas')
                    .setTitle('Adicionar / Remover Moedas');

                const inputUser = new TextInputBuilder()
                    .setCustomId('input_user_id')
                    .setLabel('ID do Usuário')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 123456789012345678')
                    .setRequired(true);

                const inputQtd = new TextInputBuilder()
                    .setCustomId('input_qtd_moedas')
                    .setLabel('Quantidade (use negativo para remover)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 5000 ou -2000')
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(inputUser), new ActionRowBuilder().addComponents(inputQtd));
                return await interaction.showModal(modal);
            }

            if (interaction.customId === 'cidade_resetar') {
                cidadeGuildData.users = {};
                saveCidadeDB(cidadeDb);
                return await interaction.reply({ content: '🔄 Todos os saldos da cidade foram resetados com sucesso neste servidor!', ephemeral: true });
            }
        }

        // --- INTERAÇÕES DE PAINEL DE TICKETS ---
        if (interaction.customId.startsWith('ticket_cfg_') || interaction.customId === 'ticket_enviar_painel') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({ content: '❌ Não tens permissão para configurar os tickets.', ephemeral: true });
            }

            if (interaction.customId === 'ticket_cfg_texto') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_ticket_textos')
                    .setTitle('Configurar Textos do Painel');

                const inputTitulo = new TextInputBuilder()
                    .setCustomId('input_ticket_titulo')
                    .setLabel('Título do Painel')
                    .setStyle(TextInputStyle.Short)
                    .setValue(ticketGuildData.config.titulo)
                    .setRequired(true);

                const inputDesc = new TextInputBuilder()
                    .setCustomId('input_ticket_desc')
                    .setLabel('Descrição do Painel')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(ticketGuildData.config.descricao)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(inputTitulo), new ActionRowBuilder().addComponents(inputDesc));
                return await interaction.showModal(modal);
            }

            if (interaction.customId === 'ticket_cfg_cargo') {
                const selectRole = new RoleSelectMenuBuilder()
                    .setCustomId('select_ticket_cargo_staff')
                    .setPlaceholder('🛡️ Selecione o cargo da Staff...')
                    .setMinValues(1)
                    .setMaxValues(1);

                return await interaction.reply({ content: 'Selecione abaixo qual cargo terá acesso administrativo aos tickets criados:', components: [new ActionRowBuilder().addComponents(selectRole)], ephemeral: true });
            }

            if (interaction.customId === 'ticket_cfg_canal') {
                const selectChannel = new ChannelSelectMenuBuilder()
                    .setCustomId('select_ticket_canal_envio')
                    .setPlaceholder('📢 Selecione o canal onde o painel será enviado...')
                    .setChannelTypes([ChannelType.GuildText])
                    .setMinValues(1)
                    .setMaxValues(1);

                return await interaction.reply({ content: 'Selecione abaixo o canal de texto onde o bot publicará a embed do ticket:', components: [new ActionRowBuilder().addComponents(selectChannel)], ephemeral: true });
            }

            if (interaction.customId === 'ticket_cfg_add_opcao') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_ticket_add_opcao')
                    .setTitle('Adicionar Opção ao Menu');

                const labelInput = new TextInputBuilder()
                    .setCustomId('input_opcao_label')
                    .setLabel('Nome da Opção')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: Suporte a Doações')
                    .setRequired(true);

                const descInput = new TextInputBuilder()
                    .setCustomId('input_opcao_desc')
                    .setLabel('Descrição curta')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: Tire dúvidas sobre doações')
                    .setRequired(true);

                const emojiInput = new TextInputBuilder()
                    .setCustomId('input_opcao_emoji')
                    .setLabel('Emoji (Opcional)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 💎')
                    .setRequired(false);

                modal.addComponents(new ActionRowBuilder().addComponents(labelInput), new ActionRowBuilder().addComponents(descInput), new ActionRowBuilder().addComponents(emojiInput));
                return await interaction.showModal(modal);
            }

            if (interaction.customId === 'ticket_cfg_del_opcao') {
                if (ticketGuildData.config.opcoes.length === 0) {
                    return await interaction.reply({ content: '❌ Não existem opções cadastradas para remover.', ephemeral: true });
                }

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select_ticket_del_opcao')
                    .setPlaceholder('🗑️ Selecione a opção a remover...')
                    .addOptions(ticketGuildData.config.opcoes.map(o => ({ label: o.label, value: o.value, description: o.description })));

                return await interaction.reply({ content: 'Selecione qual categoria do menu de seleção deseja apagar:', components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
            }

            if (interaction.customId === 'ticket_enviar_painel') {
                const cfg = ticketGuildData.config;
                if (!cfg.canalEnvio) {
                    return await interaction.reply({ content: '❌ Define primeiro o **canal de envio** do painel!', ephemeral: true });
                }

                const channel = await interaction.guild.channels.fetch(cfg.canalEnvio).catch(() => null);
                if (!channel) {
                    return await interaction.reply({ content: '❌ O canal configurado não foi encontrado.', ephemeral: true });
                }

                const embedPanel = new EmbedBuilder()
                    .setTitle(cfg.titulo)
                    .setDescription(cfg.descricao)
                    .setColor(0x3498DB)
                    .setTimestamp();

                if (cfg.bannerUrl) {
                    embedPanel.setImage(cfg.bannerUrl);
                }

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('abrir_ticket_select')
                    .setPlaceholder('Abrir Ticket')
                    .addOptions(cfg.opcoes.map(o => ({
                        label: o.label,
                        value: o.value,
                        description: o.desc || o.description || 'Atendimento especializado',
                        emoji: o.emoji || '🎫'
                    })));

                const row = new ActionRowBuilder().addComponents(selectMenu);

                await channel.send({ embeds: [embedPanel], components: [row] });
                return await interaction.reply({ content: `✅ Painel em Embed de tickets enviado com sucesso para <#${cfg.canalEnvio}>!` });
            }
        }

        // --- BOTÕES DENTRO DOS TICKETS ABERTOS ---
        if (['ticket_fechar', 'ticket_reivindicar', 'ticket_transcript', 'ticket_excluir'].includes(interaction.customId)) {
            const ticketId = interaction.channelId;
            const ticketObj = ticketGuildData.ticketsAtivos[ticketId];

            if (!ticketObj) {
                return await interaction.reply({ content: '❌ Este canal não está registado como um ticket ativo válido.', ephemeral: true });
            }

            const staffRoleId = ticketGuildData.config.cargoStaff;
            const isStaff = staffRoleId && interaction.member.roles.cache.has(staffRoleId);
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            const isOwner = interaction.user.id === ticketObj.userId;

            if (interaction.customId === 'ticket_fechar') {
                if (!isStaff && !isAdmin && !isOwner) {
                    return await interaction.reply({ content: '❌ Não tens permissão para fechar este ticket!', ephemeral: true });
                }

                await interaction.reply({ content: '🔒 Ticket fechado! A eliminar canal em 5 segundos...' });
                delete ticketGuildData.ticketsAtivos[ticketId];
                saveTicketDB(ticketDb);

                setTimeout(async () => {
                    await interaction.channel.delete().catch(() => {});
                }, 5000);
                return;
            }

            if (interaction.customId === 'ticket_reivindicar') {
                if (!isStaff && !isAdmin) {
                    return await interaction.reply({ content: '❌ Apenas membros da Staff podem reivindicar tickets!', ephemeral: true });
                }

                ticketObj.claimedBy = interaction.user.id;
                saveTicketDB(ticketDb);

                const embedClaim = new EmbedBuilder()
                    .setTitle('🛡️ Ticket Reivindicado')
                    .setDescription(`Este atendimento foi assumido por ${interaction.user}.`)
                    .setColor(0x2ECC71);

                return await interaction.reply({ embeds: [embedClaim] });
            }

            if (interaction.customId === 'ticket_transcript') {
                if (!isStaff && !isAdmin) {
                    return await interaction.reply({ content: '❌ Apenas membros da Staff podem gerar transcripts!', ephemeral: true });
                }

                await interaction.deferReply({ ephemeral: true });
                try {
                    const messages = await interaction.channel.messages.fetch({ limit: 100 });
                    const sorted = Array.from(messages.values()).reverse();
                    let textLog = `=== TRANSCRIPT DO TICKET: ${interaction.channel.name} ===\n\n`;
                    for (const m of sorted) {
                        textLog += `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}:${m.content}\n`;
                    }

                    const buffer = Buffer.from(textLog, 'utf-8');
                    const attachment = new AttachmentBuilder(buffer, { name: `transcript-${interaction.channel.name}.txt` });

                    return await interaction.editReply({ content: '📄 Transcript gerado com sucesso:', files: [attachment] });
                } catch (e) {
                    return await interaction.editReply({ content: '❌ Erro ao gerar o transcript.' });
                }
            }

            if (interaction.customId === 'ticket_excluir') {
                if (!isStaff && !isAdmin) {
                    return await interaction.reply({ content: '❌ Apenas membros da Staff podem excluir tickets instantaneamente!', ephemeral: true });
                }

                await interaction.reply({ content: '🗑️ A apagar ticket imediatamente...' });
                delete ticketGuildData.ticketsAtivos[ticketId];
                saveTicketDB(ticketDb);
                setTimeout(async () => { await interaction.channel.delete().catch(() => {}); }, 2000);
                return;
            }
        }
    }

    // --- SELEÇÃO DO MENU DE TICKETS (CRIAR TICKET) ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'abrir_ticket_select') {
        await interaction.deferReply({ ephemeral: true });
        const selectedValue = interaction.values[0];
        const cfg = ticketGuildData.config;
        const guild = interaction.guild;

        let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === 'tickets abertos');
        if (!category) {
            try {
                category = await guild.channels.create({
                    name: 'TICKETS ABERTOS',
                    type: ChannelType.GuildCategory
                });
            } catch (e) {
                return await interaction.editReply({ content: '❌ Erro ao criar a categoria "TICKETS ABERTOS". Verifique as permissões do bot.' });
            }
        }

        const staffRoleId = cfg.cargoStaff;
        const permissionOverwrites = [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            }
        ];

        if (staffRoleId) {
            permissionOverwrites.push({
                id: staffRoleId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            });
        }

        try {
            const ticketChannel = await guild.channels.create({
                name: `ticket-${interaction.user.username.slice(0, 10)}`,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: permissionOverwrites
            });

            ticketGuildData.ticketsAtivos[ticketChannel.id] = {
                userId: interaction.user.id,
                category: selectedValue,
                claimedBy: null
            };
            saveTicketDB(ticketDb);

            const staffMention = staffRoleId ? `<@&${staffRoleId}>` : '`Staff`';
            const embedTicket = new EmbedBuilder()
                .setTitle('🎫 Atendimento Iniciado')
                .setDescription(
                    `Olá ${interaction.user}, bem-vindo ao seu ticket!\n` +
                    `Categoria selecionada: **${selectedValue}**\n\n` +
                    `Um membro da equipe ${staffMention} irá atendê-lo em breve.`
                )
                .setColor(0x3498DB)
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_fechar').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                new ButtonBuilder().setCustomId('ticket_reivindicar').setLabel('Reivindicar').setStyle(ButtonStyle.Success).setEmoji('🛡️'),
                new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📄'),
                new ButtonBuilder().setCustomId('ticket_excluir').setLabel('Excluir').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
            );

            await ticketChannel.send({
                content: `${interaction.user}${staffRoleId ? ` <@&${staffRoleId}>` : ''}`,
                embeds: [embedTicket],
                components: [row]
            });

            return await interaction.editReply({ content: `✅ O seu ticket foi criado com sucesso em ${ticketChannel}!` });
        } catch (e) {
            console.error(e);
            return await interaction.editReply({ content: '❌ Erro ao criar o canal do ticket.' });
        }
    }

    // --- SELECT MENUS DE CONFIGURAÇÃO DE TICKETS ---
    if (interaction.isRoleSelectMenu() && interaction.customId === 'select_ticket_cargo_staff') {
        ticketGuildData.config.cargoStaff = interaction.values[0];
        saveTicketDB(ticketDb);
        return await interaction.update({ content: `✅ Cargo da Staff configurado para <@&${interaction.values[0]}>!`, components: [] });
    }

    if (interaction.isChannelSelectMenu() && interaction.customId === 'select_ticket_canal_envio') {
        ticketGuildData.config.canalEnvio = interaction.values[0];
        saveTicketDB(ticketDb);
        return await interaction.update({ content: `✅ Canal de envio do painel configurado para <#${interaction.values[0]}>!`, components: [] });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'select_ticket_del_opcao') {
        const val = interaction.values[0];
        ticketGuildData.config.opcoes = ticketGuildData.config.opcoes.filter(o => o.value !== val);
        saveTicketDB(ticketDb);
        return await interaction.update({ content: `✅ Opção \`${val}\` removida com sucesso do menu de tickets!`, components: [] });
    }

    // --- MODAIS DE TICKETS ---
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_ticket_textos') {
            const titulo = interaction.fields.getTextInputValue('input_ticket_titulo');
            const desc = interaction.fields.getTextInputValue('input_ticket_desc');

            ticketGuildData.config.titulo = titulo;
            ticketGuildData.config.descricao = desc;
            saveTicketDB(ticketDb);

            return await interaction.reply({ content: '✅ Textos do painel de tickets atualizados com sucesso!' });
        }

        if (interaction.customId === 'modal_ticket_add_opcao') {
            const label = interaction.fields.getTextInputValue('input_opcao_label');
            const desc = interaction.fields.getTextInputValue('input_opcao_desc');
            const emoji = interaction.fields.getTextInputValue('input_opcao_emoji') || '🎫';
            const value = label.toLowerCase().replace(/[^a-z0-9]/g, '_');

            ticketGuildData.config.opcoes.push({ label, value, desc, emoji });
            saveTicketDB(ticketDb);

            return await interaction.reply({ content: `✅ Opção **${label}** adicionada com sucesso ao menu de seleção!` });
        }
    }

    // --- INTERAÇÕES DE PAINEL 1V1 ---
    if (interaction.isButton() && interaction.customId.startsWith('painel_')) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({ content: '❌ Não tens permissão para usar estes botões.', ephemeral: true });
        }

        if (interaction.customId === 'painel_mudar_titulo') {
            const modal = new ModalBuilder()
                .setCustomId('modal_mudar_titulo')
                .setTitle('Alterar Título da Liga');

            const inputTitulo = new TextInputBuilder()
                .setCustomId('input_novo_titulo')
                .setLabel('Novo Nome / Título da Liga')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: SFC 1V1 - SEASON 2')
                .setRequired(true)
                .setMaxLength(50);

            modal.addComponents(new ActionRowBuilder().addComponents(inputTitulo));
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'painel_mudar_cor') {
            const selectCor = new StringSelectMenuBuilder()
                .setCustomId('select_cor_tabela')
                .setPlaceholder('🎨 Selecione a cor de fundo/detalhe...')
                .addOptions([
                    { label: 'Lavanda', value: 'lavanda', description: 'Tom roxo suave' },
                    { label: 'Azul', value: 'azul', description: 'Azul clássico' },
                    { label: 'Dourado', value: 'dourado', description: 'Amarelo dourado premium' },
                    { label: 'Verde', value: 'verde', description: 'Verde esmeralda' },
                    { label: 'Cinza', value: 'cinza', description: 'Cinza escuro elegante' },
                    { label: 'Branco', value: 'branco', description: 'Branco claro' },
                    { label: 'Rosa', value: 'rosa', description: 'Rosa vibrante' },
                    { label: 'Amarelo', value: 'amarelo', description: 'Amarelo vivo' },
                    { label: 'Ciano', value: 'ciano', description: 'Azul ciano brilhante' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectCor);
            return await interaction.reply({ content: 'Selecione abaixo a nova cor de fundo para o painel e tabela:', components: [row], ephemeral: true });
        }

        if (interaction.customId === 'painel_config_cargos') {
            const selectRoleProcurando = new RoleSelectMenuBuilder()
                .setCustomId('role_select_procurando')
                .setPlaceholder('🛡️ Selecione o cargo de Ping para Desafios...')
                .setMinValues(1)
                .setMaxValues(1);

            const selectRoleTop1 = new RoleSelectMenuBuilder()
                .setCustomId('role_select_top1')
                .setPlaceholder('🥇 Selecione o cargo de Top 1...')
                .setMinValues(1)
                .setMaxValues(1);

            const selectRoleTop2 = new RoleSelectMenuBuilder()
                .setCustomId('role_select_top2')
                .setPlaceholder('🥈 Selecione o cargo de Top 2...')
                .setMinValues(1)
                .setMaxValues(1);

            const selectRoleTop3 = new RoleSelectMenuBuilder()
                .setCustomId('role_select_top3')
                .setPlaceholder('🥉 Selecione o cargo de Top 3...')
                .setMinValues(1)
                .setMaxValues(1);

            return await interaction.reply({ 
                content: 'Selecione abaixo os cargos que o bot deve atribuir e controlar automaticamente:', 
                components: [
                    new ActionRowBuilder().addComponents(selectRoleProcurando),
                    new ActionRowBuilder().addComponents(selectRoleTop1),
                    new ActionRowBuilder().addComponents(selectRoleTop2),
                    new ActionRowBuilder().addComponents(selectRoleTop3)
                ], 
                ephemeral: true 
            });
        }

        if (interaction.customId === 'painel_nova_liga') {
            const modal = new ModalBuilder()
                .setCustomId('modal_nova_liga')
                .setTitle('Criar Nova Liga');

            const inputNome = new TextInputBuilder()
                .setCustomId('input_nome_nova_liga')
                .setLabel('Nome da Nova Liga')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: SFC 1V1 - SEASON 2')
                .setRequired(true)
                .setMaxLength(50);

            modal.addComponents(new ActionRowBuilder().addComponents(inputNome));
            return await interaction.showModal(modal);
        }
    }

    // --- SELECT MENUS ---
    if (interaction.isRoleSelectMenu()) {
        if (interaction.customId === 'role_select_procurando') {
            guildData.settings.cargoProcurando = interaction.values[0];
            saveDB(db);
            return await interaction.update({ content: `✅ Cargo de ping atualizado para <@&${interaction.values[0]}>!`, components: [] });
        }
        if (interaction.customId === 'role_select_top1') {
            guildData.settings.cargoTop1 = interaction.values[0];
            saveDB(db);
            await atualizarCargosPodio(interaction.guild, guildData);
            return await interaction.update({ content: `✅ Cargo de Top 1 atualizado para <@&${interaction.values[0]}>!`, components: [] });
        }
        if (interaction.customId === 'role_select_top2') {
            guildData.settings.cargoTop2 = interaction.values[0];
            saveDB(db);
            await atualizarCargosPodio(interaction.guild, guildData);
            return await interaction.update({ content: `✅ Cargo de Top 2 atualizado para <@&${interaction.values[0]}>!`, components: [] });
        }
        if (interaction.customId === 'role_select_top3') {
            guildData.settings.cargoTop3 = interaction.values[0];
            saveDB(db);
            await atualizarCargosPodio(interaction.guild, guildData);
            return await interaction.update({ content: `✅ Cargo de Top 3 atualizado para <@&${interaction.values[0]}>!`, components: [] });
        }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'select_cor_tabela') {
        const novaCor = interaction.values[0];
        guildData.settings.ligaCor = novaCor;
        saveDB(db);
        return await interaction.update({ content: `✅ Cor de fundo da tabela alterada para **${novaCor.toUpperCase()}**!`, components: [] });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'select_cidade_cor') {
        const novaCor = interaction.values[0];
        cidadeGuildData.settings.tabelaCor = novaCor;
        saveCidadeDB(cidadeDb);
        return await interaction.update({ content: `✅ Cor temática da cidade alterada para **${novaCor.toUpperCase()}**!`, components: [] });
    }

    // --- MODAIS ---
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_mudar_titulo') {
            const novoTitulo = interaction.fields.getTextInputValue('input_novo_titulo');
            guildData.settings.ligaNome = novoTitulo;
            saveDB(db);
            return await interaction.reply({ content: `✅ Título da liga atualizado para: \`${novoTitulo}\``, ephemeral: true });
        }

        if (interaction.customId === 'modal_nova_liga') {
            const novoNome = interaction.fields.getTextInputValue('input_nome_nova_liga');
            guildData.players = {};
            guildData.settings.ligaNome = novoNome;
            saveDB(db);
            await atualizarCargosPodio(interaction.guild, guildData);
            return await interaction.reply({ content: `🚨 **Nova liga criada!** Nome: \`${novoNome}\``, ephemeral: true });
        }

        if (interaction.customId === 'modal_cidade_titulo') {
            const novoTitulo = interaction.fields.getTextInputValue('input_novo_titulo');
            cidadeGuildData.settings.tabelaNome = novoTitulo;
            saveCidadeDB(cidadeDb);
            return await interaction.reply({ content: `✅ Título da tabela da cidade atualizado para: \`${novoTitulo}\``, ephemeral: true });
        }

        if (interaction.customId === 'modal_cidade_moedas') {
            const targetId = interaction.fields.getTextInputValue('input_user_id').trim();
            const qtdStr = interaction.fields.getTextInputValue('input_qtd_moedas').trim();
            const qtd = parseInt(qtdStr, 10);

            if (isNaN(qtd)) {
                return await interaction.reply({ content: '❌ A quantidade inserida é inválida.', ephemeral: true });
            }

            const userObj = ensureCidadeUser(targetId);
            userObj.bank += qtd;
            if (userObj.bank < 0) userObj.bank = 0;
            saveCidadeDB(cidadeDb);

            return await interaction.reply({ content: `✅ Saldo atualizado com sucesso neste servidor! Novo saldo no banco: <:moeda:1554577755121917994> **${userObj.bank.toLocaleString()} moedas**.`, ephemeral: true });
        }
    }

    // --- OUTRAS INTERAÇÕES 1V1 (Mapas, Desafios, Resultados) ---
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('escolher_mapa_')) {
        const parts = interaction.customId.split('_');
        const challengerId = parts[2];
        const targetId = parts[3];
        const mapa = interaction.values[0];

        if (interaction.user.id !== challengerId) {
            return await interaction.reply({ content: '❌ Apenas quem criou o desafio pode escolher o mapa!', ephemeral: true });
        }

        let targetUserObj = null;
        if (targetId !== 'aleatorio') {
            targetUserObj = await client.users.fetch(targetId).catch(() => null);
        }

        const titleStatus = targetUserObj 
            ? `<a:carregando:1554216030128177152> AGUARDANDO ${targetUserObj.username.toUpperCase()} ACEITAR DESAFIO` 
            : `<a:carregando:1554216030128177152> AGUARDANDO ALGUM MEMBRO ACEITAR`;

        const embed = new EmbedBuilder()
            .setTitle(titleStatus)
            .setDescription('Um combate foi criado. Clica no botão abaixo para aceitar o duelo!')
            .setColor(0xFF4500)
            .setThumbnail((await client.users.fetch(challengerId).catch(() => null))?.displayAvatarURL({ extension: 'png' }))
            .addFields(
                { name: '<:caveira:1554217228671516837> Desafiante', value: `${interaction.user}`, inline: true },
                { name: '<:imprevisivel:1554217366823633048> Adversário', value: targetId !== 'aleatorio' ? `${targetUserObj}` : '`Aberto a qualquer um`', inline: true },
                { name: '🗺 Mapa', value: `\`${mapa}\``, inline: false },
                { name: '<:analise:1554217532435595505> Regras', value: '• Vitória: **+32 pts** | Derrota: **-32 pts** | Empate: **+10 pts**', inline: false }
            );

        const btnAccept = new ButtonBuilder()
            .setCustomId(`aceitar_desafio_${challengerId}_${targetId}_${encodeURIComponent(mapa)}`)
            .setLabel('Aceitar Desafio')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(btnAccept);
        const cargoPing = guildData.settings.cargoProcurando;
        const content = cargoPing ? `<@&${cargoPing}>` : '';

        await interaction.channel.send({ content, embeds: [embed], components: [row] });
        await interaction.update({ content: '✅ Desafio publicado com sucesso no canal!', embeds: [], components: [] });
    }

    if (interaction.isButton() && (interaction.customId.startsWith('tabela_prev_') || interaction.customId.startsWith('tabela_next_'))) {
        await interaction.deferUpdate();
        const pageChange = interaction.customId.startsWith('tabela_next_') ? 1 : -1;
        const currentPage = parseInt(interaction.customId.split('_').pop(), 10);
        const newPage = currentPage + pageChange;

        const players = await getRankedPlayers(guildData.players, client);
        if (players.length === 0) {
            return await interaction.editReply({ content: '⚠️ A tabela está vazia agora.', embeds: [], files: [], components: [] });
        }

        try {
            const payload = await buildTabelaMessage(players, newPage, guildData.settings);
            return await interaction.editReply(payload);
        } catch (err) {
            console.error('Erro ao paginar tabela:', err);
            return await interaction.followUp({ content: '❌ Erro ao mudar de página.', ephemeral: true });
        }
    }

    if (interaction.isButton() && interaction.customId.startsWith('aceitar_desafio_')) {
        const parts = interaction.customId.split('_');
        const challengerId = parts[2];
        const targetId = parts[3];
        const mapa = decodeURIComponent(parts[4]);

        if (interaction.user.id === challengerId) {
            return await interaction.reply({ content: '❌ Não podes aceitar o teu próprio desafio!', ephemeral: true });
        }
        if (targetId !== 'aleatorio' && interaction.user.id !== targetId) {
            return await interaction.reply({ content: '❌ Este desafio foi direcionado para outro jogador!', ephemeral: true });
        }

        try {
            const thread = await interaction.message.startThread({
                name: `1v1-${interaction.user.username}`,
                autoArchiveDuration: 60,
                type: ChannelType.PublicThread,
                reason: 'Partida 1v1'
            });

            const embedThread = new EmbedBuilder()
                .setTitle('⚔️ SALA DE CONFRONTO 1v1')
                .setDescription(
                    `**Participantes:** <@${challengerId}> ⚔️ <@${interaction.user.id}>\n` +
                    `**Mapa:** \`${mapa}\`\n\n` +
                    `### 📌 Regras e Instruções do Tópico:\n` +
                    `1. **Envie o link do servidor privado** aqui no tópico para irem para o 1v1.\n` +
                    `2. Ambos os participantes podem enviar mensagens livremente.\n` +
                    `3. Joguem a partida no mapa indicado.\n` +
                    `4. Após o jogo, **ambos** devem selecionar o resultado exato no menu abaixo.\n` +
                    `⚠️ *Nota: O cancelamento exige que ambos cliquem no botão de cancelar.*`
                )
                .setColor(0x00FF99);

            const selectMenuResult = new StringSelectMenuBuilder()
                .setCustomId(`resultado_1v1_${challengerId}_${interaction.user.id}`)
                .setPlaceholder('Selecione o resultado exato do confronto...')
                .addOptions([
                    { label: 'Desafiante (1-0)', value: 'desafiante_1_0' },
                    { label: 'Adversário (1-0)', value: 'adversario_1_0' },
                    { label: 'Desafiante (2-1)', value: 'desafiante_2_1' },
                    { label: 'Desafiante (2-0)', value: 'desafiante_2_0' },
                    { label: 'Adversário (2-1)', value: 'adversario_2_1' },
                    { label: 'Adversário (2-0)', value: 'adversario_2_0' },
                    { label: 'Empate Ambos', value: 'empate' }
                ]);

            const btnCancel = new ButtonBuilder()
                .setCustomId(`cancelar_desafio_${challengerId}_${interaction.user.id}`)
                .setLabel('❌ Cancelar Desafio (0/2)')
                .setStyle(ButtonStyle.Danger);

            const rowResult = new ActionRowBuilder().addComponents(selectMenuResult);
            const rowCancel = new ActionRowBuilder().addComponents(btnCancel);

            await thread.send({ 
                content: `⚔️ <@${challengerId}> e <@${interaction.user.id}> o vosso tópico foi criado!`, 
                embeds: [embedThread], 
                components: [rowResult, rowCancel] 
            });

            const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setTitle('<a:carregando:1554216030128177152> Desafio em andamento')
                .setColor(0xF1C40F);

            const fields = originalEmbed.data.fields;
            if (fields && fields[1]) {
                fields[1].value = `<@${interaction.user.id}>`;
            }

            await interaction.update({ embeds: [originalEmbed], components: [] });

            const timeoutHandle = setTimeout(async () => {
                try {
                    const fetchedChannel = await client.channels.fetch(thread.id).catch(() => null);
                    if (fetchedChannel) {
                        await fetchedChannel.send('⚠️ O tempo limite de 2 horas expirou. O desafio foi cancelado automaticamente.');
                        setTimeout(async () => { try { await fetchedChannel.delete(); } catch (e) {} }, 5000);
                    }
                    const starterMessage = await interaction.channel.messages.fetch(interaction.message.id).catch(() => null);
                    if (starterMessage) await starterMessage.delete().catch(() => {});
                } catch (e) {}
            }, 2 * 60 * 60 * 1000);

            interaction.client.matchTimeouts = interaction.client.matchTimeouts || new Map();
            interaction.client.matchTimeouts.set(thread.id, timeoutHandle);

        } catch (err) {
            console.error(err);
            return await interaction.reply({ content: '❌ Erro ao criar o tópico.', ephemeral: true });
        }
    }

    if (interaction.isButton() && interaction.customId.startsWith('cancelar_desafio_')) {
        const parts = interaction.customId.split('_');
        const challengerId = parts[2];
        const acceptorId = parts[3];

        if (interaction.user.id !== challengerId && interaction.user.id !== acceptorId) {
            return await interaction.reply({ content: '❌ Apenas os participantes podem cancelar o desafio!', ephemeral: true });
        }

        interaction.client.cancelVotes = interaction.client.cancelVotes || new Map();
        let cancelSet = interaction.client.cancelVotes.get(interaction.channelId) || new Set();
        cancelSet.add(interaction.user.id);
        interaction.client.cancelVotes.set(interaction.channelId, cancelSet);

        const count = cancelSet.size;

        if (count < 2) {
            try {
                const actionRows = interaction.message.components;
                for (let r of actionRows) {
                    for (let comp of r.components) {
                        if (comp.customId && comp.customId.startsWith('cancelar_desafio_')) {
                            comp.data.label = `❌ Cancelar Desafio (${count}/2)`;
                        }
                    }
                }
                await interaction.update({ components: actionRows });
            } catch (e) {}

            return await interaction.followUp({ content: `⚠️ <@${interaction.user.id}> votou para cancelar. Falta o voto do outro participante (**${count}/2**).` });
        } else {
            if (interaction.client.matchTimeouts?.has(interaction.channelId)) {
                clearTimeout(interaction.client.matchTimeouts.get(interaction.channelId));
                interaction.client.matchTimeouts.delete(interaction.channelId);
            }
            interaction.client.cancelVotes.delete(interaction.channelId);

            try {
                const starterMessage = await interaction.channel.fetchStarterMessage().catch(() => null);
                if (starterMessage) await starterMessage.delete().catch(() => {});
            } catch (e) {}

            const embedCancel = new EmbedBuilder()
                .setTitle('❌ DESAFIO CANCELADO')
                .setDescription(`Ambos os participantes concordaram em cancelar o confronto. Este canal será eliminado em 5 segundos.`)
                .setColor(0xFF0000);

            await interaction.update({ content: '', embeds: [embedCancel], components: [] });
            setTimeout(async () => { try { await interaction.channel.delete(); } catch (e) {} }, 5000);
        }
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('resultado_1v1_')) {
        const parts = interaction.customId.split('_');
        const challengerId = parts[2];
        const acceptorId = parts[3];

        if (interaction.user.id !== challengerId && interaction.user.id !== acceptorId) {
            return await interaction.reply({ content: '❌ Apenas os participantes podem votar!', ephemeral: true });
        }

        interaction.client.pendingResults = interaction.client.pendingResults || new Map();
        let matchVotes = interaction.client.pendingResults.get(interaction.channelId) || {};
        matchVotes[interaction.user.id] = interaction.values[0];
        interaction.client.pendingResults.set(interaction.channelId, matchVotes);

        await interaction.reply({ content: `✅ Voto registado com sucesso. A aguardar o adversário...`, ephemeral: true });

        if (matchVotes[challengerId] && matchVotes[acceptorId]) {
            if (matchVotes[challengerId] !== matchVotes[acceptorId]) {
                await interaction.channel.send('⚠️ Os votos não coincidem! Dialoguem e votem novamente.');
                interaction.client.pendingResults.delete(interaction.channelId);
                return;
            }

            if (interaction.client.matchTimeouts?.has(interaction.channelId)) {
                clearTimeout(interaction.client.matchTimeouts.get(interaction.channelId));
                interaction.client.matchTimeouts.delete(interaction.channelId);
            }

            const result = matchVotes[challengerId];
            let winnerId = null, loserId = null, isDraw = false;
            let scoreText = '';

            if (result.startsWith('desafiante_')) {
                winnerId = challengerId;
                loserId = acceptorId;
                if (result === 'desafiante_1_0') scoreText = '1-0';
                if (result === 'desafiante_2_1') scoreText = '2-1';
                if (result === 'desafiante_2_0') scoreText = '2-0';
            } else if (result.startsWith('adversario_')) {
                winnerId = acceptorId;
                loserId = challengerId;
                if (result === 'adversario_1_0') scoreText = '1-0';
                if (result === 'adversario_2_1') scoreText = '2-1';
                if (result === 'adversario_2_0') scoreText = '2-0';
            } else if (result === 'empate') {
                isDraw = true;
            }

            if (!guildData.players[challengerId]) guildData.players[challengerId] = { userId: challengerId, points: 0, wins: 0, draws: 0, losses: 0 };
            if (!guildData.players[acceptorId]) guildData.players[acceptorId] = { userId: acceptorId, points: 0, wins: 0, draws: 0, losses: 0 };

            if (isDraw) {
                guildData.players[challengerId].points += 10;
                guildData.players[challengerId].draws += 1;
                guildData.players[acceptorId].points += 10;
                guildData.players[acceptorId].draws += 1;
            } else {
                guildData.players[winnerId].points += 32;
                guildData.players[winnerId].wins += 1;
                guildData.players[loserId].points -= 32;
                guildData.players[loserId].losses += 1;
            }

            saveDB(db);
            await atualizarCargosPodio(interaction.guild, guildData);
            interaction.client.pendingResults.delete(interaction.channelId);

            let winnerUserObj = null;
            if (!isDraw) {
                winnerUserObj = await client.users.fetch(winnerId).catch(() => null);
            }

            const textResult = isDraw 
                ? '<a:verificado:1554216178111610932> Desafio finalizado ambos empataram' 
                : `<a:verificado:1554216178111610932> Desafio finalizado o vencedor foi ${winnerUserObj ? winnerUserObj.username : 'Desconhecido'}`;

            try {
                const starterMessage = await interaction.channel.fetchStarterMessage().catch(() => null);
                if (starterMessage) {
                    const parentChannel = starterMessage.channel;
                    await starterMessage.delete().catch(() => {});

                    const finalEmbed = new EmbedBuilder()
                        .setTitle(textResult)
                        .setColor(0x00FF00)
                        .addFields(
                            { name: '<:caveira:1554217228671516837> Desafiante', value: `<@${challengerId}>`, inline: true },
                            { name: '<:imprevisivel:1554217366823633048> Adversário', value: `<@${acceptorId}>`, inline: true },
                            { name: '📊 Placar', value: `\`${isDraw ? 'Empate' : scoreText}\``, inline: false }
                        )
                        .setTimestamp();

                    await parentChannel.send({ embeds: [finalEmbed] });
                }
            } catch (e) {}

            const embedFinal = new EmbedBuilder()
                .setTitle('<:tro:1554226308224131184>  CONFRONTO CONCLUÍDO!')
                .setDescription(`${textResult} (${isDraw ? 'Empate' : 'Placar: ' + scoreText})`)
                .setColor(0x00FF00);

            await interaction.channel.send({ embeds: [embedFinal] });
            setTimeout(async () => { try { await interaction.channel.delete(); } catch (e) {} }, 5000);
        }
    }
});

client.login(TOKEN);
