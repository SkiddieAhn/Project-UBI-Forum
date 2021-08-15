const express=require('express'); // 함수를 반환
const fs = require('fs');
const bodyParser=require('body-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session); // 생성자 함수를 반환
const compression = require('compression');
const accounts=require('./account/Accounts'); // 인증 관련 객체 반환
const helmet=require('helmet'); // 애플리케이션 보호 모듈
const flash = require('connect-flash');
const db=require('./lib/db');

// express함수로 express 서브파티 모듈을 접근하는 객체를 불러옴
const app=express()

// 애플리케이션 보호 시스템을 ON하겠다.
// helmet: 보안과 관련된 여러 이슈들을 자동으로 해결
app.use(helmet());

// public 디렉토리 안에서 static파일을 찾겠다.
app.use(express.static('public'));

// body-parser 미들웨어: 사용자가 전송한 post데이터를 내부적으로 분석해서 request객체 안에 body객체로 저장함
app.use(bodyParser.urlencoded({extended:false})); // (body-parser가 만들어낸 미들웨어를 표현하는 표현식)

// gzip형태로 js 텍스트 압축
app.use(compression());

// 세션 미들웨어 : request객체의 프로퍼티로 세션이라는 객체를 추가 (중괄호에 적힌 내용을 기반으로 객체 생성 )
const key=accounts.key; // 세션 시크릿 가져오기
app.use(session({
  secret: key, // 세션 데이터를 얻기 위해 필요한 멤버, 변수로 처리해야 보안 효과를 봄
  resave: false, // 세션 데이터가 바뀌기 전까지는 세션 저장소에 저장하지 않는다. (false로 하면 좋음)
  saveUninitialized: true, // 세션이 필요하기 전까지는 세션을 구동하지 않는다. (true로 하면 좋음)
  store:new FileStore(), // FileStore객체 생성 후 store멤버에 저장 -> 세션 저장소를 sessions디렉토리 내부에 위치
}));

// 플래시 메시지 미들웨어: request객체에 flash함수(플래시 메시지 생성) 추가
app.use(flash());

// request.list/ulist 프로퍼티를 통해서 글 목록 접근 가능하도록 하기
app.get('*',(request,response,next)=>{
  request.list = db.get('topics').value();
  request.ulist = db.get('utopics').value();
  next();
});

// passport 모듈 불러오기 (session 객체를 만들고 불러와야 됨)
const passport = require('./lib/passport')(app);

// 라우터 모듈 불러오기 (홈,페이지,로그인,우비존)
const homeRouter=require('./routes/home');
const pageRouter=require('./routes/page');
const loginRouter=require('./routes/log_in_out')(passport);
const ubiRouter=require('./ubi/uhome');
const upageRouter=require('./ubi/upage');

// 라우팅 처리 경로 지정
app.use('/',homeRouter);
app.use('/page',pageRouter);
app.use('/log_in_out',loginRouter);
app.use('/ubi',ubiRouter);
app.use('/ubi/page',upageRouter);

// 이상한 url을 사용했을 때
app.use((request,response,next)=>{
  response.status(404).send('Cant find that!!');
});

// error handler를 위한 미들웨어 <가장 마지막 부분에 정의되도록 약속됨>
app.use((err,request,response,next)=>{
  response.status(500).send('Something broke!');
});

app.listen(3000);
