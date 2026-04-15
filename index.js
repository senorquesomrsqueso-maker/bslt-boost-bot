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
    CLIENT_ID: '1489298163281166449', // Asegúrate de que sea el correcto
    CANAL_AGRADECIMIENTOS_ID: '1489089313466613893' // Canal donde el bot agradece
};

// ==========================================
// 3. DEFINICIÓN DE COMANDOS SLASH
// ==========================================
const commands = [
    new SlashCommandBuilder()
        .setName('probar-boost')
        .setDescription('Simula el mensaje de agradecimiento de boost'),
    new SlashCommandBuilder()
        .setName('msg')
        .setDescription('El bot enviará el mensaje que escribas')
        .addStringOption(option => 
            option.setName('texto')
                .setDescription('Lo que quieres que diga el bot')
                .setRequired(true)
        )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);

client.on('ready', async () => {
    console.log(`✅ BSLT Bot conectado como ${client.user.tag}`);
    try {
        await rest.put(Routes.applicationCommands(CONFIG.CLIENT_ID), { body: commands });
        console.log("✅ Comandos /probar-boost y /msg cargados.");
    } catch (e) { console.error("Error cargando comandos:", e); }
});

// ==========================================
// 4. LÓGICA DE COMANDOS Y BOOSTS
// ==========================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // --- COMANDO /probar-boost ---
    if (interaction.commandName === 'probar-boost') {
        const embedGracias = new EmbedBuilder()
            .setTitle("💎 ¡NUEVO BOOST DETECTADO! (Prueba)")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias, ${interaction.user}, por mejorar el servidor!\n\nTu apoyo es increíble y nos ayuda muchísimo a crecer. ¡Disfruta de tus merecidas ventajas VIP en BSLT! 🌟`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: "¡Un aplauso para nuestro booster!" });
            
        await interaction.reply({ content: `🎉 ¡Gracias totales, ${interaction.user}!`, embeds: [embedGracias] });
    }

    // --- COMANDO /msg ---
    if (interaction.commandName === 'msg') {
        const texto = interaction.options.getString('texto');
        await interaction.channel.send(texto);
        await interaction.reply({ content: '✅ Mensaje enviado.', ephemeral: true });
    }
});

// --- DETECTOR DE BOOSTS (SIN BARRA) ---
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
    
