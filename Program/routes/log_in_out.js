const express=require('express'); // 함수를 반환
const router=express.Router(); // app객체처럼 router객체를 반환
const Template=require('../lib/Template');
const accounts=require('../account/Accounts');
const db=require('../lib/db');
const personal_code=require('shortid'); // 고유 식별 코드 생성하는 모듈
const bcrypt = require('bcrypt');
const saltRounds = 10; // <bcypt 이용 변수> 높을수록 보안 수치 높음 (복호화 힘듦)

// 라우트들이 담긴 함수
module.exports=function(passport){

  // 클라이언트에서 입력한 데이터를 처리하는 경우 <로그인 처리>
  // 사용자가 login-submit을 통해 서버에 데이터를 전송했을 때 (응답 코드)

  /*  process_login으로 들어오면 local방식의 passport API로 처리
      local방식은 id와 pw를 이용해서 로그인하는 것 (sns계정 이용x) */
  router.post('/process_login',
    passport.authenticate('local',{failureRedirect: '/page/login' /* 로그인 실패 */}),
    // 로그인 성공하면 아래 함수 호출
    function(request, response) {
      request.session.save(()=>{ response.redirect('/');});
    }
  );

  // 클라이언트에서 입력했던 데이터를 처리하는 경우 <로그아웃 처리>
  // 사용자가 Logout을 통해 서버에 데이터를 전송했을 때 (응답 코드)
  router.get('/process_logout',(request,response)=>{
    if(request.user===undefined){
      response.send(Template.LOGIN());
      return false;
    }
    request.logout(); // passport API가 알아서 세션 파일에서 user 삭제, request.user 삭제
    request.session.save(()=>{ response.redirect('/'); });
  });

  // 클라이언트에서 입력한 데이터를 처리하는 경우 <회원가입 처리>
  // 사용자가 Register-submit을 통해 서버에 데이터를 전송했을 때 (응답 코드)
  router.post('/process_register', function (request, response) {
    // FORM창에 입력한 데이터 불러오기
    let post = request.body;
    let id = post.id;
    let password = post.password;
    let password2 = post.password2;
    let nickname = post.nickname;

    // 입력 됐는지 검사
    if(id==='' || password==='' || password2==='' || nickname===''){
      accounts.err_code=3;
      response.redirect('/page/register');
      return false;
    }

    // 중복 아이디 검사
    let users_num=db.get('users').size().value();
    for(i=0; i<users_num; i++){
      let user_info=(db.get('users').value())[i].Id;
      if(user_info === id){
        accounts.err_code=4;
        response.redirect('/page/register');
        return false;
      }
    }

    // 비밀번호 검사
    if(password !== password2){
      accounts.err_code=5;
      response.redirect('/page/register');
      return false;
    }

    // 검사 모두 통과
    else{
      bcrypt.hash(password, saltRounds, function (err, hash) {
        // 사용자 정보를 객체에 저장 (비밀번호 암호화 적용)
        let user={
          Private:personal_code.generate(), // 고유 식별 코드 생성해서 저장
          Id:id,
          Password:hash,
          Nickname:nickname,
          Autholity:0
        }
        // get명령어를 이용해서 데이터 저장 (db.json의 users위치에 저장)
        db.get('users').push(user).write();

        // 회원가입한 데이터로 로그인
        request.login(user, function(err){ // => serializeUser()가 실행됨, user객체 전달
          request.session.save(()=>{ response.redirect('/');});
        })
      });
    }
  });
  return router;
}
