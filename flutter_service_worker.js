'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "efcada937a1f51ffdd096979cfc1e1b9",
"favicon.ico": "ae12a540923f2823943bb4b6e7460f9b",
"index.html": "9999ef1011dba4633b793e342cc5dbae",
"/": "9999ef1011dba4633b793e342cc5dbae",
"main.dart.js": "cb649884ef474ee17f3f0d39b9a55586",
"icons/Icon-192.png": "0597a38af34a61d953c90433235f9d81",
"manifest.json": "8c0282967c0e70794dd7bf7fab54358c",
"assets/svg/cloudy-day-2.svg": "b931d84d75a673fdd8ae1134fefd98ba",
"assets/svg/snowy-2.svg": "d103c77cf7f40bc52812fe945ddd3cfa",
"assets/svg/snowy-5.svg": "3def7c9fb95731ac622871fb6925d5f6",
"assets/svg/thunder.svg": "7142c78bba5ddb0b77c3ccddcebe96ab",
"assets/svg/day.svg": "7f93fbdb8a9d02fe414c0a0119b77bd4",
"assets/svg/icon.svg": "e967ae39edd4bf5f42f57e487aa8eff0",
"assets/svg/cloudy-night-3.svg": "bf91ac0f97cf729862dfaeb8fc25e037",
"assets/svg/rainy-5.svg": "2bd236411dc612e871d9c314239c3fa7",
"assets/svg/night.svg": "a3f3f38d2c17971938ebd891fb6bbd0c",
"assets/svg/rainy-3.svg": "c17e7a5d3d1b7d702bc8c640a36f68c6",
"assets/svg/cloudy.svg": "ad789581dd3bfe802dd2e6ea0c2f5caa",
"assets/images/good.png": "816d086afc61748b03faee0f419c0f2a",
"assets/images/icon.png": "0b46fff72056026d93d57d964a0ef231",
"assets/images/moderate.png": "ee501e0af311e8259949a6b63e798a10",
"assets/images/fair.png": "66e94f4cddce5f927a0d568eca1edcd3",
"assets/images/background.jpg": "fef0b1496c2e4a442a6c8c040745b47a",
"assets/images/poor.png": "bf0c17fdb7a481bdd8b2c89a18411833",
"assets/images/bad.png": "6d57187d799a30d1a4d869542d1c7b79",
"assets/images/background2.jpeg": "1daef613c93d3c145fca8c2bc9e33549",
"assets/AssetManifest.json": "71a85aa0dbb705700701b524580b8e9b",
"assets/NOTICES": "da76c01c678457fcf08cbe82694b7d23",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"assets/fonts/MaterialIcons-Regular.otf": "4e6447691c9509f7acdbf8a931a85ca1"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
