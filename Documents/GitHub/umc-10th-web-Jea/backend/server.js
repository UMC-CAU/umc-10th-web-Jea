const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

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
        { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
        { email: user.email },
        process.env.JWT_REFRESH_SECRET,
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
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
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