const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: "../.env" });

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Swagger ──────────────────────────────────────────
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "LP 판 API",
            version: "1.0.0",
            description: "LP 판 서비스 REST API 문서",
        },
        servers: [{ url: `http://localhost:${process.env.PORT}` }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ["./server.js"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Auth 미들웨어 ─────────────────────────────────────
const authenticate = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ message: "토큰이 없습니다." });
    }
    try {
        req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
};

// ── Passport Google ───────────────────────────────────
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const nickname = profile.displayName;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({ data: { email, nickname, password: null } });
    }
    return done(null, { id: user.id, email, nickname });
}));

// ════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, nickname]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *               nickname: { type: string }
 *     responses:
 *       201: { description: 회원가입 성공 }
 *       400: { description: 이미 존재하는 이메일 }
 */
app.post("/api/auth/signup", async (req, res) => {
    const { email, password, nickname } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: "이미 존재하는 이메일입니다." });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { email, password: hashed, nickname } });
    res.status(201).json({ message: "회원가입 성공" });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: 로그인 성공, accessToken, refreshToken, nickname 반환 }
 *       401: { description: 이메일/비밀번호 불일치 }
 */
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "이메일 또는 비밀번호가 틀렸습니다." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "이메일 또는 비밀번호가 틀렸습니다." });

    const accessToken = jwt.sign(
        { id: user.id, email: user.email, nickname: user.nickname },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.REFRESH_JWT_SECRET,
        { expiresIn: "7d" }
    );
    res.json({ accessToken, refreshToken, nickname: user.nickname });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Auth]
 *     responses:
 *       200: { description: 로그아웃 성공 }
 */
app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "로그아웃 성공" });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 액세스 토큰 재발급
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: 새 accessToken 반환 }
 *       401: { description: 토큰 없음 }
 *       403: { description: 유효하지 않은 토큰 }
 */
app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "토큰 없음" });
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
        const accessToken = jwt.sign(
            { id: decoded.id, email: decoded.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.json({ accessToken });
    } catch {
        res.status(403).json({ message: "유효하지 않은 토큰" });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 내 정보 조회
 *     tags: [Auth]
 *     responses:
 *       200: { description: 유저 정보 반환 }
 */
app.get("/api/auth/me", authenticate, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, nickname: true, createdAt: true },
    });
    res.json(user);
});

app.delete("/api/auth/withdraw", authenticate, async (req, res) => {
    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ message: "탈퇴 완료" });
});

// Google OAuth
app.get("/api/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }));

app.get("/v1/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        const user = req.user;
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, nickname: user.nickname },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        const refreshToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.REFRESH_JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.redirect(`http://localhost:5173/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&nickname=${user.nickname}`);
    }
);

// ════════════════════════════════════════════════════
//  LP ROUTES
// ════════════════════════════════════════════════════

/**
 * @swagger
 * /v1/lps:
 *   get:
 *     summary: LP 목록 조회 (커서 기반 페이지네이션)
 *     tags: [LP]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, oldest] }
 *       - in: query
 *         name: cursor
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200:
 *         description: LP 목록과 nextCursor 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array }
 *                 nextCursor: { type: integer, nullable: true }
 */
app.get("/v1/lps", async (req, res) => {
    const sort = req.query.sort === "oldest" ? "asc" : "desc";
    const limit = parseInt(req.query.limit) || 12;
    const cursor = req.query.cursor ? parseInt(req.query.cursor) : undefined;
    const search = req.query.search;


    const lps = await prisma.lp.findMany({
        where: search ? {
            OR: [
                {title: {contains: search}},
                {artist: {contains: search}},
            ],
        } : undefined,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { createdAt: sort },
        include: {
            author: { select: { nickname: true } },
            _count: { select: { comments: true } },
        },
    });

    const hasNext = lps.length > limit;
    const data = hasNext ? lps.slice(0, limit) : lps;
    const nextCursor = hasNext ? data[data.length - 1].id : null;

    res.json({
        data: data.map(lp => ({
            ...lp,
            tags: lp.tags ? JSON.parse(lp.tags) : [],
            artist: lp.artist ?? lp.author.nickname,
        })),
        nextCursor,
    });
});

/**
 * @swagger
 * /v1/lps:
 *   post:
 *     summary: LP 추가
 *     tags: [LP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:   { type: string }
 *               content: { type: string }
 *               cover:   { type: string }
 *               tags:    { type: array, items: { type: string } }
 *     responses:
 *       201: { description: 생성된 LP }
 *       401: { description: 인증 필요 }
 */
app.post("/v1/lps", authenticate, async (req, res) => {
    const { title, artist, content, cover, tags } = req.body;
    if (!title) return res.status(400).json({ message: "제목은 필수입니다." });

    const lp = await prisma.lp.create({
        data: {
            title,
            artist: artist || null,
            content: content || "",
            cover: cover || "",
            tags: tags ? JSON.stringify(tags) : "[]",
            authorId: req.user.id,
        },
        include: { author: { select: { nickname: true } } },
    });

    res.status(201).json({
        ...lp,
        tags: JSON.parse(lp.tags),
        artist: lp.artist ?? lp.author.nickname,
    });
});

/**
 * @swagger
 * /v1/lps/{id}:
 *   get:
 *     summary: LP 상세 조회
 *     tags: [LP]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: LP 상세 정보 }
 *       404: { description: LP 없음 }
 */
app.get("/v1/lps/:id", async (req, res) => {
    const lp = await prisma.lp.findUnique({
        where: { id: Number(req.params.id) },
        include: { author: { select: { nickname: true } } },
    });
    if (!lp) return res.status(404).json({ message: "LP를 찾을 수 없습니다." });
    res.json({
        ...lp,
        tags: lp.tags ? JSON.parse(lp.tags) : [],
        artist: lp.artist ?? lp.author.nickname,
    });
});

/**
 * @swagger
 * /v1/lps/{id}:
 *   patch:
 *     summary: LP 수정
 *     tags: [LP]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:   { type: string }
 *               content: { type: string }
 *               cover:   { type: string }
 *               tags:    { type: array }
 *     responses:
 *       200: { description: 수정된 LP }
 *       403: { description: 권한 없음 }
 *       404: { description: LP 없음 }
 */
app.patch("/v1/lps/:id", authenticate, async (req, res) => {
    const lp = await prisma.lp.findUnique({ where: { id: Number(req.params.id) } });
    if (!lp) return res.status(404).json({ message: "LP를 찾을 수 없습니다." });
    if (lp.authorId !== req.user.id) return res.status(403).json({ message: "권한이 없습니다." });

    const { tags, artist, ...rest } = req.body;
    const updated = await prisma.lp.update({
        where: { id: Number(req.params.id) },
        data: {
            ...rest,
            ...(artist !== undefined && { artist }),
            ...(tags && { tags: JSON.stringify(tags) }),
        },
        include: { author: { select: { nickname: true } } },
    });
    res.json({
        ...updated,
        tags: JSON.parse(updated.tags),
        artist: updated.artist ?? updated.author.nickname,
    });
});

/**
 * @swagger
 * /v1/lps/{id}:
 *   delete:
 *     summary: LP 삭제
 *     tags: [LP]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: 삭제 완료 }
 *       403: { description: 권한 없음 }
 *       404: { description: LP 없음 }
 */
app.delete("/v1/lps/:id", authenticate, async (req, res) => {
    const lp = await prisma.lp.findUnique({ where: { id: Number(req.params.id) } });
    if (!lp) return res.status(404).json({ message: "LP를 찾을 수 없습니다." });
    if (lp.authorId !== req.user.id) return res.status(403).json({ message: "권한이 없습니다." });

    await prisma.lp.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "삭제 완료" });
});

/**
 * @swagger
 * /v1/lps/{id}/like:
 *   post:
 *     summary: LP 좋아요 토글
 *     tags: [LP]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: 좋아요 결과 }
 */
app.post("/v1/lps/:id/like", authenticate, async (req, res) => {
    const lpId = Number(req.params.id);
    const userId = req.user.id;

    const existing = await prisma.like.findUnique({ where: { lpId_userId: { lpId, userId } } });

    if (existing) {
        await prisma.like.delete({ where: { lpId_userId: { lpId, userId } } });
        const lp = await prisma.lp.update({ where: { id: lpId }, data: { likes: { decrement: 1 } } });
        return res.json({ liked: false, likes: lp.likes });
    }

    await prisma.like.create({ data: { lpId, userId } });
    const lp = await prisma.lp.update({ where: { id: lpId }, data: { likes: { increment: 1 } } });
    res.json({ liked: true, likes: lp.likes });
});

// ════════════════════════════════════════════════════
//  COMMENT ROUTES
// ════════════════════════════════════════════════════

/**
 * @swagger
 * /v1/lps/{id}/comments:
 *   get:
 *     summary: 댓글 목록 조회 (커서 기반 페이지네이션)
 *     tags: [Comment]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [newest, oldest] }
 *       - in: query
 *         name: cursor
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: 댓글 목록과 nextCursor }
 */
app.get("/v1/lps/:id/comments", async (req, res) => {
    const lpId = Number(req.params.id);
    const order = req.query.order === "oldest" ? "asc" : "desc";
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor ? parseInt(req.query.cursor) : undefined;

    const comments = await prisma.comment.findMany({
        where: { lpId },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { createdAt: order },
        include: { author: { select: { nickname: true } } },
    });

    const hasNext = comments.length > limit;
    const data = hasNext ? comments.slice(0, limit) : comments;
    const nextCursor = hasNext ? data[data.length - 1].id : null;

    res.json({
        data: data.map(c => ({ ...c, author: c.author.nickname })),
        nextCursor,
    });
});

/**
 * @swagger
 * /v1/lps/{id}/comments:
 *   post:
 *     summary: 댓글 작성
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       201: { description: 생성된 댓글 }
 */
app.post("/v1/lps/:id/comments", authenticate, async (req, res) => {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "내용을 입력해주세요." });

    const comment = await prisma.comment.create({
        data: {
            content,
            lpId: Number(req.params.id),
            authorId: req.user.id,
        },
        include: { author: { select: { nickname: true } } },
    });
    res.status(201).json({ ...comment, author: comment.author.nickname });
});

/**
 * @swagger
 * /v1/lps/{lpId}/comments/{commentId}:
 *   delete:
 *     summary: 댓글 삭제
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: lpId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: 삭제 완료 }
 *       403: { description: 권한 없음 }
 */
app.delete("/v1/lps/:lpId/comments/:commentId", authenticate, async (req, res) => {
    const comment = await prisma.comment.findUnique({ where: { id: Number(req.params.commentId) } });
    if (!comment) return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    if (comment.authorId !== req.user.id) return res.status(403).json({ message: "권한이 없습니다." });

    await prisma.comment.delete({ where: { id: Number(req.params.commentId) } });
    res.json({ message: "삭제 완료" });
});

// ────────────────────────────────────────────────────
app.listen(process.env.PORT, () => {
    console.log(`서버 실행 중: http://localhost:${process.env.PORT}`);
    console.log(`Swagger 문서: http://localhost:${process.env.PORT}/api-docs`);
});