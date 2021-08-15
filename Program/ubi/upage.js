const express=require('express'); // 함수를 반환
const router=express.Router(); // app객체처럼 router객체를 반환
const fs = require('fs');
const qs=require('querystring');
const path=require('path');
const accounts=require('../account/Accounts');
const Template=require('../lib/Template');
const sanitizeHtml=require('sanitize-html'); // 함수를 반환
const db = require('../lib/db');
const shortid = require('shortid');
const UBI=require('ubicrypt'); // 우비 암호화, 복호화 함수가 담긴 객체 불러오기

// 클라이언트에서 입력한 데이터를 처리하는 경우 <글 생성>
// 사용자가 create-submit을 통해 서버에 데이터를 전송했을 때 (응답 코드)
router.post('/process_create',(request,response)=>{
  if(request.user===undefined){
    response.send(Template.LOGIN());
    return false;
  }
    let post = request.body;
    let title = post.title;
    let description = post.description;
    let filteredTitle=path.parse(title).base;

    // 내용 암호화
    let EncryptObject=UBI.Encryption(description);
    let EncryptedDescription=EncryptObject.string;
    let UBIcode=[EncryptObject.u_code,EncryptObject.b_code];
    // 내용 복호화
    let DecryptObject=UBI.Decryption(EncryptedDescription);
    let DecryptedDescription=DecryptObject.string;

    // lowdb이용해서 암호화 글 생성 (db.json의 utopics1에 위치하게 됨)
    let post_id = shortid.generate();
     db.get('utopics').push({
       post_id: post_id,
       title: filteredTitle,
       description: EncryptedDescription,
       u_code:UBIcode[0],
       b_code:UBIcode[1],
       user_private: request.user.Private,
       user_nickname: request.user.Nickname
     }).write();

     // <관리자> lowdb이용해서 복호화 글 생성 (db.json의 admin에 위치하게 됨)
      db.get('admin').push({
        post_id: post_id,
        title: filteredTitle,
        description: DecryptedDescription,
        user_private: request.user.Private,
        user_nickname: request.user.Nickname
      }).write();

     accounts.ubi_pass=2; // 글 생성 완료
     response.redirect(`/ubi/page/${post_id}`);
});

// 클라이언트에서 입력한 데이터를 처리하는 경우 <글 조회>
// 사용자가 조회 버튼을 통해 서버에 데이터를 전송했을 때 (응답 코드)
router.post('/process_view',(request,response)=>{
    if(request.user===undefined){
      response.send(Template.LOGIN());
      return false;
    }
    // 페이지 아이디,입력받은 우비코드,본문  불러오기
    let post = request.body;
    let id=post.id;
    let input_u_code = parseInt(post.u_code);
    let input_b_code = parseInt(post.b_code);
    let utopic = db.get('utopics').find({post_id:id}).value(); // 글 조회

    // 입력받은 우비코드가 저장된 우비코드와 일치하는지 확인
    if((input_u_code === utopic.u_code) && (input_b_code === utopic.b_code)){
      accounts.ubi_pass=1;
    }
    else{
      if((post.u_code === "") || (post.b_code === "")) // 입력 안 됨
        accounts.err_code=3;
      else
        accounts.err_code=7;
    }
    response.redirect(`/ubi/page/${id}`);
});

// 클라이언트에서 입력한 데이터를 처리하는 경우 <글 수정>
// 사용자가 update-submit을 통해 서버에 데이터를 전송했을 때 (응답 코드)
router.post('/process_update',(request,response)=>{
    if(request.user===undefined){
      response.send(Template.LOGIN());
      return false;
    }
    let post = request.body;
    let id=post.id;
    let title = post.title;
    let description = post.description;
    let filteredTitle=path.parse(title).base;

    // 암호화 후 lowdb이용해서 글 수정 (db.json에서 일치하는 글 찾아서 수행)
    let EncryptObject=UBI.Encryption(description);
    let EncryptedDescription=EncryptObject.string;
    let UBIcode=[EncryptObject.u_code,EncryptObject.b_code];
    db.get('utopics').find({post_id:id}).assign({
      title:filteredTitle,
      description:EncryptedDescription,
      u_code:UBIcode[0],
      b_code:UBIcode[1]
    }).write();

    // <관리자> 복호화 저장본 수정
    let DecryptObject=UBI.Decryption(EncryptedDescription);
    let DecryptedDescription=DecryptObject.string;
    db.get('admin').find({post_id:id}).assign({
      title:filteredTitle,
      description:DecryptedDescription
    }).write();

    accounts.ubi_pass=3; // 글 수정 완료
    response.redirect(`/ubi/page/${id}`);
});

// 클라이언트에서 입력했던 데이터를 처리하는 경우 <글 삭제>
// 사용자가 delete버튼을 통해 서버에 데이터를 전송했을 때 (응답 코드)
router.post('/process_delete',(request,response)=>{
    if(request.user===undefined){
      response.send(Template.LOGIN());
      return false;
    }
    let id=request.body.id; // 게시글 id확인

    // 게시글 작성자 확인
    let utopic = db.get('utopics').find({post_id:id}).value();
    if((utopic.user_private !== request.user.Private) && (request.user.Autholity === 0)){
      accounts.err_code=6;
      response.redirect(`/ubi/page/${id}`);
      return false;
    }

    // lowdb이용해서 글 식제 (db.json에서 일치하는 글 찾아서 수행) <암호화/복호화문 모두>
    db.get('utopics').remove({post_id:id}).write();
    db.get('admin').remove({post_id:id}).write();
    response.redirect('/ubi');
});

// 클라이언트에서 입력한 데이터를 처리하지 않는 경우 (일반적: create 페이지)
router.get('/create',(request,response)=>{
    if(request.user===undefined){
      response.send(Template.LOGIN());
      return false;
    }
    let title="Create";
    let uli_list=Template.ULIST(request.ulist);
    let template=Template.HTML(title,Template.AUTH(request.user),uli_list,
    Template.FORM('/ubi/page/process_create',`value=""`,`value=""`,""),
    '<a href="/ubi/page/create">Create</a>');
    response.send(template);
});


// 클라이언트에서 입력한 데이터를 처리하지 않는 경우 (일반적: page/:pageId 페이지 <포스팅> )
router.get('/:pageId',(request,response,next)=>{
    let filteredId=path.parse(request.params.pageId).base;
    let utopic = db.get('utopics').find({post_id:filteredId}).value(); // 글 조회
    let post_user = utopic.user_nickname; // 유저 닉네임 조회

    // err_code에 따른 플래시 메시지 생성
    let page_status='';
    if((accounts.err_code === 3) || (accounts.err_code === 6) || (accounts.err_code === 7)){
      accounts.err_flash_processing(request,accounts.err_code,post_user); // 플래시 메시지 생성
      accounts.err_code=0;
      page_status=request.flash().error[0];
    }

    // 우비 패스에 따른 플래시 메시지 생성
    let ubi_message=``;
    if((accounts.ubi_pass >= 1) && (accounts.ubi_pass <= 3)){
      accounts.pass_flash_processing(request,accounts.ubi_pass,utopic); // 플래시 메시지 생성
      ubi_message=request.flash().ubi[0];
    }

    // 조회한 데이터로 페이지 볼 수 있게 처리
    let sanitizedTitle=sanitizeHtml(utopic.title);
    let sanitizeDescription="";

    // 우비 패스가 true일 때 보여질 본문 조정
    if((accounts.ubi_pass >= 1) && (accounts.ubi_pass <= 3)){
        // 글 조회인 경우 (복호화 메시지:ubi_message)
        if((accounts.ubi_pass === 1)){
          sanitizeDescription=sanitizeHtml(ubi_message,{allowedTags:['h1']});
          sanitizeDescription=sanitizeDescription+`<p style="color:blue;">by ${post_user}`;
        }
        // 글 생성 or 수정인 경우
        else{
          sanitizeDescription=`<p style="color:red;">${ubi_message}<br>`;
          sanitizeDescription+=`<p style="word-wrap:break-word;">${utopic.description}`+`<p style="color:blue;">by ${post_user}`;
        }
        accounts.ubi_pass=0;
    }
    else{
      sanitizeDescription=utopic.description;
      // 글쓴이, 에러 메시지(존재 시) 추가
      sanitizeDescription+=`<p style="color:blue;">by ${post_user}</p> <p style="color:red;">${page_status}</p>`;
    }
    let uli_list=Template.ULIST(request.ulist);
    let template=Template.HTML(sanitizedTitle,Template.AUTH(request.user),uli_list,
      `<p style="word-wrap:break-word;">${sanitizeDescription}<p>`,
      `
      <!-- 글 조회 버튼 -->
      <form action="/ubi/page/process_view" method="post">
        <input type="hidden" name="id" value="${utopic.post_id}">
        <input type="text" name="u_code" value="" placeholder="U Code">
        <input type="text" name="b_code" value="" placeholder="B Code">
        <input type="submit" value="View" />
      </form>
      <!-- 글 생성 버튼 -->
      <a href="/ubi/page/create">Create</a>
      <!-- 글 수정 버튼 -->
      <a href="/ubi/page/update/${utopic.post_id}">Update</a>
      <!-- 글 삭제 버튼 -->
      <form  style="display:inline-block" action="/ubi/page/process_delete" method="post">
        <input type="hidden" name="id" value="${utopic.post_id}">
        <input type="submit" value="Delete">
      </form>
      </div>
      `);
    response.send(template);
});

// 클라이언트에서 입력한 데이터를 처리하지 않는 경우 (일반적: update/:pageId 페이지)
router.get('/update/:pageId',(request,response)=>{
    if(request.user===undefined){
      response.send(Template.LOGIN());
      return false;
    }
    let filteredId=path.parse(request.params.pageId).base;
    let utopic = db.get('utopics').find({post_id:filteredId}).value(); // 글 조회

    // 게시글 작성자 확인
    if((utopic.user_private !== request.user.Private) && (request.user.Autholity === 0)){
      accounts.err_code=6;
      response.redirect(`/ubi/page/${filteredId}`);
      return false;
    }

    // 조회한 데이터로 페이지 볼 수 있게 처리 (암호화 됨)
    let sanitizedTitle=sanitizeHtml(utopic.title);
    let sanitizeDescription=utopic.description;

    // 내용 복호화
    let DecryptObject=UBI.Decryption(sanitizeDescription,utopic.u_code,utopic.b_code);
    let DecryptedDescription=DecryptObject.string;

    let uli_list=Template.ULIST(request.ulist);
    let template=Template.HTML(sanitizedTitle,Template.AUTH(request.user),uli_list,
    Template.FORM('/ubi/page/process_update',`value=${utopic.post_id}`,`value="${sanitizedTitle}"`,DecryptedDescription),
    '<a href="/ubi/page/create">Create</a>');
    response.send(template);
});

// 외부 모듈에 연결
module.exports=router;
