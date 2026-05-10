const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require("fs");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
require("dotenv").config({ path: "../.env"});

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

const DB_PATH = "./users.json";
const LP_PATH = "./lps.json";

const loadUsers = () => {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
};

const saveUsers = (users) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
};

const loadLps = () => {
    if (!fs.existsSync(LP_PATH)) return [];
    return JSON.parse(fs.readFileSync(LP_PATH, "utf-8"));
};

const saveLps = (lps) => {
    fs.writeFileSync(LP_PATH, JSON.stringify(lps, null, 2));
};

let users = loadUsers();
let lps = loadLps();

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const nickname = profile.displayName;

    let user = users.find(u => u.email === email);
    if (!user) {
        users.push({ email, password: null, nickname });
        saveUsers(users);
    }

    return done(null, { email, nickname });
}));

app.post("/api/auth/signup", async (req, res) => {
    const { email, password, nickname } = req.body;

    const exists = users.find(u => u.email === email);
    if (exists) return res.status(400).json({ message: "이미 존재하는 이메일입니다." });

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ email, password: hashedPassword, nickname });
    saveUsers(users);

    res.status(201).json({ message: "회원가입 성공" });
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ message: "이메일 또는 비밀번호가 틀렸습니다." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "이메일 또는 비밀번호가 틀렸습니다." });

    const accessToken = jwt.sign(
        { email: user.email, nickname: user.nickname },
        process.env.JWT_SECRET,
        { expiresIn: "3s" }
    );
    const refreshToken = jwt.sign(
        { email: user.email },
        process.env.REFRESH_JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({ accessToken, refreshToken, nickname: user.nickname });
});

app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "로그아웃 성공" });
});

app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "토큰 없음" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
        const accessToken = jwt.sign(
            { email: decoded.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.json({ accessToken });
    } catch {
        res.status(403).json({ message: "유효하지 않은 토큰" });
    }
});

app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get("/v1/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        const user = req.user;

        const accessToken = jwt.sign(
            { email: user.email, nickname: user.nickname },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        const refreshToken = jwt.sign(
            { email: user.email },
            process.env.REFRESH_JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.redirect(`http://localhost:5173/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&nickname=${user.nickname}`);
    }
);

// LP 목록 조회
app.get("/v1/lps", (req, res) => {
    const sort = req.query.sort || "newest";
    const sorted = [...lps].sort((a, b) => {
        if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
    res.json(sorted);
});

// LP 추가
app.post("/v1/lps", (req, res) => {
    const { title, artist, cover } = req.body;
    if (!title || !artist) return res.status(400).json({ message: "제목과 아티스트는 필수입니다." });

    const newLp = {
        id: Date.now(),
        title,
        artist,
        cover: cover || "https://via.placeholder.com/300x300/222/fff?text=LP",
        likes: 0,
        createdAt: new Date().toISOString(),
    };

    lps.push(newLp);
    saveLps(lps);

    res.status(201).json(newLp);
});

app.listen(process.env.PORT, () => {
    console.log(`서버 실행 중: http://localhost:${process.env.PORT}`);
});

app.get("/v1/lps/:id", (req, res) => {
    const lp = lps.find(l => l.id === Number(req.params.id));
    if (!lp) return res.status(404).json({ message: "LP를 찾을 수 없습니다." });
    res.json(lp);
});

app.patch("/v1/lps/:id", (req, res) => {
    const idx = lps.findIndex(l => l.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ message: "LP를 찾을 수 없습니다." });
    lps[idx] = { ...lps[idx], ...req.body };
    saveLps(lps);
    res.json(lps[idx]);
});

app.delete("/v1/lps/:id", (req, res) => {
    const idx = lps.findIndex(l => l.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ message: "LP를 찾을 수 없습니다." });
    lps.splice(idx, 1);
    saveLps(lps);
    res.json({ message: "삭제 완료" });
});

app.post("/v1/lps/:id/like", (req, res) => {
    const idx = lps.findIndex(l => l.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ message: "LP를 찾을 수 없습니다." });
    lps[idx].likes = (lps[idx].likes || 0) + 1;
    saveLps(lps);
    res.json(lps[idx]);
});