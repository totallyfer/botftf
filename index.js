const { 
    Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, 
    ChannelType, PermissionFlagsBits, AttachmentBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder 
} = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');
const express = require('express');

// --- Servidor Web para manter ativo ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Unificado a funcionar perfeitamente!'));
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
// --- GERADOR DE IMAGENS VIA @NAPI-RS/CANVAS ---
// ============================================================

async function gerarCardPerfil(user, pData, position, ligaNome, ligaCorHex) {
    const canvas = createCanvas(700, 250);
    const ctx = canvas.getContext('2d');

    // Fundo do Card (Estilo escuro do Discord)
    ctx.fillStyle = '#2f3136';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 15);
    ctx.fill();

    // Barra lateral colorida da liga
    ctx.fillStyle = ligaCorHex || '#f1c40f';
    ctx.beginPath();
    ctx.roundRect(0, 0, 15, canvas.height, [15, 0, 0, 15]);
    ctx.fill();

    // Texto: Username
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(user.username, 210, 60);

    // Texto: Liga
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#b9bbbe';
    ctx.fillText(`🏆 Liga: ${ligaNome || 'Geral'}`, 210, 95);

    // Texto: Rank e Pontos
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`Rank #${position}  •${pData.points} Pontos`, 210, 135);

    // Estatísticas (Vitórias / Derrotas / WinRate)
    const totalJogos = (pData.wins || 0) + (pData.losses || 0) + (pData.draws || 0);
    const winRate = totalJogos > 0 ? ((pData.wins / totalJogos) * 100).toFixed(1) : '0.0';

    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Vitórias: ${pData.wins || 0}  |  Derrotas: ${pData.losses \vert{}\vert{} 0}  \vert{}  Empates:${pData.draws || 0}`, 210, 175);
    ctx.fillText(`Taxa de Vitória (WinRate): ${winRate}%`, 210, 205);

    // Carregar e desenhar o Avatar Circular
    try {
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);

        ctx.save();
        ctx.beginPath();
        ctx.arc(115, 125, 60, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(avatar, 55, 65, 120, 120);
        ctx.restore();

        // Borda ao redor do avatar
        ctx.strokeStyle = ligaCorHex || '#f1c40f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(115, 125, 60, 0, Math.PI * 2, true);
        ctx.stroke();
    } catch (e) {
        console.error('Erro ao carregar o avatar no Canvas:', e);
    }

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'perfil.png' });
}

async function gerarTabelaCanvas(playersArray, page = 0, dbSettings = {}) {
    const PER_PAGE = 5;
    const startIdx = page * PER_PAGE;
    const current = playersArray.slice(startIdx, startIdx + PER_PAGE);

    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');

    // Fundo geral
    ctx.fillStyle = '#121318';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título da Tabela
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    const titulo = (dbSettings.ligaNome || 'TABELA 1V1').toUpperCase();
    ctx.fillText(titulo, canvas.width / 2, 45);

    let startY = 85;
    const colorHex = COLOR_MAP[dbSettings.ligaCor] || '#f1c40f';

    for (let i = 0; i < current.length; i++) {
        const p = current[i];
        const realIdx = startIdx + i + 1;

        // Caixa de fundo para cada jogador
        ctx.fillStyle = '#2f3136';
        ctx.beginPath();
        ctx.roundRect(40, startY, 720, 60, 8);
        ctx.fill();

        // Posição / Ranking
        ctx.fillStyle = realIdx === 1 ? '#f1c40f' : realIdx === 2 ? '#bdc3c7' : realIdx === 3 ? '#e67e22' : '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`#${realIdx}`, 70, startY + 37);

        // Nome do Jogador
        let username = p.username || 'Jogador';
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px sans-serif';
        ctx.fillText(username, 140, startY + 37);

        // Pontuação alinhada à direita
        ctx.fillStyle = colorHex;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${p.points} PTS`, 730, startY + 37);

        startY += 70;
    }

    if (current.length === 0) {
        ctx.fillStyle = '#b9bbbe';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum jogador encontrado nesta página.', canvas.width / 2, canvas.height / 2);
    }

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'tabela.png' });
}

async function gerarCidadeTabelaCanvas(playersArray, page = 0, dbSettings = {}) {
    const PER_PAGE = 8;
    const startIdx = page * PER_PAGE;
    const current = playersArray.slice(startIdx, startIdx + PER_PAGE);

    const canvas = createCanvas(800, 520);
    const ctx = canvas.getContext('2d');

    // Fundo geral
    ctx.fillStyle = '#121318';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título da Tabela
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    const titulo = (dbSettings.tabelaNome || 'CIDADE - RANKING').toUpperCase();
    ctx.fillText(titulo, canvas.width / 2, 45);

    let startY = 70;
    const colorHex = COLOR_MAP[dbSettings.tabelaCor] || '#f1c40f';

    for (let i = 0; i < current.length; i++) {
        const p = current[i];
        const realIdx = startIdx + i + 1;

        // Caixa de fundo
        ctx.fillStyle = '#2f3136';
        ctx.beginPath();
        ctx.roundRect(40, startY, 720, 48, 6);
        ctx.fill();

        // Rank
        ctx.fillStyle = realIdx === 1 ? '#f1c40f' : realIdx === 2 ? '#bdc3c7' : realIdx === 3 ? '#e67e22' : '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`#${realIdx}`, 65, startY + 30);

        // Nome do Cidadão
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px sans-serif';
        ctx.fillText(p.username || 'Cidadão', 130, startY + 30);

        // Banco
        ctx.fillStyle = colorHex;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`🪙 ${(p.bank || 0).toLocaleString()} moedas`, 730, startY + 30);

        startY += 54;
    }

    if (current.length === 0) {
        ctx.fillStyle = '#b9bbbe';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum cidadão encontrado.', canvas.width / 2, canvas.height / 2);
    }

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'cidade_tabela.png' });
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
            username: u ? u.username : 'Jogador'
        });
    }
    return enriched;
}

async function buildTabelaMessage(players, page, dbSettings = {}) {
    const PER_PAGE = 5;
    const attachment = await gerarTabelaCanvas(players, page, dbSettings);

    const totalPages = Math.ceil(players.length / PER_PAGE) || 1;
    const ligaTitulo = dbSettings.ligaNome ? ` - ${dbSettings.ligaNome}` : '';
    const embed = new EmbedBuilder()
        .setTitle(`<a:brasil:1554216254187765960> Tabela de Classificação${ligaTitulo}`)
        .setColor(COLOR_MAP[dbSettings.ligaCor] || 0xE74C3C)
        .setImage('attachment://tabela.png')
        .setTimestamp()
        .setFooter({ text: `Página ${page + 1} de${totalPages}` });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`tabela_prev_${page}`).setLabel('◀ Anterior').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId(`tabela_next_${page}`).setLabel('Próxima ▶').setStyle(ButtonStyle.Primary).setDisabled((page + 1) * PER_PAGE >= players.length)
    );

    return { embeds: [embed], components: [row], files: [attachment] };
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
            username: u ? u.username : 'Cidadão'
        });
    }
    return enriched;
}

async function buildCidadeTabelaMessage(players, page, dbSettings) {
    const PER_PAGE = 8;
    const attachment = await gerarCidadeTabelaCanvas(players, page, dbSettings);

    const totalPages = Math.ceil(players.length / PER_PAGE) || 1;
    const embed = new EmbedBuilder()
        .setTitle(`<:moeda:1554577755121917994> ${dbSettings.tabelaNome}`)
        .setDescription('Ranking dos cidadãos mais ricos com moedas guardadas no **Banco**.')
        .setColor(COLOR_MAP[dbSettings.tabelaCor] || 0xF1C40F)
        .setImage('attachment://cidade_tabela.png')
        .setTimestamp()
        .setFooter({ text: `Página ${page + 1} de${totalPages}` });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`cidade_prev_${page}`).setLabel('◀ Anterior').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId(`cidade_next_${page}`).setLabel('Próxima ▶').setStyle(ButtonStyle.Primary).setDisabled((page + 1) * PER_PAGE >= players.length)
    );

    return { embeds: [embed], components: [row], files: [attachment] };
}

// ============================================================
// --- REGISTO DOS COMANDOS SLASH ---
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
// --- EVENTOS ---
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
                return await interaction.editReply({ content: '❌ Erro ao gerar a tabela.' });
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

            const ligaNome = guildData.settings.ligaNome || 'Geral';
            const ligaCorHex = COLOR_MAP[guildData.settings.ligaCor] || '#f1c40f';

            try {
                const attachment = await gerarCardPerfil(targetUser, pData, posText, ligaNome, ligaCorHex);
                const embed = new EmbedBuilder()
                    .setColor(ligaCorHex)
                    .setImage('attachment://perfil.png');

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
                const payload = await buildCidadeTabelaMessage(players, 0, cidadeGuildData.settings);
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
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const userObj = ensureCidadeUser(targetUser.id);
            const embed = new EmbedBuilder()
                .setTitle(`Informações Financeiras - ${targetUser.username}`)
                .addFields(
                    { name: '🪙 Carteira', value: `**${(userObj.wallet || 0).toLocaleString()}**`, inline: true },
                    { name: '🏦 Banco', value: `**${(userObj.bank || 0).toLocaleString()}**`, inline: true },
                    { name: '💰 Total', value: `**${((userObj.wallet || 0) + (userObj.bank || 0)).toLocaleString()}**`, inline: false }
                )
                .setColor(0xF1C40F);
            return await interaction.reply({ embeds: [embed] });
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
            const payload = await buildCidadeTabelaMessage(players, currentPage + pageChange, cidadeGuildData.settings);
            return await interaction.editReply(payload);
        }
    }
});

client.login(TOKEN);
