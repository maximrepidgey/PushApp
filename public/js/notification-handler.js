let id = document.getElementById("user_id").value;
socket.on("notification for " + id, async (msg) => {
    try {
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        let notification = await fetch("/workouts/notification/" + msg.notificationId, {method: "GET", headers});
        let dot = document.getElementById("notification-btn");
        dot.className = "notification";
        let div = document.getElementById("dropdown1");
        let pathToTemplate = "dashboard_partials/notification";

        if (msg.typeofMessage === "text") {
            pathToTemplate = "dashboard_partials/notification-message";
        }
        dust.render(pathToTemplate, {notification: msg}, (err, out) => {
            div.innerHTML = out + div.innerHTML;
            dot.className = "notification";
        });
    } catch (e) {
        console.log(e);
    }
});


getNotifications = async () => {
    try {
        let div = document.getElementById("dropdown1");
        let dot = document.getElementById("notification-btn");

        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        let notifications = await fetch("/workouts/notification/", {method: "GET", headers});
        notifications = await notifications.json();
        notifications.notifications.forEach(notification => {
            let pathToTemplate = "dashboard_partials/notification";
            if (notification.typeofMessage === "text") {
                pathToTemplate = "dashboard_partials/notification-message";
            }
            dust.render(pathToTemplate, {notification: notification}, (err, out) => {
                div.innerHTML = out + div.innerHTML;
                dot.className = "notification";
            });

        });
    } catch (e) {
        console.log(e);
    }
};

removeDotNotification = (event) => {
    let dot = document.getElementById("notification-btn");
    dot.className = dot.className.replace("notification", "");
};


sendMessage = async () => {
    try {
        let messageInput = document.getElementById("notification-message");
        let message = messageInput.value;
        messageInput.value = "";
        let clientId = document.getElementById("notified-clientId").value;
        let coachId = document.getElementById("notified-coachId").value;
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        let msg = {
            for: clientId,
            from: coachId,
            comments: message,
            typeofMessage: "text" // or update
        };

        let body = {
            from: msg.from,
            for: msg.for,
            comments: message,
            typeofMessage: "text",
        };
        let notification = await fetch("/workouts/notification", {
            method: "POST",
            headers,
            body: JSON.stringify(body)
        });
        notification = await notification.json();
        //Emit the notification
        msg.notificationId = notification.notification._id;

        console.log(msg);
        socket.emit('notification', msg);
    } catch (e) {
        console.log(e);
    }
};

getNotifications();
