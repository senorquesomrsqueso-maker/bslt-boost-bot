const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, MessageType } = require('discord.js');
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, MessageType } = require('discord.js');
const express = require('express');

// ==========================================
// 1. SERVIDOR WEB (SISTEMA ANTI-APAGONES 24/7)
// ==========================================
const app = express();
app.get('/', (req, res) => {
    res.send('✅ BSLT Bot Online y Protegido 🚀');
});

// Replit necesita el puerto 3000 para exponer la web y que el Cron-job funcione.
const port = 3000;
app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Servidor web escuchando en el puerto ${port} (Listo para Cron-job)`);
});

// ==========================================
// 2. CONFIGURACIÓN DEL BOT DE DISCORD
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages, // CRUCIAL: Para leer los mensajes rosas de boost
        GatewayIntentBits.MessageContent
    ]
});

const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN,
    CLIENT_ID: '1489298163281166449',
    CANAL_BARRA_ID: '1489089313466613893',
    BOOSTS_ACTUALES: 18, 
    META_NUEVA: 14
};

// ==========================================
// 3. DISEÑO DE LA BARRA DE PROGRESO (BONITA Y RÁPIDA)
// ==========================================
async function generarEmbedBoost(guild) {
    const totalReal = guild.premiumSubscriptionCount || 0;
    const nuevosBoosts = Math.max(totalReal - CONFIG.BOOSTS_ACTUALES, 0);
    const porcentaje = Math.min(Math.floor((nuevosBoosts / CONFIG.META_NUEVA) * 100), 100);
    
    // Carga la lista al instante, sin el molesto "Cargando..."
    const members = await guild.members.fetch();
    const boostersList = members
        .filter(m => m.premiumSince !== null)
        .map(m => `• **${m.user.username}**`)
        .slice(0, 15) // Top 15 para mantener el mensaje limpio
        .join('\n');

    // Diseño de la barra
    let barra = "";
    if (porcentaje < 20) barra = "【▓░░░░░░░░░】";
    else if (porcentaje < 40) barra = "【▓▓▓░░░░░░░】";
    else if (porcentaje < 60) barra = "【▓▓▓▓▓░░░░░】";
    else if (porcentaje < 80) barra = "【▓▓▓▓▓▓▓░░░】";
    else barra = "【▓▓▓▓▓▓▓▓▓▓】";

    const embed = new EmbedBuilder()
        .setTitle(porcentaje >= 100 ? "✅ ¡META DE MEJORAS COMPLETADA!" : "🚀 Meta de Mejoras: Fase II")
        .setColor(porcentaje >= 100 ? 0x00FF00 : 0xFF73FA) // Verde si se logra, Rosa VIP si está en proceso
        .setDescription(`¡Vamos por **${CONFIG.META_NUEVA} nuevos boosts** para el servidor!\n\n**Progreso Actual:**\n\`${barra}\` **${porcentaje}%**\n\n📈 Nuevos: **${nuevosBoosts}** / ${CONFIG.META_NUEVA}\n📊 Total en BSLT: **${totalReal}**`)
        .addFields({ name: "⭐ Héroes del Servidor:", value: boostersList || "¡Sé el primero en apoyar!" })
        .setFooter({ text: "Sistema Automático de Metas BSLT" })
        .setTimestamp();

    return { 
        content: porcentaje >= 100 ? "📢 **¡LO LOGRAMOS!** @everyone" : "🚀 **¡La meta sigue avanzando!**", 
        embeds: [embed] 
    };
}

// ==========================================
// 4. EL DETECTOR INFALIBLE DE BOOSTS
// ==========================================
client.on('messageCreate', async message => {
    // Detecta cualquier tipo de mensaje automático de Boost de Discord
    const tiposDeBoost = [
        MessageType.GuildBoost,
        MessageType.GuildBoostTier1,
        MessageType.GuildBoostTier2,
        MessageType.GuildBoostTier3
    ];

    if (tiposDeBoost.includes(message.type)) {
        const canal = await client.channels.fetch(CONFIG.CANAL_BARRA_ID);
        const user = message.author;
        
        // --- MENSAJE 1: AGRADECIMIENTO SÚPER BONITO ---
        const embedGracias = new EmbedBuilder()
            .setTitle("💎 ¡NUEVO BOOST DETECTADO!")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias, ${user}, por mejorar el servidor!\n\nTu apoyo es increíble y nos ayuda muchísimo a crecer. ¡Disfruta de tus merecidas ventajas VIP en BSLT! 🌟`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 })) // Foto de perfil en alta calidad
            .setFooter({ text: "¡Un aplauso para nuestro booster!" });

        await canal.send({ content: `🎉 ¡Gracias totales, ${user}!`, embeds: [embedGracias] });

        // --- MENSAJE 2: BARRA DE PROGRESO ACTUALIZADA ---
        // Le damos 2 segunditos de pausa para asegurar que Discord haya actualizado el número total del servidor
        setTimeout(async () => {
            const dataBarra = await generarEmbedBoost(message.guild);
            await canal.send(dataBarra);
        }, 2000); 
    }
});

// ==========================================
// 5. COMANDOS Y ARRANQUE
// ==========================================
const commands = [
    new SlashCommandBuilder()
        .setName('probar-agradecimiento')
        .setDescription('Simula cómo se verá el mensaje bonito de agradecimiento')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);

client.on('ready', async () => {
    console.log(`✅ BSLT Bot Online y listo para agradecer. Base: ${CONFIG.BOOSTS_ACTUALES} boosts.`);
    try {
        await rest.put(Routes.applicationCommands(CONFIG.CLIENT_ID), { body: commands });
    } catch (e) { console.error("Error cargando comandos:", e); }
});

// Comando de prueba por si quieres ver el diseño sin gastar dinero
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'probar-agradecimiento') {
        const embedGracias = new EmbedBuilder()
            .setTitle("💎 ¡NUEVO BOOST DETECTADO! (Prueba)")
            .setColor(0xFF73FA)
            .setDescription(`¡Muchísimas gracias, ${interaction.user}, por mejorar el servidor!\n\nTu apoyo es increíble y nos ayuda muchísimo a crecer. ¡Disfruta de tus merecidas ventajas VIP en BSLT! 🌟`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: "¡Un aplauso para nuestro booster!" });
        await interaction.reply({ content: `🎉 ¡Gracias totales, ${interaction.user}!`, embeds: [embedGracias] });
    }
});

client.login(CONFIG.TOKEN);
