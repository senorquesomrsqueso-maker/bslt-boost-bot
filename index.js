const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, MessageType } = require('discord.js');
const express = require('express');

// ==========================================
// 1. SERVIDOR WEB (SISTEMA ANTI-APAGONES)
// ==========================================
const app = express();
app.get('/', (req, res) => res.send('✅ BSLT Bot Online y Protegido 🚀'));
app.listen(3000, "0.0.0.0", () => console.log(`✅ Servidor web en puerto 3000 activo`));

// ==========================================
// 2. CONFIGURACIÓN Y CLIENTE
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
    CLIENT_ID: '1489298163281166449',
    CANAL_AGRADECIMIENTOS_ID: '1489089313466613893'
};

// ==========================================
// 3. REGISTRO DE COMANDOS (CRECIENDO...)
// ==========================================
const commands = [
    new SlashCommandBuilder()
        .setName('probar-boost')
        .setDescription('Simula el mensaje premium de agradecimiento'),
    new SlashCommandBuilder()
        .setName('msg')
        .setDescription('El bot enviará el mensaje que tú escribas')
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
        console.log("✅ Comandos /probar-boost y /msg cargados correctamente.");
    } catch (e) { console.error("Error al cargar comandos:", e); }
});

// ==========================================
// 4. LÓGICA DE INTERACCIONES
// ==========================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // --- FUNCIÓN: /probar-boost ---
    if (interaction.commandName === 'probar-boost') {
        const embedGracias = new EmbedBuilder()
            .setTitle("💎 ¡NUEVO BOOST DETECTADO!")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias, ${interaction.user}, por mejorar el servidor!\n\nTu apoyo es increíble y nos ayuda muchísimo a crecer. ¡Disfruta de tus ventajas VIP en BSLT! 🌟`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: "Simulación de agradecimiento premium" });
            
        await interaction.reply({ content: `🎉 ¡Gracias totales, ${interaction.user}!`, embeds: [embedGracias] });
    }

    // --- FUNCIÓN NUEVA: /msg ---
    if (interaction.commandName === 'msg') {
        const texto = interaction.options.getString('texto');
        
        // El bot envía el mensaje al canal
        await interaction.channel.send(texto);
        
        // Respuesta invisible para que no ensucie el chat
        await interaction.reply({ content: '✅ Mensaje enviado con éxito.', ephemeral: true });
    }
});

// ==========================================
// 5. DETECTOR DE BOOSTS REALES (ESTILO BONITO)
// ==========================================
client.on('messageCreate', async message => {
    const tiposDeBoost = [
        MessageType.GuildBoost,
        MessageType.GuildBoostTier1,
        MessageType.GuildBoostTier2,
        MessageType.GuildBoostTier3
    ];

    if (tiposDeBoost.includes(message.type)) {
        try {
            const canal = await client.channels.fetch(CONFIG.CANAL_AGRADECIMIENTOS_ID);
            const user = message.author;
            
            const embedGracias = new EmbedBuilder()
                .setTitle("💎 ¡NUEVO BOOST DETECTADO!")
                .setColor(0xFF73FA)
                .setDescription(`¡Muchísimas gracias, ${user}, por mejorar el servidor!\n\nTu apoyo es increíble y nos ayuda muchísimo a crecer. ¡Disfruta de tus merecidas ventajas VIP en BSLT! 🌟`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ text: "¡Un aplauso para nuestro booster!" });

            await canal.send({ content: `🎉 ¡Gracias totales, ${user}!`, embeds: [embedGracias] });
        } catch (err) {
            console.error("Error al enviar agradecimiento real:", err);
        }
    }
});

client.login(CONFIG.TOKEN);
