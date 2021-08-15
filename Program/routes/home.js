const express=require('express'); // 함수를 반환
const router=express.Router(); // app객체처럼 router객체를 반환
const Template=require('../lib/Template');

// 클라이언트에서 입력한 데이터를 처리하지 않는 경우 (일반적: root 페이지 <홈> )
router.get('/',(request,response)=>{
    let title='Welcome';
    let description=`It's a free bulletin board site!`;
    if(request.user){
      title=`Howdy, ${request.user.Nickname}`;
      description=`Have a good posting activity!`;
    }
    let li_list=Template.LIST(request.list);
    let template=Template.HTML(title,Template.AUTH(request.user),li_list,
      `
       <p>${description}</p>
       <!-- 정적인 이미지 파일 서비스 -->
      <img src="/images/hello.jpg" style="width:300px; display:block; margin-top:10px;">
      `,`
      <!-- 글 생성 버튼 -->
      <a href="/page/create">Create</a>
      <!-- Secret Zone -->
      <a href="/ubi">Secret</a>
      `
    );
    response.send(template);
});

// 외부 모듈에 연결
module.exports=router;
