const CACHE = 'rehaab-v11-cards';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './personal.css',
  './live-session.css',
  './sport.css',
  './personal-app.jsx',
  './visual-components.jsx',
  './sport-components.jsx',
  './live-session.jsx',
  './exercise-media.js',
  './vendor/gsap.min.js',
  './vendor/ScrollTrigger.min.js',
  './media/fonts/cabinet.css',
  './media/fonts/cabinet-400.woff2',
  './media/fonts/cabinet-500.woff2',
  './media/fonts/cabinet-700.woff2',
  './media/fonts/cabinet-800.woff2',
  './media/fonts/barlow.css',
  './media/fonts/barlow-0.ttf',
  './media/fonts/barlow-1.ttf',
  './media/training-floor.jpg',
  './media/video-credits.json',
  './media/cards/wall-pushup.jpg',
  './media/cards/band-row.jpg',
  './media/cards/reverse-lunge.jpg',
  './media/cards/db-lunge.jpg',
  './media/cards/rdl.jpg',
  './media/cards/kb-deadlift.jpg',
  './media/cards/calf.jpg',
  './media/cards/bike-interval.jpg',
  './media/cards/walk.jpg',
  './media/cards/run.jpg',
  './media/cards/march.jpg',
  './media/cards/stepjack.jpg',
  './media/cards/hip-flexor.jpg',
  './media/cards/shoulder-mob.jpg',
  './media/cards/landing.jpg',
  './media/cards/pogo.jpg',
  './media/cards/lateral-hop.jpg',
  './media/cards/dribble.jpg',
  './media/cards/weak-hand.jpg',
  './media/cards/crossover.jpg',
  './media/cards/form-shoot.jpg',
  './media/cards/layup.jpg',
  './media/cards/pivot.jpg',
  './media/cards/reaction.jpg',
  './media/cards/pass.jpg',
  './media/cards/band-shuffle.jpg',
  './media/cards/halo.jpg',
  "./media/Pushups/0.jpg",
  "./media/Pushups/1.jpg",
  "./media/Dumbbell_Bench_Press/0.jpg",
  "./media/Dumbbell_Bench_Press/1.jpg",
  "./media/videos/db-press.mp4",
  "./media/videos/db-press.jpg",
  "./media/Dumbbell_Floor_Press/0.jpg",
  "./media/Dumbbell_Floor_Press/1.jpg",
  "./media/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
  "./media/Barbell_Bench_Press_-_Medium_Grip/1.jpg",
  "./media/videos/bb-press.mp4",
  "./media/videos/bb-press.jpg",
  "./media/One-Arm_Dumbbell_Row/0.jpg",
  "./media/One-Arm_Dumbbell_Row/1.jpg",
  "./media/Bent_Over_Barbell_Row/0.jpg",
  "./media/Bent_Over_Barbell_Row/1.jpg",
  "./media/Seated_Cable_Rows/0.jpg",
  "./media/Seated_Cable_Rows/1.jpg",
  "./media/videos/cable-row.mp4",
  "./media/videos/cable-row.jpg",
  "./media/Wide-Grip_Lat_Pulldown/0.jpg",
  "./media/Wide-Grip_Lat_Pulldown/1.jpg",
  "./media/Pullups/0.jpg",
  "./media/Pullups/1.jpg",
  "./media/videos/pullup.mp4",
  "./media/videos/pullup.jpg",
  "./media/Dumbbell_Shoulder_Press/0.jpg",
  "./media/Dumbbell_Shoulder_Press/1.jpg",
  "./media/videos/db-shoulder.mp4",
  "./media/videos/db-shoulder.jpg",
  "./media/Side_Lateral_Raise/0.jpg",
  "./media/Side_Lateral_Raise/1.jpg",
  "./media/videos/lateral.mp4",
  "./media/videos/lateral.jpg",
  "./media/Hammer_Curls/0.jpg",
  "./media/Hammer_Curls/1.jpg",
  "./media/videos/curl.mp4",
  "./media/videos/curl.jpg",
  "./media/Bodyweight_Squat/0.jpg",
  "./media/Bodyweight_Squat/1.jpg",
  "./media/Goblet_Squat/0.jpg",
  "./media/Goblet_Squat/1.jpg",
  "./media/Dumbbell_Squat/0.jpg",
  "./media/Dumbbell_Squat/1.jpg",
  "./media/Barbell_Full_Squat/0.jpg",
  "./media/Barbell_Full_Squat/1.jpg",
  "./media/Barbell_Deadlift/0.jpg",
  "./media/Barbell_Deadlift/1.jpg",
  "./media/Butt_Lift_Bridge/0.jpg",
  "./media/Butt_Lift_Bridge/1.jpg",
  "./media/Leg_Press/0.jpg",
  "./media/Leg_Press/1.jpg",
  "./media/videos/legpress.mp4",
  "./media/videos/legpress.jpg",
  "./media/Leg_Extensions/0.jpg",
  "./media/Leg_Extensions/1.jpg",
  "./media/Lying_Leg_Curls/0.jpg",
  "./media/Lying_Leg_Curls/1.jpg",
  "./media/videos/legcurl.mp4",
  "./media/videos/legcurl.jpg",
  "./media/Dead_Bug/0.jpg",
  "./media/Dead_Bug/1.jpg",
  "./media/Plank/0.jpg",
  "./media/Plank/1.jpg",
  "./media/Farmers_Walk/0.jpg",
  "./media/Farmers_Walk/1.jpg",
  "./media/Cat_Stretch/0.jpg",
  "./media/Cat_Stretch/1.jpg",
  "./media/Rope_Jumping/0.jpg",
  "./media/Rope_Jumping/1.jpg",
  "./media/Incline_Dumbbell_Press/0.jpg",
  "./media/Incline_Dumbbell_Press/1.jpg",
  "./media/videos/incline.mp4",
  "./media/videos/incline.jpg",
  "./media/Standing_Dumbbell_Triceps_Extension/0.jpg",
  "./media/Standing_Dumbbell_Triceps_Extension/1.jpg",
  "./media/videos/overhead-triceps.mp4",
  "./media/videos/overhead-triceps.jpg",
  "./media/Bench_Dips/0.jpg",
  "./media/Bench_Dips/1.jpg",
  './personal-engine.js',
  './program-data.js',
  './media/ATTRIBUTION.md',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7.23.5/babel.min.js'
];
// Only the app shell and its public libraries are cached. Account, profile and sync traffic must always hit the network.
const CACHEABLE_HOSTS = ['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(PRECACHE.map(u => c.add(u).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Navigation : réseau d'abord. Autres fichiers : cache avec mise à jour en arrière-plan.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !CACHEABLE_HOSTS.includes(url.hostname)) return;
  if (sameOrigin && url.pathname.startsWith('/api/')) return;

  // Native video players request byte ranges, including when seeking offline.
  if (e.request.headers.has('range') && /\.(mp4|webm)$/i.test(url.pathname)) {
    e.respondWith((async () => {
      const cached = await caches.match(e.request.url);
      if (!cached || cached.status !== 200) return fetch(e.request);
      const buffer = await cached.arrayBuffer(), size = buffer.byteLength;
      const range = /^bytes=(\d*)-(\d*)$/.exec(e.request.headers.get('range'));
      if (!range || (!range[1] && !range[2])) return new Response(null, {status:416,headers:{'Content-Range':`bytes */${size}`}});
      const start = range[1] ? Number(range[1]) : Math.max(0,size-Number(range[2]));
      const end = range[1] && range[2] ? Math.min(size-1,Number(range[2])) : size-1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start> end || start>=size) return new Response(null, {status:416,headers:{'Content-Range':`bytes */${size}`}});
      return new Response(buffer.slice(start,end+1), {status:206,headers:{'Content-Type':cached.headers.get('Content-Type')||'video/mp4','Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${size}`,'Accept-Ranges':'bytes'}});
    })());
    return;
  }

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', clone));
        return res;
      }).catch(async () => {
        const cached = await caches.match('./index.html');
        if (!cached) return Response.error();
        // Static hosts can redirect /index.html to /. A redirected cached response
        // cannot satisfy a navigation in manual redirect mode, so rebuild it.
        return new Response(await cached.arrayBuffer(), {
          status: cached.status, statusText: cached.statusText, headers: cached.headers
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
