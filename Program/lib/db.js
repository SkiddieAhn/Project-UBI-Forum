// 회원가입 관련 모듈 불러오기
const low = require('lowdb'); // lowdb를 이용해서 데이터 저장
const FileSync = require('lowdb/adapters/FileSync'); // 동기 방법으로 저장
const adapter = new FileSync('db.json'); // db.json이라는 파일에 데이터 저장
const db = low(adapter); // db키워드를 이용해서 데이터 저장

// 데이터가 db.json의 users,topics위치에 저장되도록 설정
db.defaults({users:[], topics:[], utopics:[],admin:[]}).write();

module.exports=db;
