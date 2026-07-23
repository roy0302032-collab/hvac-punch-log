// ========================================
// HVAC 缺失追蹤系統
// PWA Service Worker
// ========================================

const CACHE_NAME = "hvac-punch-log-v2";

const STATIC_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./config.js",
    "./app.js",
    "./manifest.json"
];

// 安裝：快取必要檔案
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_FILES);
        })
    );

    self.skipWaiting();
});

// 啟用：刪除舊版本快取
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );

    self.clients.claim();
});

// 讀取策略：網路優先，失敗才使用快取
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                const responseClone = response.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });

                return response;
            })
            .catch(() => {
                return caches.match(event.request).then(cachedResponse => {
                    return cachedResponse || caches.match("./index.html");
                });
            })
    );
});