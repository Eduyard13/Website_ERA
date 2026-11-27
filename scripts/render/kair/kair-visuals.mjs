const paths={
 check:'m5 12 4 4L19 6',
 flow:'M4 7h5v5H4zM15 12h5v5h-5zM9 9h9m0 0-3-3m3 3-3 3M6 12v6h9',shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',screen:'M3 4h18v13H3zM8 21h8m-4-4v4M6 12l3-3 3 3 5-5',cycle:'M4 10a8 8 0 0 1 14-5l2 2m0-5v5h-5M20 14a8 8 0 0 1-14 5l-2-2m0 5v-5h5',water:'M12 2C9 7 5 10 5 15a7 7 0 0 0 14 0c0-5-4-8-7-13ZM9 16c0 2 1 3 3 3',nodes:'M9 9h6v6H9zM2 2h4v4H2zM18 2h4v4h-4zM2 18h4v4H2zM18 18h4v4h-4zM6 6l3 3m6 0 3-3M6 18l3-3m6 0 3 3',
 database:'M4 6c0-2 3.6-3 8-3s8 1 8 3-3.6 3-8 3-8-1-8-3Zm0 0v12c0 2 3.6 3 8 3s8-1 8-3V6M4 12c0 2 3.6 3 8 3s8-1 8-3',
 sensor:'M3 12h4l3-7 4 14 3-7h4M4 5h2m12 14h2',
 camera:'M3 7h13v10H3zM16 10l5-3v10l-5-3M6 20h7',
 temperature:'M10 14V5a2 2 0 0 1 4 0v9a5 5 0 1 1-4 0Zm2-6v9m5-10h3m-3 4h3',
 controller:'M6 6h12v12H6zM9 9h6v6H9zM9 2v4m6-4v4m-6 12v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4',
 controls:'M3 6h18M3 12h18M3 18h18M8 3v6m8 0v6m-6 0v6',
 stack:'m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 4 9 5 9-5',
 volume:'M3 9h4l5-5v16l-5-5H3zM15 9c2 1 2 5 0 6m3-8c3 2 3 8 0 10',
 load:'M4 17a8 8 0 1 1 16 0zM12 14l4-5M6 13h2m8 0h2',
};
export const kairIcon=name=>`<svg class="ka-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${paths[name]||paths.flow}" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const benefitIcons={
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z M8 12l3 3 5-6"/>',
 chart:'<path d="M3 3v18h18M7 16l5-6 4 3 5-7M17 6h4v4"/>',
 coins:'<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v5c0 1.7 2.7 3 6 3 1 0 2-.1 3-.4M3 11v5c0 1.7 2.7 3 6 3"/><ellipse cx="16" cy="13" rx="5" ry="2.5"/><path d="M11 13v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-5"/>',
 network:'<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
};
export const kairBenefitIcon=name=>`<svg class="ka-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${benefitIcons[name]}</svg>`;
