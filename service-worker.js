// 暫時停用 PWA Service Worker
// 用來解除舊版 Service Worker 並清除快取

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        return caches.delete(cacheName);
                    })
                );
            }),

            self.registration.unregister(),

            self.clients.matchAll({
                type: "window",
                includeUncontrolled: true
            }).then(clients => {
                clients.forEach(client => {
                    client.navigate(client.url);
                });
            })
        ])
    );
});

// 故意不建立 fetch 事件
// 讓所有網路請求直接交給瀏覽器處理