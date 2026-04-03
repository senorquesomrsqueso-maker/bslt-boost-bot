const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, MessageType } = require('discord.js');
const express = require('express');

// --- SERVIDOR PARA MANTENERLO VIVO ---
const app = express();
app.get('/', (req, res) => res.send('BSLT Bot Online 🚀'));
app.listen(process.env.PORT || 3000, () => console.log('✅ Servidor web activo'));

// --- CONFIGURACIÓN DEL BOT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages, // Necesario para detectar los mensajes rosas del sistema
        GatewayIntentBits.MessageContent
    ]
});

const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN, // Recuerda tener tu token en los Secrets
    CLIENT_ID: '1489298163281166449',
    CANAL_BARRA_ID: '1489089313466613893',
    BOOSTS_ACTUALES: 18, 
    META_NUEVA: 14
};

// --- FUNCIÓN DE DISEÑO Y LISTA RÁPIDA ---
async function generarEmbedBoost(guild, forzado = null) {
    const totalReal = forzado !== null ? (CONFIG.BOOSTS_ACTUALES + forzado) : guild.premiumSubscriptionCount;
    const nuevosBoosts = Math.max(totalReal - CONFIG.BOOSTS_ACTUALES, 0);
    const porcentaje = Math.min(Math.floor((nuevosBoosts / CONFIG.META_NUEVA) * 100), 100);
    
    // Carga la lista al instante (sin esperar)
    const members = await guild.members.fetch();
    const boostersList = members
        .filter(m => m.premiumSince !== null)
        .map(m => `• **${m.user.username}**`)
        .slice(0, 15) // Muestra los primeros 15 para no saturar
        .join('\n');

    let barra = "";
    if (porcentaje < 20) barra = "【▓░░░░░░░░░】";
    else if (porcentaje < 40) barra = "【▓▓▓░░░░░░░】";
    else if (porcentaje < 60) barra = "【▓▓▓▓▓░░░░░】";
    else if (porcentaje < 80) barra = "【▓▓▓▓▓▓▓░░░】";
    else barra = "【▓▓▓▓▓▓▓▓▓▓】";

    const titulo = porcentaje >= 100 ? "✅ Meta de Mejoras: Completado" : "🚀 Meta de Mejoras: Fase II";

    const embed = new EmbedBuilder()
        .setTitle(titulo)
        .setColor(porcentaje >= 100 ? 0x00FF00 : 0xFF73FA)
        .setDescription(`¡Vamos por **${CONFIG.META_NUEVA} nuevos boosts**!\n\n**Progreso:**\n\`${barra}\` ${porcentaje}%\n\nNuevos: **${nuevosBoosts}** / ${CONFIG.META_NUEVA}\nTotal en el servidor: **${totalReal}**`)
        .addFields({ name: "⭐ Colaboradores actuales:", value: boostersList || "¡Esperando apoyo!" })
        .setFooter({ text: "Sistema de Metas BSLT" })
        .setTimestamp();

    return { 
        content: porcentaje >= 100 ? "📢 **¡META ALCANZADA!** @everyone" : null, 
        embeds: [embed] 
    };
}

// --- COMANDOS (SE MANTIENEN PARA QUE PUEDAS PROBAR) ---
const commands = [
    new SlashCommandBuilder()
        .setName('probar-boosts')
        .setDescription('Simula la barra de progreso (Público)')
        .addIntegerOption(opt => opt.setName('cantidad').setDescription('Nuevos boosts').setRequired(true)),
    new SlashCommandBuilder()
        .setName('probar-agradecimiento')
        .setDescription('Simula el mensaje de agradecimiento (Público)')
        .addIntegerOption(opt => opt.setName('numero').setDescription('Número de boost').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);

client.on('ready', async () => {
    console.log(`✅ BSLT Bot Online. Base: ${CONFIG.BOOSTS_ACTUALES} boosts.`);
    try {
        await rest.put(Routes.applicationCommands(CONFIG.CLIENT_ID), { body: commands });
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    await interaction.deferReply(); 

    if (interaction.commandName === 'probar-boosts') {
        const cant = interaction.options.getInteger('cantidad');
        const data = await generarEmbedBoost(interaction.guild, cant);
        await interaction.editReply(data);
    }

    if (interaction.commandName === 'probar-agradecimiento') {
        const num = interaction.options.getInteger('numero');
        const user = interaction.user;
        const faltan = Math.max(CONFIG.META_NUEVA - num, 0);
        
        const embedGracias = new EmbedBuilder()
            .setTitle("💎 ¡Nuevo Boost Detectado!")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias ${user} por mejorar el servidor!\n\nCon tu ayuda, llevamos **${num}/${CONFIG.META_NUEVA}** de la nueva meta.\n${faltan > 0 ? `¡Solo faltan **${faltan}** más! 🚀` : "¡Hemos completado la meta! 🎉"}`)
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: "Gracias por apoyar a BSLT" });

        const texto = num >= CONFIG.META_NUEVA ? "🎊 ¡META COMPLETADA! @everyone" : "🎊 ¡Gracias por el Boost!";
        await interaction.editReply({ content: texto, embeds: [embedGracias] });
    }
});

// --- EL NUEVO SISTEMA ININFALIBLE PARA DETECTAR BOOSTS ---
// Ahora lee el mensaje del sistema (las letras rosadas) en el canal.
// Así, si alguien da 2 boosts seguidos, el bot agradecerá los 2.
client.on('messageCreate', async message => {
    // Si el mensaje es un aviso del sistema de Discord informando de un Boost
    const tiposDeBoost = [
        MessageType.GuildBoost,
        MessageType.GuildBoostTier1,
        MessageType.GuildBoostTier2,
        MessageType.GuildBoostTier3
    ];

    if (tiposDeBoost.includes(message.type)) {
        const canal = await client.channels.fetch(CONFIG.CANAL_BARRA_ID);
        const user = message.author;
        
        // Calcular números reales
        const totalReal = message.guild.premiumSubscriptionCount || 0;
        const num = Math.max(totalReal - CONFIG.BOOSTS_ACTUALES, 0);
        const faltan = Math.max(CONFIG.META_NUEVA - num, 0);

        // 1. Enviar el mensaje de agradecimiento
        const embedGracias = new EmbedBuilder()
            .setTitle("💎 ¡Nuevo Boost Detectado!")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias ${user} por mejorar el servidor!\n\nCon tu ayuda, llevamos **${num}/${CONFIG.META_NUEVA}** de la nueva meta.\n${faltan > 0 ? `¡Solo faltan **${faltan}** más! 🚀` : "¡Hemos completado la meta! 🎉"}`)
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: "Gracias por apoyar a BSLT" });

        const texto = num >= CONFIG.META_NUEVA ? "🎊 ¡META COMPLETADA! @everyone" : "🎊 ¡Gracias por el Boost!";
        await canal.send({ content: texto, embeds: [embedGracias] });

        // 2. Enviar la barra de progreso en un MENSAJE NUEVO justo abajo
        const dataBarra = await generarEmbedBoost(message.guild);
        await canal.send(dataBarra);
    }
});

client.login(CONFIG.TOKEN);
