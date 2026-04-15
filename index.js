const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, MessageType } = require('discord.js');
const express = require('express');

// --- 1. SERVIDOR WEB (PUERTO 5000 SEGÚN TU CONFIGURACIÓN) ---
const app = express();
app.get('/', (req, res) => res.send('✅ Bot BSLT Online y Vinculado 🚀'));
// Usamos el puerto 5000 para que coincida con tu pestaña de Networking
app.listen(5000, "0.0.0.0", () => console.log(`✅ Servidor web activo en puerto 5000`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN,
    CLIENT_ID: '1489298163281166449', 
    CANAL_AGRADECIMIENTOS_ID: '1489089313466613893'
};

// --- 2. REGISTRO DE COMANDOS (/msg y /probar-boost) ---
const commands = [
    new SlashCommandBuilder()
        .setName('probar-boost')
        .setDescription('Simula un mensaje de agradecimiento'),
    new SlashCommandBuilder()
        .setName('msg')
        .setDescription('El bot dirá lo que tú escribas')
        .addStringOption(opt => opt.setName('texto').setDescription('Mensaje para el bot').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);

client.on('ready', async () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    try {
        // Esto borrará los comandos viejos y pondrá el /msg
        await rest.put(Routes.applicationCommands(CONFIG.CLIENT_ID), { body: commands });
        console.log("✅ Comandos /msg y /probar-boost CARGADOS.");
    } catch (e) { console.error("Error al cargar comandos:", e); }
});

// --- 3. LÓGICA DE LOS COMANDOS SLASH ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'probar-boost') {
        const embed = new EmbedBuilder()
            .setTitle("💎 ¡NUEVO BOOST DETECTADO!")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias ${interaction.user} por mejorar el servidor! 🌟`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'msg') {
        const texto = interaction.options.getString('texto');
        await interaction.channel.send(texto);
        await interaction.reply({ content: '✅ Mensaje enviado.', ephemeral: true });
    }
});

// --- 4. DETECTOR AUTOMÁTICO DE BOOSTS ---
client.on('messageCreate', async message => {
    const tiposDeBoost = [
        MessageType.GuildBoost, MessageType.GuildBoostTier1, 
        MessageType.GuildBoostTier2, MessageType.GuildBoostTier3
    ];

    if (tiposDeBoost.includes(message.type)) {
        const canal = await client.channels.fetch(CONFIG.CANAL_AGRADECIMIENTOS_ID);
        const embed = new EmbedBuilder()
            .setTitle("💎 ¡GRACIAS POR EL BOOST!")
            .setColor(0xFF73FA)
            .setDescription(`¡Increíble! ${message.author} acaba de mejorar el servidor. 🚀`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
        await canal.send({ content: `🎉 ¡Gracias totales, ${message.author}!`, embeds: [embed] });
    }
});

client.login(CONFIG.TOKEN);
