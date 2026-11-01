import {navigationGroups} from '../content/navigation.mjs';
import {siteContacts} from '../content/contact.mjs';
import {exchangeRateBar} from './fx.mjs';
export function siteFooter(){
 return `<footer id="site-footer" class="site-footer era-indigo-surface"><div class="footer-identity"><a class="brand" href="/" aria-label="ЭРА — на главную"><img src="/assets/logo.png" alt="ЭРА" width="125" height="51" loading="lazy"></a><p>Полный цикл переработки плёнки:<br>очистить, переработать, использовать снова.</p><div class="footer-contacts"><a href="${siteContacts.phoneHref}">${siteContacts.phone}</a><a href="mailto:${siteContacts.email}">${siteContacts.email}</a></div></div><nav class="footer-nav" aria-label="Разделы сайта">${navigationGroups.map((group,i)=>`<section class="footer-nav-group" aria-labelledby="footer-group-${i}"><h2 id="footer-group-${i}">${group.label}</h2>${group.links.map(link=>`<a href="${link.href}">${link.label}</a>`).join('')}</section>`).join('')}</nav>${exchangeRateBar()}<div class="footer-legal"><span>© 2026 ЭРА</span><span>Экология · Рециклинг · Автоматизация</span></div></footer>`;
}
