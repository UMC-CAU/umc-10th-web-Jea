const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "../.env"});

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // Vite 기본 포트
app.use(express.json());

const fs = require("fs");

const DB_PATH = "./users.json";

// 파일에서 유저 불러오기
const loadUsers = () => {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
};

// 파일에 유저 저장하기
const saveUsers = (users) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
};

// 임시 DB (실제로는 MongoDB/MySQL 등 사용)
let users = loadUsers();

// ✅ 회원가입
app.post("/api/auth/signup", async (req, res) => {
    const { email, password, nickname } = req.body;

    // 이메일 중복 체크
    const exists = users.find(u => u.email === email);
    if (exists) return res.status(400).json({ message: "이미 존재하는 이메일입니다." });

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ email, password: hashedPassword, nickname });
    saveUsers(users);

    res.status(201).json({ message: "회원가입 성공" });
});

// ✅ 로그인
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

    res.json({ accessToken, refreshToken });
});

// ✅ 로그아웃
app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "로그아웃 성공" });
});

// ✅ 토큰 갱신
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

app.listen(process.env.PORT, () => {
    console.log(`서버 실행 중: http://localhost:${process.env.PORT}`);
});

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");

// 세션 설정
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Google 전략 설정
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const nickname = profile.displayName;

    // 이미 있는 유저면 그냥 로그인, 없으면 자동 회원가입
    let user = users.find(u => u.email === email);
    if (!user) {
        users.push({ email, password: null, nickname });
        saveUsers(users);
    }

    return done(null, { email, nickname });
}));

// 구글 로그인 시작
app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["email", "profile"] })
);

// 구글 콜백
app.get("/v1/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        //console.log("JWT_SECRET:", process.env.JWT_SECRET); // ✅ 추가
        //console.log("REFRESH_SECRET:", process.env.REFRESH_JWT_SECRET); // ✅ 추가
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

        // 프론트로 토큰 전달
        res.redirect(`http://localhost:5173/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    }
);