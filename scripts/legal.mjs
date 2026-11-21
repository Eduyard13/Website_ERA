import {readFileSync} from 'node:fs';
import {escapeContact as escape} from './contact-channels.mjs';

const approved = readFileSync(new URL('../content/era-legal-0481.md', import.meta.url), 'utf8');
const [, policy, consent, cookies] = approved.split(/^# 0[1-3]\. [^\n]+\n\n/gm);
const documentBody = text => text.split(/^---$|^## Подпись под формой заявки$/m)[0].trim();
export const consentRevision = 'ERA-PD-1.3';
export const legalPages = {
 '/privacy': {title:'Политика обработки персональных данных', revision:'ERA-PRIVACY-1.3', file:'ERA_Personal_Data_Policy.pdf', body:documentBody(policy)},
 '/privacy/consent': {title:'Согласие на обработку персональных данных', revision:consentRevision, file:'ERA_Consent_Personal_Data.pdf', body:documentBody(consent)},
 '/privacy/cookies': {title:'Правила использования cookies и технологий браузера', revision:'ERA-COOKIES-1.3', file:'ERA_Cookies_Policy.pdf', body:documentBody(cookies)},
};
const copy = heading => approved.split(`\n## ${heading}\n\n`)[1].split('\n\n')[0];
const inlineLinks = (text, newTab = false) => escape(text).replace(/\[([^\]]+)\]\((\/privacy\/(?:consent\/|cookies\/)?)\)/g,
  (_, label, href) => `<a href="${href}"${newTab?' target="_blank" rel="noopener"':''}>${label}</a>`);
const contactLinks = text => escape(text).replace(/https:\/\/era-cycle\.ru\/(?:privacy\/(?:consent\/|cookies\/)?)?|edkom\.office@mail\.ru|info@era-cycle\.ru|\+7 985 559-19-80/g, value => {
 const href = value.startsWith('https:') ? new URL(value).pathname : value.startsWith('+') ? `tel:${value.replace(/[^+\d]/g,'')}` : `mailto:${value}`;
 return `<a href="${href}">${value}</a>`;
});

export function legalPage(path){
 const {title, revision, file, body} = legalPages[path];
 const blocks = body.split(/\n\n+/).map(block => block.startsWith('## ')
  ? `<h2>${escape(block.slice(3))}</h2>` : `<p>${contactLinks(block)}</p>`).join('\n');
 return `<article class="section legal-page" data-policy-status="approved" data-pd-revision="${revision}"><h1>${title}</h1><p class="legal-edition">${revision} · <time datetime="2026-11-21">21.11.2026</time></p><div class="legal-document">${blocks}</div><div class="legal-download"><a class="button" href="/privacy/files/${file}" type="application/pdf" download>Скачать PDF</a>${path==='/privacy/cookies'?cookieSettingsButton():''}</div></article>`;
}

export function requestConsent(prefix){
 const [label, links] = copy('Подпись под формой заявки').slice(4).split(/ (?=\[Полный текст согласия\])/);
 return `<input type="hidden" name="consent_revision" value="${consentRevision}"><div class="request-consent"><input id="${prefix}-consent" name="Согласие" type="checkbox" value="1" required aria-describedby="${prefix}-consent-links"><div><label for="${prefix}-consent">${escape(label)}</label><div id="${prefix}-consent-links">${inlineLinks(links,true)}</div></div></div>`;
}

export function cookieSettingsButton(){
 return '<button type="button" data-cookie-settings aria-haspopup="dialog" aria-controls="cookie-settings" hidden>Настройки cookies</button>';
}

export function cookieBanner(){
 return `<aside class="cookie-notice" data-cookie-notice aria-label="Использование cookies" hidden><p>${inlineLinks(copy('Текст уведомления о cookies'))}</p><div class="cookie-actions"><button type="button" data-cookie-choice="allow">Разрешить карты</button><button type="button" data-cookie-choice="deny">Отклонить</button><button type="button" data-cookie-settings aria-haspopup="dialog" aria-controls="cookie-settings">Настроить</button></div></aside>`;
}

export function cookieDialog(){
 return `<dialog class="cookie-dialog" id="cookie-settings" aria-labelledby="cookie-settings-title"><div class="cookie-dialog-heading"><h2 id="cookie-settings-title">Настройки cookies</h2><button type="button" data-cookie-close aria-label="Закрыть настройки cookies">Закрыть</button></div><form method="dialog" data-cookie-form><h3>Необходимые технические настройки</h3><p>Валютный виджет и навигация используют настройки браузера для работы сайта.</p><fieldset><legend>Необязательные встроенные карты</legend><p>При загрузке карты поставщик может получить IP-адрес, сведения о браузере и установить собственные cookies. Карты доступны после вашего разрешения и включения сервиса оператором.</p><div class="cookie-options"><label><input type="radio" name="maps" value="allow" required>Разрешить карты</label><label><input type="radio" name="maps" value="deny" required>Отклонить</label></div></fieldset><div class="cookie-dialog-actions"><button class="button" type="submit">Сохранить выбор</button><a href="/privacy/cookies/">О cookies</a></div></form></dialog>`;
}
