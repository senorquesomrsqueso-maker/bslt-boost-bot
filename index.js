const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');

// --- SERVIDOR PARA MANTENERLO VIVO 24/7 ---
const app = express();
app.get('/', (req, res) => res.send('BSLT Bot Online 🚀'));
app.listen(process.env.PORT || 3000, () => console.log('✅ Servidor web activo'));

// --- CONFIGURACIÓN DEL BOT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

const CONFIG = {
    TOKEN: 'MTQ4OTI5ODE2MzI4MTE2NjQ0OQ.Ge63q2.lnCujw4vsNLfPWc_zwDa9I4Fxb9gLSu-n8J-T8',
    CLIENT_ID: '1489298163281166449',
    CANAL_BARRA_ID: '1489089313466613893',
    BOOSTS_ACTUALES: 18, 
    META_NUEVA: 14,
    MENSAJE_ID: null 
};

// --- FUNCIÓN DE DISEÑO ---
async function generarEmbedBoost(guild, forzado = null) {
    const totalReal = forzado !== null ? (CONFIG.BOOSTS_ACTUALES + forzado) : guild.premiumSubscriptionCount;
    const nuevosBoosts = Math.max(totalReal - CONFIG.BOOSTS_ACTUALES, 0);
    const porcentaje = Math.min(Math.floor((nuevosBoosts / CONFIG.META_NUEVA) * 100), 100);
    
    const members = await guild.members.fetch({ time: 5000 }).catch(() => null);
    const boostersList = members ? members
        .filter(m => m.premiumSince)
        .map(m => `• **${m.user.username}**`)
        .slice(0, 15)
        .join('\n') : "Cargando...";

    let barra = "";
    if (porcentaje < 25) barra = "【▓░░░░░░░░░】";
    else if (porcentaje < 50) barra = "【▓▓▓░░░░░░░】";
    else if (porcentaje < 75) barra = "【▓▓▓▓▓▓░░░░】";
    else if (porcentaje < 100) barra = "【▓▓▓▓▓▓▓▓░░】";
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

// --- COMANDOS ---
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

client.on('guildUpdate', async (oldG, newG) => {
    if (newG.premiumSubscriptionCount > oldG.premiumSubscriptionCount) {
        const canal = await client.channels.fetch(CONFIG.CANAL_BARRA_ID);
        const dataBarra = await generarEmbedBoost(newG);
        const mensajes = await canal.messages.fetch({ limit: 10 });
        const msgPrincipal = mensajes.find(m => m.author.id === client.user.id);
        if (msgPrincipal) await msgPrincipal.edit(dataBarra); else await canal.send(dataBarra);

        const numActual = newG.premiumSubscriptionCount - CONFIG.BOOSTS_ACTUALES;
        if (numActual >= CONFIG.META_NUEVA) {
            await canal.send({ content: "📢 **¡OBJETIVO COMPLETADO!** @everyone" });
        }
    }
});

client.login(CONFIG.TOKEN);