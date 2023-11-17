// config http
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const app = express();
const path = require("path");
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.render("home");
});
app.get("/notification", (req, res) => {
  let { user_id } = req.query;
  let db = require("./db.json");
  let notifications = db.notifications;
  if (user_id) {
    notifications = notifications.filter((i) => i.user_id == user_id);
  }

  res.render("notification", { notifications, user_id });
});

app.post("/notification", (req, res) => {
  let { user_id, title, body } = req.body;
  let db = require("./db.json");
  console.log(user_id);
  let newNotification = {
    id: db.notification_id++,
    user_id,
    title,
    body,
    is_read: false,
  };
  db.notifications.push(newNotification);

  // save to database
  fs.writeFileSync("./db.json", JSON.stringify(db, null, 4));

  // send new notification
  io.emit(`user-${user_id}`, newNotification);

  res.json({
    status: true,
    data: newNotification,
  });
});

app.get("/notification/:notif_id/mark-is-read", (req, res) => {
  const { notif_id } = req.params;
  let db = require("./db.json");
  const findNotifIndex = db.notifications.findIndex(
    (val) => val.id == notif_id
  );

  if (findNotifIndex !== -1) {
    db.notifications[findNotifIndex].is_read = true;
    fs.writeFileSync("./db.json", JSON.stringify(db, null, 4));
    io.emit(`user-${db.notifications[findNotifIndex].user_id}`,  db.notifications[findNotifIndex]);
    res.redirect(
      `/notification?user_id=${db.notifications[findNotifIndex].user_id}`
    );
  } else {
    res.json({ message: "Notification not found." });
  }
});

// config websocket

const server = require("http").createServer(app);
const io = require("socket.io")(server);
io.on("connection", (client) => {
  console.log("new user connected");
});


const { PORT = 8000 } = process.env;
server.listen(PORT, () => {
  console.log("Running at http://localhost:" + PORT);
});
