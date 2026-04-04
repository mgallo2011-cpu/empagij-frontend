self.addEventListener("push", function (event) {
    let data = {};

    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: "Empagij",
            body: "Nuova notifica",
        };
    }

    const title = data.title || "Empagij";
    const options = {
        body: data.body || "",
        data: {
            url: data.url || "/",
        },
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const relativeUrl = event.notification.data?.url || "/";
    const absoluteUrl = new URL(relativeUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
            for (const client of clientList) {
                const clientUrl = new URL(client.url);

                if (clientUrl.origin === self.location.origin && "focus" in client) {
                    return client.focus().then(function () {
                        if ("navigate" in client && client.url !== absoluteUrl) {
                            return client.navigate(absoluteUrl);
                        }
                        return client;
                    });
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(absoluteUrl);
            }
        })
    );
});