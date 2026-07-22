const cacheName = "hvac-punch-v1";


const files = [

"./",

"./index.html",

"./style.css",

"./app.js"

];



self.addEventListener(
"install",
event=>{


event.waitUntil(

caches.open(cacheName)

.then(cache=>{

return cache.addAll(files);

})

);


});





self.addEventListener(
"fetch",
event=>{


event.respondWith(

caches.match(event.request)

.then(response=>{


return response || fetch(event.request);


})

);


});