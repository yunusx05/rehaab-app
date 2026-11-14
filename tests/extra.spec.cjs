const { test, expect } = require('@playwright/test');
global.window = global;
const PT = require('../personal-engine.js');
const SK = require('../basket-skills.js');
const BP = require('../basket-pathway.js');
const SP = require('../season-plan.js');

/* Lot 41 : Extra (séances à la carte), Plan = semaine du planning, QI et nutrition hors de la navigation. */
const player = () => {
  const s = PT.initialState();
  s.profile = {...s.profile, onboarded:true, name:'Test', age:'30', experience:'regular', impactReady:true};
  s.owned = ['bodyweight','dumbbells','kettlebell','barbell','bench','bands','ball','hoop','court','cones','miniband','sliders','vest','outdoor'];
  s.checkIn = {...s.checkIn, equipment:s.owned};
  s.skills = SK.saveProfile(null, {answers:{}, tests:{}});
  return s;
};
async function seed(page, data, route) {
  await page.addInitScript(({data, key}) => {if (!sessionStorage.getItem('test-seeded')) {localStorage.setItem(key, JSON.stringify(data)); sessionStorage.setItem('test-seeded', '1');}}, {data, key:PT.STORAGE_KEY});
  await page.goto('/#' + route); await expect(page.locator('.personal-app')).toBeVisible({timeout:20000});
}
const state = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), PT.STORAGE_KEY);
const noOverflow = async page => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

test('Extra : un seul thème, à un seul endroit, dans la durée choisie, au niveau choisi', () => {
  const s = player();
  for (const theme of Object.keys(SK.EXTRA)) for (const minutes of [10, 20, 30, 45, 60]) {
    const court = SK.areaSession(PT, s, {theme, minutes, court:true});
    if (court.error) continue;
    expect(court.source).toBe('extra');
    expect(court.exercises.every(e => SK.EXTRA[theme].areas.includes(e.area)), `${theme} ${minutes}`).toBe(true);
    expect(court.estimatedMinutes, `${theme} ${minutes}`).toBeLessThanOrEqual(minutes + 2);
    const home = SK.areaSession(PT, s, {theme, minutes, court:false});
    if (!home.error) expect(home.exercises.every(e => e.needs.every(n => n === 'ball')), `${theme} maison`).toBe(true);
  }
  // Niveau choisi : aucun exercice au-dessus, et le niveau Avancé propose bien de l'avancé.
  const hard = SK.areaSession(PT, s, {theme:'finish', minutes:30, tier:3, court:true});
  expect(hard.exercises.every(e => e.skillTier <= 3)).toBe(true);
  expect(hard.exercises.some(e => e.skillTier === 3)).toBe(true);
  const easy = SK.areaSession(PT, s, {theme:'finish', minutes:30, tier:1, court:true});
  expect(easy.exercises.every(e => e.skillTier <= 1 || e.tiredFinisher)).toBe(true);
  // Finition sans panier : impossible, la séance le dit au lieu d'inventer.
  expect(SK.areaSession(PT, s, {theme:'finish', minutes:30, court:false}).error).toMatch(/terrain/);
  // Les nouvelles finitions pour s'entraîner seul existent et ont une vidéo source.
  global.window.RehaabSources = undefined; require('../drill-sources.js');
  for (const id of ['sk-chairs-high','sk-left-layup','sk-contact-high','sk-mikan-var','sk-same-foot','sk-ladder-cross','sk-ladder-btl'])
    expect(global.window.RehaabSources[id] && global.window.RehaabSources[id][0].url, id).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
});

test('Extra : haut et bas du corps, les gros mouvements d’abord, durée tenue', () => {
  const s = player();
  for (const zone of ['upper','lower']) for (const minutes of [10, 30, 60]) {
    const p = PT.zoneSession(s, {zone, minutes, equipment:s.owned.filter(n => !['court','hoop','outdoor'].includes(n))});
    expect(p.error).toBeUndefined();
    expect(p.estimatedMinutes).toBeLessThanOrEqual(minutes + 3);
    const pats = zone === 'upper' ? ['push','pull','arms'] : ['squat','hinge','calf'];
    expect(p.exercises.every(e => pats.includes(e.pattern))).toBe(true);
    expect(['push','pull','squat','hinge']).toContain(p.exercises[0].pattern);
  }
  expect(PT.zoneSession(s, {zone:'upper', minutes:60, equipment:s.owned}).exercises.length).toBeGreaterThanOrEqual(6);
});

test('planning : une journée ne dépasse pas la durée maximale (skills raccourcis à côté de la vivacité)', () => {
  const s = player();
  s.dossier = {answers:{maxMinutes:'60', freeDays:[0,1,2,3,4,5,6], sessions:'3'}};
  const monday = SP.mondayOf(PT.dateKey());
  const w = SP.weekSchedule(s, monday, monday);
  for (const d of w.days) {
    const total = d.items.filter(x => x.type !== 'care').reduce((n, x) => n + x.minutes, 0);
    if (d.items.some(x => x.type === 'skills') && d.items.filter(x => x.type !== 'care').length > 1) expect(total, d.date).toBeLessThanOrEqual(60);
  }
});

test('écrans : 4 onglets, Extra lance la séance affichée, le Plan montre la semaine du planning', async ({page}) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({width:375, height:780});
  const data = player(); data.pathway = BP.create();
  await seed(page, data, 'extra');
  await expect(page.locator('.bottom-nav button')).toHaveText(['Aujourd’hui','Plan','Extra','Moi']);
  await page.getByRole('button', {name:'Finition', exact:true}).click();
  await page.getByRole('button', {name:'20 min', exact:true}).click();
  await page.getByRole('button', {name:/^Avancé/}).click();
  const shown = await page.locator('.extra-list li span').allTextContents();
  expect(shown.length).toBeGreaterThan(1);
  await noOverflow(page);
  await page.getByRole('button', {name:/Lancer cette séance/}).click();
  await expect(page.getByRole('button', {name:/Rien à signaler|Démarrer la séance/}).first()).toBeVisible();
  await expect.poll(async () => (await state(page)).draft?.source).toBe('extra');
  const draft = (await state(page)).draft;
  expect(draft.exercises.map(e => e.name)).toEqual(shown);
  await page.locator('.bottom-nav button', {hasText:'Plan'}).click();
  await expect(page.locator('.plan-days li')).toHaveCount(7);
  await expect(page.locator('.plan-day.is-today')).toHaveCount(1);
  await noOverflow(page);
  expect(errors).toEqual([]);
});
