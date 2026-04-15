const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, MessageType } = require('discord.js');
const express = require('express');

// --- SERVIDOR WEB (PUERTO 3000 PARA CRON-JOB) ---
const app = express();
app.get('/', (req, res) => res.send('✅ BSLT Bot Online 🚀'));
app.listen(3000, "0.0.0.0", () => console.log(`✅ Servidor web en puerto 3000`));

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN,
    CLIENT_ID: '1489298163281166449', 
    CANAL_AGRADECIMIENTOS_ID: '1489089313466613893'
};

// --- DEFINICIÓN DE COMANDOS ---
const commands = [
    new SlashCommandBuilder()
        .setName('probar-boost')
        .setDescription('Simula el agradecimiento de boost'),
    new SlashCommandBuilder()
        .setName('msg')
        .setDescription('El bot dirá lo que tú escribas')
        .addStringOption(opt => opt.setName('texto').setDescription('Mensaje para el bot').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);

client.on('ready', async () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    try {
        await rest.put(Routes.applicationCommands(CONFIG.CLIENT_ID), { body: commands });
        console.log("✅ Comandos /probar-boost y /msg cargados.");
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'probar-boost') {
        const embed = new EmbedBuilder()
            .setTitle("💎 ¡NUEVO BOOST!")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias ${interaction.user} por mejorar el servidor!`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'msg') {
        const texto = interaction.options.getString('texto');
        await interaction.channel.send(texto);
        await interaction.reply({ content: '✅ Enviado.', ephemeral: true });
    }
});

client.on('messageCreate', async message => {
    const tiposDeBoost = [MessageType.GuildBoost, MessageType.GuildBoostTier1, MessageType.GuildBoostTier2, MessageType.GuildBoostTier3];
    if (tiposDeBoost.includes(message.type)) {
        const canal = await client.channels.fetch(CONFIG.CANAL_AGRADECIMIENTOS_ID);
        const embed = new EmbedBuilder()
            .setTitle("💎 ¡NUEVO BOOST!")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias ${message.author} por tu apoyo! 🚀`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
        await canal.send({ content: `🎉 ¡Gracias ${message.author}!`, embeds: [embed] });
    }
});

client.login(CONFIG.TOKEN);
