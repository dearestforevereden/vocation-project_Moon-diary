const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const static = require('serve-static');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const port = 3000;

// MongoDB 연결 설정
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db;

// multer를 사용한 파일 업로드 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'static/'));
    },
    filename: function (req, file, cb) {
        const extension = file.originalname.split('.').pop();
        cb(null, `file-${Date.now()}.${extension}`);
    },
});

const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/views', static(path.join(__dirname, 'views')));
app.use(express.static("public"));
app.use('/static', express.static(path.join(__dirname, 'static')));

// MongoDB 연결
async function connectToMongoDB() {
    try {
        await client.connect();
        db = client.db('dbsparta_plus_week1');
        console.log('MongoDB에 연결되었습니다.');
    } catch (error) {
        console.error('MongoDB 연결 오류:', error);
    }
}

connectToMongoDB();

// Mongoose 연결 설정
mongoose.connect('mongodb://localhost:27017/your-database')
    //.then(() => console.log('MongoDB에 연결되었습니다.'))
    .catch((error) => console.error('MongoDB 연결 오류:', error));

const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    age: Number,
    password: String,
});

const User = mongoose.model('User', userSchema);

// 공통된 라우트
app.get('/', (req, res) => {
    res.redirect('/views/index.html');
});

// 로그인 처리 라우트
app.post('/process/login', async (req, res) => {
    const { id, password } = req.body;

    try {
        const user = await User.findOne({ id, password });

        if (user) {
            console.log('아이디 [%s], 패스워드가 일치하는 사용자 [%s] 찾음', id, user.name);
            res.status(200).send('<h2>로그인 성공</h2>');
        } else {
            console.log('아이디 [%s], 패스워드가 일치하지 않음', id);
            res.status(200).send('<h2>로그인 실패, 아이디와 패스워드를 확인하세요.</h2>');
        }
    } catch (err) {
        console.error('로그인 처리 오류:', err);
        res.status(500).send('<h2>로그인 처리 오류</h2>');
    }
});

// 회원가입 처리 라우트
app.post('/process/adduser', async (req, res) => {
    const paramId = req.body.id;
    const paramName = req.body.name;
    const paramAge = req.body.age;
    const paramPassword = req.body.password;

    try {
        const newUser = new User({
            id: paramId,
            name: paramName,
            age: paramAge,
            password: paramPassword,
        });

        const savedUser = await newUser.save();
        console.log('Inserted 성공:', savedUser);

        res.status(200).send('<h2>회원가입 성공</h2>');
    } catch (err) {
        console.error('Inserted 실패:', err);
        res.status(500).send('<h1>회원가입 실패</h1>');
    }
});

// 공통된 라우트
app.get('/test', (req, res) => {
    res.send('이것은 테스트 라우트입니다!');
});

// 일기장 라우트
app.get('/diary', async (req, res) => {
    try {
        const allDiary = await db.collection('diary').find().toArray();
        res.json({ all_diary: allDiary });
    } catch (error) {
        console.error('일기 목록 조회 오류:', error);
        res.status(500).json({ msg: '일기 목록 조회 중 오류가 발생했습니다.' });
    }
});

app.post('/diary', upload.single('file_give'), async (req, res) => {
    try {
        const { title_give, content_give } = req.body;

        const existingDiary = await db.collection('diary').findOne({ title: title_give, content: content_give });

        if (existingDiary) {
            return res.json({ msg: '중복된 일기가 이미 존재합니다.' });
        }

        const doc = {
            title: title_give,
            content: content_give,
            file: req.file.filename,
        };

        await db.collection('diary').insertOne(doc);
        res.json({ msg: '저장완료!' });
    } catch (error) {
        console.error('일기 추가 오류:', error);
        res.status(500).json({ msg: '일기 추가 중 오류가 발생했습니다.' });
    }
});

app.post('/delete-diary', async (req, res) => {
    try {
        console.log('Request to delete diary:', req.body);
        const { diaryId } = req.body;
        console.log('Received diaryId:', diaryId);
        await db.collection('diary').deleteOne({ _id: new ObjectId(diaryId) });
        res.json({ msg: '일기가 삭제되었습니다.' });
    } catch (error) {
        console.error('일기 삭제 오류:', error);
        res.status(500).json({ msg: '일기 삭제 중 오류가 발생했습니다.' });
    }
});

app.get('/select_content_diary', async (req, res) => {
    try {
        const content = req.query.content;

        console.log('content123:', content);

        res.send('Server received content: ' + content);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
