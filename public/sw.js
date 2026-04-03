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

    const url = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true })
            .then(function (clientList) {
                for (const client of clientList) {
                    if (client.url === url && "focus" in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});