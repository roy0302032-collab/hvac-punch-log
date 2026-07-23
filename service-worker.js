// ========================================
// HVAC 缺失追蹤系統
// Safari 相容版 Service Worker
// ========================================

const CACHE_NAME = "hvac-punch-log-v3";

const STATIC_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./config.js",
    "./app.js",
    "./manifest.json"
];

// 安裝
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_FILES);
        })
    );

    self.skipWaiting();
});

// 啟用並刪除舊快取
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

// 只處理同網域的 GET 請求
self.addEventListener("fetch", event => {
    const request = event.request;
    const requestUrl = new URL(request.url);

    // 不處理 POST、PUT 等請求
    if (request.method !== "GET") {
        return;
    }

    // 不攔截 Supabase、CDN 或其他外部網域
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    // 網頁導覽：網路優先，失敗才回首頁快取
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                return cache.match("./index.html");
            })
        );

        return;
    }

    // CSS、JS、圖片：網路優先，失敗才讀快取
    event.respondWith(
        fetch(request)
            .then(response => {
                if (!response || response.status !== 200) {
                    return response;
                }

                const responseClone = response.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseClone);
                });

                return response;
            })
            .catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                return cache.match(request);
            })
    );
});