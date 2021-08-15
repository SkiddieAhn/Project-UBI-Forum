const express=require('express'); // 함수를 반환
const router=express.Router(); // app객체처럼 router객체를 반환
const Template=require('../lib/Template');

// 클라이언트에서 입력한 데이터를 처리하지 않는 경우 (일반적: ubi 루트 페이지 <ubi zone> )
router.get('/',(request,response)=>{
    if(request.user===undefined){
      response.send(Template.LOGIN());
      return false;
    }

    let title="Secret Zone";
    let description=`
    This is the Secret Zone. All your writing is encrypted in three letters: U.B.I. <br>
    Legally problematic writing is restricted.
    `;
    let uli_list=Template.ULIST(request.ulist);
    let template=Template.HTML(title,Template.AUTH(request.user),uli_list,
      `
       <p>${description}</p>
       <!-- 정적인 이미지 파일 서비스 -->
      <img src="/images/uhello.jpg" style="width:300px; display:block; margin-top:10px;">
      `,`
      <!-- 글 생성 버튼 -->
      <a href="/ubi/page/create">Create</a>
      <!-- Root Zone -->
      <a href="/">Home</a>
      `
    );
    response.send(template);
});

// 외부 모듈에 연결
module.exports=router;
