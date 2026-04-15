const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, MessageType } = require('discord.js');
const express = require('express');

// ==========================================
// 1. SERVIDOR WEB (PUERTO 5000)
// ==========================================
const app = express();
app.get('/', (req, res) => res.send('✅ BSLT Bot Online y al 100% 🚀'));
app.listen(5000, "0.0.0.0", () => console.log(`✅ Servidor web activo en puerto 5000`));

// ==========================================
// 2. CONFIGURACIÓN DEL BOT Y VARIABLES
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

// --- SISTEMA DE PROGRESO DE BOOSTS ---
let boostsActuales = 18; // Los 18 boosts base que tenías
const metaBoosts = 30;

function generarBarraProgreso(actual, meta, tamaño = 15) {
    const porcentaje = actual / meta;
    const bloquesLlenos = Math.round(tamaño * porcentaje);
    const bloquesVacios = tamaño - bloquesLlenos;
    return '█'.repeat(Math.max(0, bloquesLlenos)) + '░'.repeat(Math.max(0, bloquesVacios));
}

// ==========================================
// 3. REGISTRO DE TODOS LOS COMANDOS
// ==========================================
const commands = [
    new SlashCommandBuilder()
        .setName('probar-agradecimiento')
        .setDescription('Simula el mensaje de agradecimiento (Público)'),
    new SlashCommandBuilder()
        .setName('probar-boosts')
        .setDescription('Simula la barra de progreso (Público)'),
    new SlashCommandBuilder()
        .setName('msg')
        .setDescription('El bot dirá lo que tú escribas')
        .addStringOption(opt => opt.setName('texto').setDescription('Escribe el mensaje aquí').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);

client.on('ready', async () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    console.log(`✅ Sistema de Boosts iniciado. Base: ${boostsActuales} boosts.`);
    try {
        console.log("⏳ Enviando comandos a Discord...");
        await rest.put(Routes.applicationCommands(CONFIG.CLIENT_ID), { body: commands });
        console.log("✅ Comandos /probar-agradecimiento, /probar-boosts y /msg CARGADOS en la API de Discord.");
    } catch (e) { console.error("❌ Error al cargar comandos:", e); }
});

// ==========================================
// 4. LÓGICA DE LOS COMANDOS (LO QUE HACEN)
// ==========================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // --- COMANDO 1: PROBAR AGRADECIMIENTO ---
    if (interaction.commandName === 'probar-agradecimiento') {
        const embedAgradecimiento = new EmbedBuilder()
            .setTitle("💎 ¡NUEVO BOOST DETECTADO!")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias, ${interaction.user}, por mejorar el servidor!\n\nTu apoyo es increíble y nos ayuda muchísimo a crecer. ¡Disfruta de tus merecidas ventajas VIP en BSLT! 🌟`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: "¡Un aplauso para nuestro booster!" });
            
        await interaction.reply({ content: `🎉 ¡Gracias totales, ${interaction.user}!`, embeds: [embedAgradecimiento] });
    }

    // --- COMANDO 2: PROBAR BOOSTS (BARRA) ---
    if (interaction.commandName === 'probar-boosts') {
        const barra = generarBarraProgreso(boostsActuales, metaBoosts);
        const embedProgreso = new EmbedBuilder()
            .setTitle("🚀 PROGRESO DE MEJORAS DEL SERVIDOR")
            .setColor(0x00FF00)
            .setDescription(`**¡Estamos en camino a la meta!**\n\nNivel Actual de Boosts: **${boostsActuales} / ${metaBoosts}**\n\n${barra}\n\n¡Ayúdanos a llegar a la meta para desbloquear más beneficios para todos!`)
            .setFooter({ text: "BSLT | Agradecemos tu apoyo" });
            
        await interaction.reply({ embeds: [embedProgreso] });
    }

    // --- COMANDO 3: MSG (EL NUEVO) ---
    if (interaction.commandName === 'msg') {
        const texto = interaction.options.getString('texto');
        await interaction.channel.send(texto);
        await interaction.reply({ content: '✅ Mensaje enviado exitosamente.', ephemeral: true });
    }
});

// ==========================================
// 5. DETECTOR AUTOMÁTICO DE BOOSTS REALES
// ==========================================
client.on('messageCreate', async message => {
    const tiposDeBoost = [
        MessageType.GuildBoost, 
        MessageType.GuildBoostTier1, 
        MessageType.GuildBoostTier2, 
        MessageType.GuildBoostTier3
    ];

    if (tiposDeBoost.includes(message.type)) {
        boostsActuales++; // Suma 1 a la cuenta real
        
        const canal = await client.channels.fetch(CONFIG.CANAL_AGRADECIMIENTOS_ID);
        
        // 1. Enviar el Embed de Agradecimiento
        const embedAgradecimiento = new EmbedBuilder()
            .setTitle("💎 ¡NUEVO BOOST DETECTADO!")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias, ${message.author}, por mejorar el servidor!\n\nTu apoyo es increíble y nos ayuda muchísimo a crecer. ¡Disfruta de tus merecidas ventajas VIP en BSLT! 🌟`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: "¡Un aplauso para nuestro booster!" });
            
        await canal.send({ content: `🎉 ¡Gracias totales, ${message.author}!`, embeds: [embedAgradecimiento] });

        // 2. Enviar el Embed de la Barra de Progreso actualizada
        const barra = generarBarraProgreso(boostsActuales, metaBoosts);
        const embedProgreso = new EmbedBuilder()
            .setTitle("🚀 PROGRESO DE MEJORAS ACTUALIZADO")
            .setColor(0x00FF00)
            .setDescription(`**¡Un paso más cerca de la meta!**\n\nNivel Actual de Boosts: **${boostsActuales} / ${metaBoosts}**\n\n${barra}\n\n¡Gracias por ayudarnos a crecer!`)
            .setFooter({ text: "BSLT | Actualización automática" });

        await canal.send({ embeds: [embedProgreso] });
    }
});

client.login(CONFIG.TOKEN);
