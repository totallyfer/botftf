const { 
  Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, 
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
  StringSelectMenuBuilder, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// Conexão com o Banco de Dados SQLite (Persistente no Railway)
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) console.error('Erro ao abrir o banco de dados', err.message);
  else console.log('Conectado ao banco de dados SQLite com sucesso.');
});

// Inicialização das tabelas isoladas por guildId
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS economia (
    userId TEXT, guildId TEXT, carteira INTEGER DEFAULT 0, banco INTEGER DEFAULT 0, emprego TEXT DEFAULT 'Desempregado', PRIMARY KEY (userId, guildId)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS cidades_config (
    guildId TEXT PRIMARY KEY, nome TEXT DEFAULT 'Minha Cidade', cor TEXT DEFAULT '#0099ff'
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS pvp_users (
    userId TEXT, guildId TEXT, pontos INTEGER DEFAULT 1000, vitorias INTEGER DEFAULT 0, derrotas INTEGER DEFAULT 0, empates INTEGER DEFAULT 0, PRIMARY KEY (userId, guildId)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS pvp_config (
    guildId TEXT PRIMARY KEY, nomeLiga TEXT DEFAULT 'Liga 1v1', cor TEXT DEFAULT '#ff0000', cargoPingId TEXT DEFAULT ''
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS ticket_config (
    guildId TEXT PRIMARY KEY, titulo TEXT DEFAULT 'Central de Atendimento', descricao TEXT DEFAULT 'Abra um ticket para falar com a staff.', cargoStaffId TEXT DEFAULT ''
  )`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Cores completas para os painéis
const coresDisponiveis = [
  { name: 'Azul', value: '#0099ff' },
  { name: 'Vermelho', value: '#ff0000' },
  { name: 'Verde', value: '#00ff00' },
  { name: 'Amarelo', value: '#ffff00' },
  { name: 'Roxo', value: '#800080' },
  { name: 'Rosa', value: '#ffc0cb' },
  { name: 'Laranja', value: '#ffa500' },
  { name: 'Preto', value: '#23272a' },
  { name: 'Branco', value: '#ffffff' }
];

client.once('ready', async () => {
  console.log(`Bot online e pronto como ${client.user.tag}!`);

  const commands = [
    new SlashCommandBuilder().setName('tabela').setDescription('Visualiza rankings do servidor').addSubcommand(s => s.setName('cidade').setDescription('Ranking financeiro da cidade')).addSubcommand(s => s.setName('1v1').setDescription('Ranking da liga 1v1')),
    new SlashCommandBuilder().setName('moneyinfo').setDescription('Mostra saldo na carteira e banco').addUserOption(o => o.setName('user').setDescription('Membro').setRequired(false)),
    new SlashCommandBuilder().setName('work').setDescription('Trabalhe para ganhar moedas na carteira'),
    new SlashCommandBuilder().setName('job').setDescription('Escolha seu emprego atual').addStringOption(o => o.setName('cargo').setDescription('Nome do cargo').setRequired(true)),
    new SlashCommandBuilder().setName('slut').setDescription('Tente a sorte na rua (pode ganhar ou perder)').setValue ? '' : null,
    new SlashCommandBuilder().setName('rob').setDescription('Tente roubar moedas de um usuário').addUserOption(o => o.setName('user').setDescription('Alvo do roubo').setRequired(true)),
    new SlashCommandBuilder().setName('pay').setDescription('Transfira dinheiro para outro membro').addUserOption(o => o.setName('user').setDescription('Destinatário').setRequired(true)).addIntegerOption(o => o.setName('valor').setDescription('Valor').setRequired(true)),
    new SlashCommandBuilder().setName('dep').setDescription('Deposita dinheiro no banco').addStringOption(o => o.setName('quantia').setDescription('Quantidade exata ou "all"').setRequired(true)),
    new SlashCommandBuilder().setName('painel').setDescription('Painéis administrativos').addSubcommand(s => s.setName('cidade').setDescription('Gerenciar a cidade')).addSubcommand(s => s.setName('1v1').setDescription('Gerenciar a liga 1v1')).addSubcommand(s => s.setName('ticket').setDescription('Gerenciar o painel de tickets')),
    new SlashCommandBuilder().setName('analise').setDescription('Analisa o histórico 1v1 de um membro').addUserOption(o => o.setName('user').setDescription('Membro').setRequired(false)),
    new SlashCommandBuilder().setName('desafiar').setDescription('Desafie alguém para uma partida 1v1').addUserOption(o => o.setName('user').setDescription('Oponente (deixe vazio para aleatório)').setRequired(false)),
  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('Comandos slash globais atualizados com sucesso.');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName, options, guild, user } = interaction;

    // --- MONEYINFO ---
    if (commandName === 'moneyinfo') {
      const target = options.getUser('user') || user;
      db.get(`SELECT * FROM economia WHERE userId = ? AND guildId = ?`, [target.id, guild.id], (err, row) => {
        const carteira = row ? row.carteira : 0;
        const banco = row ? row.banco : 0;
        const emprego = row ? row.emprego : 'Desempregado';
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(`💰 Economia de ${target.username}`)
          .addFields(
            { name: '💼 Emprego', value: emprego, inline: false },
            { name: '💵 Carteira', value: `$${carteira}`, inline: true },
            { name: '🏦 Banco (Seguro)', value: `$${banco}`, inline: true },
            { name: '💎 Total', value: `$${carteira + banco}`, inline: true }
          );
        interaction.reply({ embeds: [embed] });
      });
    }

    // --- DEP ---
    if (commandName === 'dep') {
      const quantiaStr = options.getString('quantia');
      db.get(`SELECT * FROM economia WHERE userId = ? AND guildId = ?`, [user.id, guild.id], (err, row) => {
        let carteira = row ? row.carteira : 0;
        let valorParaDepositar = 0;

        if (quantiaStr.toLowerCase() === 'all') {
          valorParaDepositar = carteira;
        } else {
          valorParaDepositar = parseInt(quantiaStr);
        }

        if (isNaN(valorParaDepositar) || valorParaDepositar <= 0 || valorParaDepositar > carteira) {
          return interaction.reply({ content: '❌ Quantia inválida ou saldo insuficiente na carteira!', ephemeral: true });
        }

        db.run(`INSERT INTO economia (userId, guildId, carteira, banco) VALUES (?, ?, ?, ?) ON CONFLICT(userId, guildId) DO UPDATE SET carteira = carteira - ?, banco = banco + ?`,
          [user.id, guild.id, -valorParaDepositar, valorParaDepositar, valorParaDepositar, valorParaDepositar], () => {
            interaction.reply({ content: `✅ Você depositou **$${valorParaDepositar}** no banco com segurança!` });
          });
      });
    }

    // --- WORK / SLUT / JOB / ROB / PAY ---
    if (commandName === 'work') {
      const ganho = Math.floor(Math.random() * 250) + 50;
      db.run(`INSERT INTO economia (userId, guildId, carteira) VALUES (?, ?, ?) ON CONFLICT(userId, guildId) DO UPDATE SET carteira = carteira + ?`, [user.id, guild.id, ganho, ganho]);
      return interaction.reply(`💼 Você trabalhou duro e ganhou **$${ganho}** na sua carteira.`);
    }

    if (commandName === 'job') {
      const cargo = options.getString('cargo');
      db.run(`INSERT INTO economia (userId, guildId, emprego) VALUES (?, ?, ?) ON CONFLICT(userId, guildId) DO UPDATE SET emprego = ?`, [user.id, guild.id, cargo, cargo]);
      return interaction.reply(`👔 Você agora atua como **${cargo}**!`);
    }

    if (commandName === 'slut') {
      const ganho = Math.random() > 0.4 ? Math.floor(Math.random() * 450) : -250;
      db.run(`INSERT INTO economia (userId, guildId, carteira) VALUES (?, ?, ?) ON CONFLICT(userId, guildId) DO UPDATE SET carteira = carteira + ?`, [user.id, guild.id, ganho, ganho]);
      return interaction.reply(ganho > 0 ? `🔥 Deu bom na rua! Você faturou **$${ganho}**.` : `🚨 Polícia! Você se deu mal e perdeu **$${Math.abs(ganho)}**.`);
    }

    if (commandName === 'rob') {
      const alvo = options.getUser('user');
      if (alvo.id === user.id) return interaction.reply({ content: 'Você não pode roubar a si mesmo!', ephemeral: true });
      db.get(`SELECT carteira FROM economia WHERE userId = ? AND guildId = ?`, [alvo.id, guild.id], async (err, rowAlvo) => {
        const carteiraAlvo = rowAlvo ? rowAlvo.carteira : 0;
        if (carteiraAlvo < 50) return interaction.reply({ content: 'Este usuário não tem dinheiro suficiente na carteira para ser roubado.', ephemeral: true });
        
        if (Math.random() > 0.5) {
          const roubado = Math.floor(carteiraAlvo * 0.4);
          db.run(`UPDATE economia SET carteira = carteira - ? WHERE userId = ? AND guildId = ?`, [roubado, alvo.id, guild.id]);
          db.run(`INSERT INTO economia (userId, guildId, carteira) VALUES (?, ?, ?) ON CONFLICT(userId, guildId) DO UPDATE SET carteira = carteira + ?`, [user.id, guild.id, roubado, roubado]);
          return interaction.reply(`🥷 Você conseguiu roubar **$${roubado}** da carteira de <@${alvo.id}>!`);
        } else {
          return interaction.reply(`🚨 Você tentou roubar <@${alvo.id}>, foi pego no flagra e fugiu de mãos vazias!`);
        }
      });
    }

    if (commandName === 'pay') {
      const alvo = options.getUser('user');
      const valor = options.getInteger('valor');
      if (alvo.id === user.id) return interaction.reply({ content: 'Você não pode pagar a si mesmo!', ephemeral: true });
      db.get(`SELECT carteira FROM economia WHERE userId = ? AND guildId = ?`, [user.id, guild.id], (err, row) => {
        const carteira = row ? row.carteira : 0;
        if (carteira < valor) return interaction.reply({ content: 'Você não tem saldo suficiente na carteira!', ephemeral: true });
        db.run(`UPDATE economia SET carteira = carteira - ? WHERE userId = ? AND guildId = ?`, [valor, user.id, guild.id]);
        db.run(`INSERT INTO economia (userId, guildId, carteira) VALUES (?, ?, ?) ON CONFLICT(userId, guildId) DO UPDATE SET carteira = carteira + ?`, [alvo.id, guild.id, valor, valor]);
        interaction.reply(`💸 Você transferiu com sucesso **$${valor}** para <@${alvo.id}>.`);
      });
    }

    // --- TABELAS (RANKINGS COM PAGINAÇÃO 1-10) ---
    if (commandName === 'tabela') {
      const sub = options.getSubcommand();
      if (sub === 'cidade') {
        db.all(`SELECT * FROM economia WHERE guildId = ? ORDER BY banco DESC`, [guild.id], async (err, rows) => {
          if (!rows || rows.length === 0) return interaction.reply('Ainda não há registros financeiros na tabela da cidade deste servidor.');
          let page = 0;
          const generateEmbed = (p) => {
            const start = p * 10;
            const currentRows = rows.slice(start, start + 10);
            let desc = currentRows.map((r, i) => `**${start + i + 1}º** <@${r.userId}> — 🏦 $${r.banco}`).join('\n');
            return new EmbedBuilder().setTitle('🏙️ Ranking da Cidade (Banco)').setDescription(desc).setColor('#0099ff').setFooter({ text: `Página ${p + 1} de ${Math.ceil(rows.length / 10)}` });
          };
          const rowButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev_cid').setLabel('Anterior').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('next_cid').setLabel('Próximo').setStyle(ButtonStyle.Primary)
          );
          const msg = await interaction.reply({ embeds: [generateEmbed(page)], components: [rowButtons], fetchReply: true });
          const collector = msg.createMessageComponentCollector({ time: 60000 });
          collector.on('collect', async i => {
            if (i.user.id !== user.id) return i.reply({ content: 'Apenas quem usou o comando pode navegar!', ephemeral: true });
            if (i.customId === 'next_cid' && (page + 1) * 10 < rows.length) page++;
            if (i.customId === 'prev_cid' && page > 0) page--;
            await i.update({ embeds: [generateEmbed(page)], components: [rowButtons] });
          });
        });
      } else if (sub === '1v1') {
        db.all(`SELECT * FROM pvp_users WHERE guildId = ? ORDER BY pontos DESC`, [guild.id], async (err, rows) => {
          if (!rows || rows.length === 0) return interaction.reply('Ainda não há registros na tabela 1v1 deste servidor.');
          let page = 0;
          const generateEmbed = (p) => {
            const start = p * 10;
            const currentRows = rows.slice(start, start + 10);
            let desc = currentRows.map((r, i) => `**${start + i + 1}º** <@${r.userId}> — 🏆 ${r.pontos} pts (V:${r.vitorias} | D:${r.derrotas} | E:${r.empates})`).join('\n');
            return new EmbedBuilder().setTitle('⚔️ Ranking da Liga 1v1').setDescription(desc).setColor('#ff0000').setFooter({ text: `Página ${p + 1} de ${Math.ceil(rows.length / 10)}` });
          };
          const rowButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev_1v1').setLabel('Anterior').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('next_1v1').setLabel('Próximo').setStyle(ButtonStyle.Danger)
          );
          const msg = await interaction.reply({ embeds: [generateEmbed(page)], components: [rowButtons], fetchReply: true });
          const collector = msg.createMessageComponentCollector({ time: 60000 });
          collector.on('collect', async i => {
            if (i.user.id !== user.id) return i.reply({ content: 'Apenas quem usou o comando pode navegar!', ephemeral: true });
            if (i.customId === 'next_1v1' && (page + 1) * 10 < rows.length) page++;
            if (i.customId === 'prev_1v1' && page > 0) page--;
            await i.update({ embeds: [generateEmbed(page)], components: [rowButtons] });
          });
        });
      }
    }

    // --- ANÁLISE 1V1 ---
    if (commandName === 'analise') {
      const target = options.getUser('user') || user;
      db.get(`SELECT * FROM pvp_users WHERE userId = ? AND guildId = ?`, [target.id, guild.id], (err, row) => {
        const pontos = row ? row.pontos : 1000;
        const vitorias = row ? row.vitorias : 0;
        const derrotas = row ? row.derrotas : 0;
        const empates = row ? row.empates : 0;
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`📊 Análise 1v1 - ${target.username}`)
          .addFields(
            { name: '🏆 Pontuação', value: `${pontos} pts`, inline: true },
            { name: '🥇 Vitórias', value: `${vitorias}`, inline: true },
            { name: '❌ Derrotas', value: `${derrotas}`, inline: true },
            { name: '🤝 Empates', value: `${empates}`, inline: true }
          );
        interaction.reply({ embeds: [embed] });
      });
    }

    // --- DESAFIAR 1V1 ---
    if (commandName === 'desafiar') {
      const oponente = options.getUser('user');
      if (oponente && oponente.id === user.id) return interaction.reply({ content: 'Você não pode desafiar a si mesmo!', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('⚔️ Novo Desafio 1v1 Criado!')
        .setDescription(`Desafiante: <@${user.id}>\nOponente: ${oponente ? `<@${oponente.id}>` : 'Qualquer membro (Aleatório)'}\n\n**Escolha o mapa abaixo e clique em Aceitar!**`)
        .setColor('#ff0000');

      const selectMapa = new StringSelectMenuBuilder()
        .setCustomId(`mapa_sel_${user.id}`)
        .setPlaceholder('Selecione o mapa do 1v1')
        .addOptions(
          { label: 'Homestead', value: 'Homestead' },
          { label: 'Aeroporto', value: 'Aeroporto' },
          { label: 'Facility', value: 'Facility' }
        );

      const rowMapa = new ActionRowBuilder().addComponents(selectMapa);
      const rowBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`aceitar_1v1_${user.id}_${oponente ? oponente.id : 'any'}`).setLabel('Aceitar Desafio').setStyle(ButtonStyle.Success)
      );

      await interaction.reply({ embeds: [embed], components: [rowMapa, rowBtn] });
    }

    // --- PAINÉIS ADMINISTRATIVOS ---
    if (commandName === 'painel') {
      const sub = options.getSubcommand();
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Você precisa ter permissões de Moderação/Administrador para acessar os painéis.', ephemeral: true });
      }

      if (sub === 'cidade') {
        db.get(`SELECT * FROM cidades_config WHERE guildId = ?`, [guild.id], async (err, config) => {
          const nome = config ? config.nome : 'Minha Cidade';
          const cor = config ? config.cor : '#0099ff';
          const embed = new EmbedBuilder().setTitle(`🏙️ Painel Administrativo: ${nome}`).setColor(cor).setDescription('Utilize os botões abaixo para configurar a cidade e gerenciar a economia.');
          const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('cid_btn_nome').setLabel('Mudar Nome').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('cid_btn_cor').setLabel('Mudar Cor').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('cid_btn_reset').setLabel('Resetar Cidade').setStyle(ButtonStyle.Danger)
          );
          await interaction.reply({ embeds: [embed], components: [row1], ephemeral: true });
        });
      } else if (sub === '1v1') {
        db.get(`SELECT * FROM pvp_config WHERE guildId = ?`, [guild.id], async (err, config) => {
          const nomeLiga = config ? config.nomeLiga : 'Liga 1v1';
          const cor = config ? config.cor : '#ff0000';
          const embed = new EmbedBuilder().setTitle(`⚔️ Painel Administrativo: ${nomeLiga}`).setColor(cor).setDescription('Gerencie as configurações da liga 1v1 e tabela.');
          const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('pvp_btn_nome').setLabel('Mudar Nome Liga').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('pvp_btn_cor').setLabel('Mudar Cor').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('pvp_btn_reset').setLabel('Resetar Tabela').setStyle(ButtonStyle.Danger)
          );
          await interaction.reply({ embeds: [embed], components: [row1], ephemeral: true });
        });
      } else if (sub === 'ticket') {
        const embed = new EmbedBuilder().setTitle('🎫 Painel de Configuração de Tickets').setColor('#00ff00').setDescription('Clique abaixo para enviar o painel oficial de atendimento neste canal.');
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_enviar_painel').setLabel('Enviar Painel de Tickets').setStyle(ButtonStyle.Success)
        );
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }
    }
  }

  // --- TRATAMENTO DE BOTÕES, MENUS E MODAIS ---
  if (interaction.isButton()) {
    const [action, ...args] = interaction.customId.split('_');

    // Aceite de Desafio 1v1
    if (interaction.customId.startsWith('aceitar_1v1')) {
      const creatorId = args[1];
      const targetId = args[2];

      if (interaction.user.id === creatorId) {
        return interaction.reply({ content: '❌ O criador do desafio não pode aceitar a própria partida!', ephemeral: true });
      }
      if (targetId !== 'any' && interaction.user.id !== targetId) {
        return interaction.reply({ content: '❌ Este desafio foi direcionado especificamente para outro membro!', ephemeral: true });
      }

      // Criar tópico privado
      const thread = await interaction.channel.threads.create({
        name: `1v1-${interaction.guild.members.cache.get(creatorId)?.user.username || 'rival'}`,
        autoArchiveDuration: 60,
        type: ChannelType.PrivateThread
      });

      await thread.members.add(creatorId);
      await thread.members.add(interaction.user.id);

      const selectResultados = new StringSelectMenuBuilder()
        .setCustomId(`res_pvp_${creatorId}_${interaction.user.id}`)
        .setPlaceholder('Selecione o resultado da partida')
        .addOptions(
          { label: 'Desafiador 1-0 Desafiante', value: 'd1_0' },
          { label: 'Ambos 1-1 (Empate)', value: 'empate' },
          { label: 'Desafiador 2-1 Desafiante', value: 'd2_1' },
          { label: 'Desafiante 1-0 Desafiador', value: 'a1_0' },
          { label: 'Desafiante 2-1 Desafiador', value: 'a2_1' }
        );

      await thread.send({ 
        content: `⚔️ Tópico privado do 1v1 iniciado entre <@${creatorId}> e <@${interaction.user.id}>!\nJoguem a partida e selecione o resultado correto abaixo:`, 
        components: [new ActionRowBuilder().addComponents(selectResultados)] 
      });

      await interaction.update({ content: `✅ Desafio aceito! Tópico privado criado com sucesso: <#${thread.id}>`, components: [] });
    }

    // Enviar painel de tickets
    if (interaction.customId === 'ticket_enviar_painel') {
      const embed = new EmbedBuilder().setTitle('🎫 Central de Atendimento').setDescription('Clique no botão abaixo para abrir um atendimento com a staff.').setColor('#00ff00');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('abrir_ticket_sistema').setLabel('Abrir Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
      );
      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: 'Painel de tickets enviado com sucesso neste canal!', ephemeral: true });
    }

    // Abertura de Ticket
    if (interaction.customId === 'abrir_ticket_sistema') {
      const guild = interaction.guild;
      const ticketChannel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_fechar').setLabel('Fechar').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_transcricao').setLabel('Transcrição').setStyle(ButtonStyle.Secondary)
      );

      await ticketChannel.send({ content: `Olá <@${interaction.user.id}>, a staff irá atender você em breve.`, components: [row] });
      await interaction.reply({ content: `Seu ticket foi aberto com sucesso em ${ticketChannel}!`, ephemeral: true });
    }

    // Fechar Ticket
    if (interaction.customId === 'ticket_fechar') {
      await interaction.channel.delete();
    }

    // Painéis de configuração da cidade (Botões)
    if (interaction.customId === 'cid_btn_reset') {
      db.run(`DELETE FROM economia WHERE guildId = ?`, [interaction.guild.id], () => {
        interaction.reply({ content: '✅ A cidade e todos os dados financeiros foram resetados!', ephemeral: true });
      });
    }

    if (interaction.customId === 'cid_btn_nome') {
      const modal = new ModalBuilder().setCustomId('modal_cid_nome').setTitle('Alterar Nome da Cidade');
      const input = new TextInputBuilder().setCustomId('novo_nome_cid').setLabel('Novo Nome').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  }

  // --- TRATAMENTO DE SELECT MENUS (RESULTADOS 1V1) ---
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith('res_pvp')) {
      const parts = interaction.customId.split('_');
      const desafiadorId = parts[2];
      const desafianteId = parts[3];
      const escolha = interaction.values[0];

      let vencedorId = null;
      let eEmpate = false;

      if (escolha === 'd1_0' || escolha === 'd2_1') vencedorId = desafiadorId;
      else if (escolha === 'a1_0' || escolha === 'a2_1') vencedorId = desafianteId;
      else if (escolha === 'empate') eEmpate = true;

      // Atualizar pontos no banco (+32 vitória, +10 empate, 0 derrota)
      if (eEmpate) {
        db.run(`INSERT INTO pvp_users (userId, guildId, pontos, empates) VALUES (?, ?, 1010, 1) ON CONFLICT(userId, guildId) DO UPDATE SET pontos = pontos + 10, empates = empates + 1`, [desafiadorId, interaction.guild.id]);
        db.run(`INSERT INTO pvp_users (userId, guildId, pontos, empates) VALUES (?, ?, 1010, 1) ON CONFLICT(userId, guildId) DO UPDATE SET pontos = pontos + 10, empates = empates + 1`, [desafianteId, interaction.guild.id]);
      } else {
        const perdedorId = vencedorId === desafiadorId ? desafianteId : desafiadorId;
        db.run(`INSERT INTO pvp_users (userId, guildId, pontos, vitorias) VALUES (?, ?, 1032, 1) ON CONFLICT(userId, guildId) DO UPDATE SET pontos = pontos + 32, vitorias = vitorias + 1`, [vencedorId, interaction.guild.id]);
        db.run(`INSERT INTO pvp_users (userId, guildId, pontos, derrotas) VALUES (?, ?, 1000, 1) ON CONFLICT(userId, guildId) DO UPDATE SET derrotas = derrotas + 1`, [perdedorId, interaction.guild.id]);
      }

      await interaction.update({ content: `✅ Resultado computado com sucesso! O tópico será apagado em 10 segundos.`, components: [] });

      setTimeout(async () => {
        try {
          if (interaction.channel && interaction.channel.type === ChannelType.PrivateThread) {
            await interaction.channel.delete();
          }
        } catch (e) {}
      }, 10000);
    }
  }

  // --- MODAIS ---
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_cid_nome') {
      const novoNome = interaction.fields.getTextInputValue('novo_nome_cid');
      db.run(`INSERT INTO cidades_config (guildId, nome) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET nome = ?`, [interaction.guild.id, novoNome, novoNome], () => {
        interaction.reply({ content: `✅ O nome da cidade foi alterado para **${novoNome}** com sucesso!`, ephemeral: true });
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
