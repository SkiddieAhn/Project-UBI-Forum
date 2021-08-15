// 인증 관련 객체
var authInstance = {
  // 세션 secret 키
  key:'asadlfkj!@#!@#dfgasdgm',

  // 인증 에러 코드 (for.플래시 메시지)
  /* 1:일치하지 않는 비밀번호 -> 로그인 창으로 리다이렉트
     2:일치하지 않는 아이디 -> 로그인 창으로 리다이렉트
     3:회원가입 FORM에 입력 안됨 -> 회원가입 창으로 리다이렉트 / 우비 코드 입력 안 됨 -> 해당 글로 리다이렉트
     4:회원가입 중 중복 아이디 탐색 -> 회원가입 창으로 리다이렉트
     5:회원가입 중 비밀번호 불일치 -> 회원가입 창으로 리다이렉트
     6.소유자 아닌 글 수정,삭제 -> 해당 글로 리다이렉트
     7.존재하지 않는 우비 코드 입력 -> 해당 클로 리다이렉트
  */
  err_code:0,

  // 에러에 따른 플래시 메시지 생성
  err_flash_processing:(request,err_code,post_user)=>{
    switch (err_code) {
      case 1:
        request.flash('error', 'Incorrect Password !!');
        break;
      case 2:
        request.flash('error', 'Incorrect Id !!');
        break;
      case 3:
        request.flash('error', 'Not entered !!');
        break;
      case 4:
        request.flash('error', 'existing ID !!');
        break;
      case 5:
        request.flash('error', 'password must same !!');
        break;
      case 6:
        request.flash('error', `You are not ${post_user} !!`);
        break;
      case 7:
        request.flash('error', `Incorrect UBI Code !!`);
        break;
      default:
        return false;
    }
  },

  // 우비 코드 패스 코드 (우비 패스)
  /*
   1.사용자가 입력한 우비코드가 저장된 것과 정확히 일치 (조회) -> 페이지 창으로 리다이렉트
   2.'우비-비밀게시판'에서 글 생성 완료 (생성) -> 페이지 창으로 리다이렉트
   3.'우비-비밀게시판'에서 글 수정 완료 (수정) -> 페이지 창으로 리다이렉트
  */
  ubi_pass:0,

  // 우비 패스에 따른 플래시 메시지 생성
  pass_flash_processing:(request,ubi_pass,utopic)=>{
    switch (ubi_pass) {
      case 1:
        let DecryptedDescription=UBI.Decryption(utopic.description,utopic.u_code,utopic.b_code).string;
        request.flash('ubi', DecryptedDescription);
        break;
      case 2:
        request.flash('ubi', `( U Code-${utopic.u_code}, B Code-${utopic.b_code} )`);
        break;
      case 3:
        request.flash('ubi',  `Updated : ( U Code-${utopic.u_code}, B Code-${utopic.b_code} )`);
        break;
      default:
        return false;
    }
  },
}

// module.exports속성이 가리키는 객체 변경
module.exports=authInstance;
