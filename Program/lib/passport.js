const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const accounts=require('../account/Accounts'); // 인증 데이터가 담긴 객체 반환 (세션 시크릿 포함)
const db=require('../lib/db');
const bcrypt = require('bcrypt');
const saltRounds = 10; // <bcypt 이용 변수> 높을수록 보안 수치 높음 (복호화 힘듦)

module.exports=function(router){
  router.use(passport.initialize()); // passport에 express에 개입
  router.use(passport.session()); // passport를 사용하면서 session을 내부적으로 사용

  // serializeUser의 콜백은 로그인이 성공했을 때 호출됨
  // authData가 user인수에 들어옴 (LocalStrategy 미들웨어의 done함수가 진행)
  passport.serializeUser(function(user, done) {
    // 유저 정보 중 일부 데이터만 새 객체에 저장
    let user_info={
      Private:user.Private,
      Id:user.Id,
      Nickname:user.Nickname,
      Autholity:user.Autholity
    };
    done(null, user_info); // -> user_info가 세션 데이터 안 passport의 user값으로 전달
    // serializeUser: < 로그인에 성공했다는 사실을 세션 스토어에 저장하는 기능 >
  });

  // deserializeUser의 콜백은 로그인 성공 후 페이지를 접속할 때마다 호출됨
  // deserializeUser: < 사용자 정보를 세션 스토어에서 불러오는 기능 >
  // 콜백의 user인수는 세션 스토어의 passposrt에 담긴 user임
  passport.deserializeUser(function(user, done) {
    done(null,user); // user는 request.user속성으로 저장됨
  });

  // Local방식을 처리하는 미들웨어 [LocalStrategy 미들웨어]
  passport.use(
      new LocalStrategy(
        {
          usernameField: '_id', // login미들웨어에서 사용하는 username 변수:id
          passwordField: '_password' // login미들웨어에서 사용하는 password 변수:password
        },
        // 사용자가 입력한 계정 정보와 비교
        function (username, password, done) {
          // db.json에서 Id:username인 유저 객체 찾아서 리턴
          var user = db.get('users').find({
               Id: username
          }).value();
          if(user){
            // 비크립트 검증 알고리즘 이용해서 비밀번호 비교
            bcrypt.compare(password, user.Password, function(err, result){
              // 로그인 성공 -> serializeUser콜백 호출
              if(result)
                return done(null, user,{});
              // 로그인 실패(비밀번호 오류) -> err_code 업데이트
              else {
                accounts.err_code=1;
                return done(null, false,{});
              }
            });
         }
         // 로그인 실패(아이디 오류) -> err_code 업데이트
         else{
           accounts.err_code=2;
           return done(null, false);
        }
      }
    )
  );
  return passport;
}
