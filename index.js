const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, MessageType } = require('discord.js');
const express = require('express');

// ==========================================
// 1. SERVIDOR WEB (ANTI-APAGONES 24/7)
// ==========================================
const app = express();
app.get('/', (req, res) => res.send('✅ BSLT Bot Online 🚀'));
const port = 3000;
app.listen(port, "0.0.0.0", () => console.log(`✅ Servidor web escuchando en puerto ${port}`));

// ==========================================
// 2. CONFIGURACIÓN DEL BOT
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN,
    CLIENT_ID: '1489298163281166449', // Tu ID de bot
    CANAL_AGRADECIMIENTOS_ID: '1489089313466613893' // Tu canal de boosts
};

// ==========================================
// 3. COMANDOS SLASH (/probar-agradecimiento y /tell)
// ==========================================
const commands = [
    new SlashCommandBuilder()
        .setName('probar-agradecimiento')
        .setDescription('Simula el mensaje bonito de agradecimiento de boost'),
    new SlashCommandBuilder()
        .setName('tell')
        .setDescription('Hace que el bot envíe el mensaje que tú escribas')
        .addStringOption(option => 
            option.setName('mensaje')
                .setDescription('El texto que el bot enviará al canal')
                .setRequired(true)
        )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);

client.on('ready', async () => {
    console.log(`✅ BSLT Bot conectado como ${client.user.tag}`);
    try {
        await rest.put(Routes.applicationCommands(CONFIG.CLIENT_ID), { body: commands });
        console.log("✅ Comandos cargados correctamente.");
    } catch (e) { console.error("Error cargando comandos:", e); }
});

// ==========================================
// 4. RESPUESTA A LOS COMANDOS
// ==========================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // --- COMANDO: /probar-agradecimiento ---
    if (interaction.commandName === 'probar-agradecimiento') {
        const embedGracias = new EmbedBuilder()
            .setTitle("💎 ¡NUEVO BOOST DETECTADO! (Prueba)")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias, ${interaction.user}, por mejorar el servidor!\n\nTu apoyo es increíble y nos ayuda muchísimo a crecer. ¡Disfruta de tus merecidas ventajas VIP en BSLT! 🌟`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: "¡Un aplauso para nuestro booster!" });
            
        await interaction.reply({ content: `🎉 ¡Gracias totales, ${interaction.user}!`, embeds: [embedGracias] });
    }

    // --- COMANDO: /tell ---
    if (interaction.commandName === 'tell') {
        const mensajeTexto = interaction.options.getString('mensaje');
        
        // El bot envía el mensaje al canal donde ejecutaste el comando
        await interaction.channel.send(mensajeTexto);
        
        // El bot te responde a ti de forma "efímera" (solo tú lo ves) para que no quede rastro del comando
        await interaction.reply({ content: '✅ Mensaje enviado sigilosamente.', ephemeral: true });
    }
});

// ==========================================
// 5. DETECTOR REAL DE BOOSTS (SIN BARRA)
// ==========================================
client.on('messageCreate', async message => {
    const tiposDeBoost = [
        MessageType.GuildBoost,
        MessageType.GuildBoostTier1,
        MessageType.GuildBoostTier2,
        MessageType.GuildBoostTier3
    ];

    if (tiposDeBoost.includes(message.type)) {
        const canal = await client.channels.fetch(CONFIG.CANAL_AGRADECIMIENTOS_ID);
        const user = message.author;
        
        const embedGracias = new EmbedBuilder()
            .setTitle("💎 ¡NUEVO BOOST DETECTADO!")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias, ${user}, por mejorar el servidor!\n\nTu apoyo es increíble y nos ayuda muchísimo a crecer. ¡Disfruta de tus merecidas ventajas VIP en BSLT! 🌟`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: "¡Un aplauso para nuestro booster!" });

        await canal.send({ content: `🎉 ¡Gracias totales, ${user}!`, embeds: [embedGracias] });
    }
});

client.login(CONFIG.TOKEN);
