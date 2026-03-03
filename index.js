const express = require("express");
const axios = require("axios");
const session = require("express-session");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true,
  })
);

const { BOT_TOKEN, CHAT_ID, PORT } = process.env;


const USER = {
  username: "admin",
  password: "1234",
};

async function sendTelegram(message) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: CHAT_ID,
    text: message,
  });
}

// Home page
app.get("/", (req, res) => {
  res.send(`
    <h2>Login</h2>
    <form method="POST" action="/login">
      <input name="username" placeholder="Username" required />
      <br><br>
      <input name="password" type="password" placeholder="Password" required />
      <br><br>
      <button type="submit">Login</button>
    </form>
  `);
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (username === USER.username && password === USER.password) {
    req.session.user = username;

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;

    const msg =
      `🔐 LOGIN ALERT\n\n` +
      `User: ${username}\n` +
      `IP Address: ${ip}\n` +
      `Time: ${new Date().toISOString()}`;

    try {
      await sendTelegram(msg);
    } catch (e) {
      console.log("Telegram error:", e.response?.data || e.message);
    }

    res.send("Login successful!");
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// Protected page
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.status(403).send("Access denied. Please login.");
  }
  res.send(`Welcome ${req.session.user}!`);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});