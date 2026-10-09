import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const entries = await readdir("dist", { recursive: true, withFileTypes: true });
const paths = entries
  .filter((e) => e.isFile() && e.name !== "sw.js")
  .map((e) => (e.parentPath + "/" + e.name).replace(/^dist\//, ""))
  .sort();
const hash = createHash("sha256");
for (const p of paths) hash.update(await readFile("dist/" + p));
const cache = "phone-office-" + hash.digest("hex").slice(0, 16);
const source = `const NAME=${JSON.stringify(cache)}, FILES=${JSON.stringify(paths)};
const base=self.registration.scope, urls=FILES.map(p=>new URL(p,base).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(NAME).then(cache=>cache.addAll(urls))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('phone-office-')&&k!==NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url); if(url.origin!==new URL(base).origin)return;
 const key=url.href.split('?')[0];
 const navigation=event.request.mode==='navigate'&&(url.pathname===new URL(base).pathname||url.pathname===new URL('index.html',base).pathname);
 if(!navigation&&!urls.includes(key))return;
 event.respondWith(caches.open(NAME).then(cache=>cache.match(navigation?new URL('index.html',base).href:key)).then(hit=>hit||fetch(event.request)));
});`;
await writeFile("dist/sw.js", source);
console.log("Offline shell:", paths.length, "files;", cache);
