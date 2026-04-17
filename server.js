const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const Joi     = require('joi');
const cors    = require('cors');
const { pool, poolConnect, sql } = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(express.static('public'));

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Middleware: проверка токена
function authMiddleware(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Не авторизован' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Токен недействителен' });
    }
}

// ── РЕГИСТРАЦИЯ
app.post('/api/register', async (req, res) => {
    const schema = Joi.object({
        fullName:  Joi.string().min(2).max(100).required(),
        email:     Joi.string().email().required(),
        phone:     Joi.string().allow('').optional(),
        password:  Joi.string().min(8).required(),
        password2: Joi.any().valid(Joi.ref('password')).required()
            .messages({ 'any.only': 'Пароли не совпадают' })
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        await poolConnect;

        const existing = await pool.request()
            .input('email', sql.NVarChar, value.email)
            .query('SELECT Id FROM Users WHERE Email = @email');

        if (existing.recordset.length > 0)
            return res.status(409).json({ message: 'Email уже зарегистрирован' });

        const hash = await bcrypt.hash(value.password, 12);

        const result = await pool.request()
            .input('fullName', sql.NVarChar, value.fullName)
            .input('email',    sql.NVarChar, value.email)
            .input('phone',    sql.NVarChar, value.phone || null)
            .input('hash',     sql.NVarChar, hash)
            .query(`INSERT INTO Users (FullName, Email, Phone, PasswordHash)
                    OUTPUT INSERTED.Id, INSERTED.FullName, INSERTED.Email
                    VALUES (@fullName, @email, @phone, @hash)`);

        const user = result.recordset[0];
        const token = jwt.sign({ id: user.Id, email: user.Email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ message: 'Регистрация успешна', token, user });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ── ВХОД
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'Заполните все поля' });

    try {
        await poolConnect;

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        const user = result.recordset[0];
        if (!user) return res.status(401).json({ message: 'Неверный email или пароль' });

        const valid = await bcrypt.compare(password, user.PasswordHash);
        if (!valid) return res.status(401).json({ message: 'Неверный email или пароль' });

        const token = jwt.sign({ id: user.Id, email: user.Email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Вход выполнен',
            token,
            user: { id: user.Id, fullName: user.FullName, email: user.Email, phone: user.Phone }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ── ДАННЫЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (защищённый маршрут)
app.get('/api/me', authMiddleware, async (req, res) => {
    try {
        await poolConnect;

        const result = await pool.request()
            .input('id', sql.Int, req.user.id)
            .query('SELECT Id, FullName, Email, Phone, Role, CreatedAt FROM Users WHERE Id = @id');

        const user = result.recordset[0];
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ── СМЕНА ПАРОЛЯ (защищённый маршрут)
app.post('/api/change-password', authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 8)
        return res.status(400).json({ message: 'Проверьте введённые данные (минимум 8 символов)' });

    try {
        await poolConnect;

        const result = await pool.request()
            .input('id', sql.Int, req.user.id)
            .query('SELECT PasswordHash FROM Users WHERE Id = @id');

        const user = result.recordset[0];
        const valid = await bcrypt.compare(oldPassword, user.PasswordHash);
        if (!valid) return res.status(401).json({ message: 'Неверный текущий пароль' });

        const hash = await bcrypt.hash(newPassword, 12);
        await pool.request()
            .input('hash', sql.NVarChar, hash)
            .input('id',   sql.Int, req.user.id)
            .query('UPDATE Users SET PasswordHash = @hash WHERE Id = @id');

        res.json({ message: 'Пароль изменён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.listen(process.env.PORT || 3000, () =>
    console.log(`Сервер запущен на порту ${process.env.PORT || 3000}`)
);
