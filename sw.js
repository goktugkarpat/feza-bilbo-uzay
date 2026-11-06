'use strict';
const CACHE='feza-bilbo-mars-v35';
const CORE=['./','./index.html','./expedition.html','./hub.css','./hub.js','./hub-scene.js','./flight.js','./expedition-boot.js','./style.css','./core.js','./mars-weather.js','./world-assets.js','./world.js','./model-data/feza-original.js','./feza-astronaut.js','./model-data/bilbo-original.js','./bilbo-astronaut.js','./characters.js','./workshop-art.js','./play-guide.js','./space-sky.js','./space-textures.js','./sled-play.js','./activities.js','./mars-aerostat.js','./mars-samples.js','./mars-discoveries.js','./assets/orbit/saturn-surfaces.js','./saturn-sail.js','./saturn.js','./neptune.js','./jupiter.js','./venus.js','./assets/venus/scene-art.js','./family-postcard.js','./family-postcard-host.js','./footprints.js','./voices.js','./orbit-voices.js','./audio.js','./main.js','./vendor/three.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./assets/orbit/mars-globe.webp','./assets/orbit/saturn-globe.webp','./assets/orbit/neptune-globe.webp','./assets/orbit/jupiter-globe.webp','./assets/orbit/venus-globe.webp','./assets/orbit/earth-station.webp','./assets/orbit/station-cutout.webp','./assets/orbit/earth-art.js','./assets/orbit/shuttle.webp','./assets/orbit/liftoff.mp3'];
const pages=new Map(CORE.map(path=>[new URL(path,self.registration.scope).pathname,path]));
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(CORE.map(path=>new Request(path,{cache:'reload'})));await self.skipWaiting();})());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(k=>k.startsWith('feza-bilbo-mars-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==location.origin||!pages.has(url.pathname))return;
  // Use one release for the hub, iframe and scripts. A planet navigation has its
  // own HTML entry, even if the first visit to that planet happens offline.
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    return await cache.match(pages.get(url.pathname))||fetch(request);
  })());
});
