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

    // lowdb이용해서 글 생성 (db.json의 topics에 위치하게 됨)
    let post_id = shortid.generate();
     db.get('topics').push({
       post_id: post_id,
       title: filteredTitle,
       description: description,
       user_private: request.user.Private,
       user_nickname: request.user.Nickname
     }).write();
     response.redirect(`/page/${post_id}`);
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

    // lowdb이용해서 글 수정 (db.json에서 일치하는 글 찾아서 수행)
    db.get('topics').find({post_id:id}).assign({
      title:filteredTitle,
      description:description
    }).write();
    response.redirect(`/page/${id}`);
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
    let topic = db.get('topics').find({post_id:id}).value();
    if((topic.user_private !== request.user.Private) && (request.user.Autholity === 0)){
      accounts.err_code=6;
      response.redirect(`/page/${id}`);
      return false;
    }

    // lowdb이용해서 글 식제 (db.json에서 일치하는 글 찾아서 수행)
    db.get('topics').remove({post_id:id}).write();
    response.redirect('/');
});

// 클라이언트에서 입력한 데이터를 처리하지 않는 경우 (일반적: login 페이지)
router.get('/login',(request,response)=>{
    // 이미 로그인된 경우
    if(request.user!==undefined){
      response.send('You are logged in !!');
      return false;
    }
    // err_code에 따라 다른 플래시 메시지 생성
    let login_status='';
    if(accounts.err_code >=1 && accounts.err_code <=2){
      request.flash(); // 기존 플래시 메시지 삭제
      accounts.err_flash_processing(request,accounts.err_code,''); // 플래시 메시지 생성
      accounts.err_code=0;
      login_status=request.flash().error[0];
    }
    let title="Login";
    let li_list=Template.LIST(request.list);
    let template=Template.HTML(title,Template.AUTH(request.user),li_list,
      `<form action="/log_in_out/process_login" method="post">
        <p><input type="text" name="_id" placeholder="id"></p>
        <p><input type="password" name="_password" placeholder="password"></p>
        <p style="color:red;">${login_status}</p>
        <p><input type="submit"></p>
      </form>`
      ,'<a href="/page/create">Create</a>');
    response.send(template);
});

// 클라이언트에서 입력한 데이터를 처리하지 않는 경우 (일반적: register 페이지)
router.get('/register',(request,response)=>{
    // 이미 로그인된 경우
    if(request.user!==undefined){
      response.send('You are logged in !!');
      return false;
    }
   // err_code에 따라 다른 플래시 메시지 생성
    let register_status='';
    if(accounts.err_code >=3 && accounts.err_code <=5){
      request.flash(); // 기존 플래시 메시지 삭제
      accounts.err_flash_processing(request,accounts.err_code,''); // 플래시 메시지 생성
      accounts.err_code=0;
      register_status=request.flash().error[0];
    }
    let title="Register";
    let li_list=Template.LIST(request.list);
    let template=Template.HTML(title,Template.AUTH(request.user),li_list,
      `<form action="/log_in_out/process_register" method="post">
          <p><input type="text" name="id" placeholder="id"></p>
          <p><input type="password" name="password" placeholder="password"></p>
          <p><input type="password" name="password2" placeholder="confirm password"></p>
          <p><input type="text" name="nickname" placeholder="nickname"></p>
          <p style="color:red;">${register_status}</p>
          <p><input type="submit" value="register"></p>
        </form>`
      ,'<a href="/page/create">Create</a>');
    response.send(template);
});


// 클라이언트에서 입력한 데이터를 처리하지 않는 경우 (일반적: create 페이지)
router.get('/create',(request,response)=>{
    if(request.user===undefined){
      response.send(Template.LOGIN());
      return false;
    }
    let title="Create";
    let li_list=Template.LIST(request.list);
    let template=Template.HTML(title,Template.AUTH(request.user),li_list,Template.FORM('/page/process_create',`value=""`,`value=""`,""),'<a href="/page/create">Create</a>');
    response.send(template);
});

// 클라이언트에서 입력한 데이터를 처리하지 않는 경우 (일반적: page/:pageId 페이지 <포스팅> )
router.get('/:pageId',(request,response,next)=>{
    let filteredId=path.parse(request.params.pageId).base;
    let topic = db.get('topics').find({post_id:filteredId}).value(); // 글 조회
    let post_user = (db.get('users').find({Nickname:topic.user_nickname}).value()).Nickname; // 유저 닉네임 조회

    // err_code에 따른 플래시 메시지 생성
    let page_status='';
    if(accounts.err_code === 6){
      accounts.err_flash_processing(request,accounts.err_code,post_user); // 플래시 메시지 생성
      accounts.err_code=0;
      page_status=request.flash().error[0];
    }

    // 조회한 데이터로 페이지 볼 수 있게 처리
    let sanitizedTitle=sanitizeHtml(topic.title);
    let sanitizeDescription=sanitizeHtml(topic.description,{allowedTags:['h1']});
    // 글쓴이, 에러 메시지(존재 시) 추가
    sanitizeDescription+=`<p style="color:blue;">by ${post_user}</p> <p style="color:red;">${page_status}</p>`;
    let li_list=Template.LIST(request.list);
    let template=Template.HTML(sanitizedTitle,Template.AUTH(request.user),li_list,sanitizeDescription,`
      <!-- 글 생성 버튼 -->
      <a href="/page/create">Create</a>

      <!-- 글 수정 버튼 -->
      <a href="/page/update/${topic.post_id}">Update</a>

      <!-- 글 삭제 버튼 -->
      <form action="/page/process_delete" method="post">
        <input type="hidden" name="id" value="${topic.post_id}">
        <input type="submit" value="Delete">
      </form>
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
    let topic = db.get('topics').find({post_id:filteredId}).value(); // 글 조회

    // 게시글 작성자 확인
    if((topic.user_private !== request.user.Private) && (request.user.Autholity === 0)){
      accounts.err_code=6;
      response.redirect(`/page/${filteredId}`);
      return false;
    }

    let sanitizedTitle=sanitizeHtml(topic.title);
    let sanitizeDescription=sanitizeHtml(topic.description,{allowedTags:['h1']});
    let li_list=Template.LIST(request.list);
    let template=Template.HTML(sanitizedTitle,Template.AUTH(request.user),li_list,Template.FORM('/page/process_update',`value=${topic.post_id}`,`value="${sanitizedTitle}"`,sanitizeDescription),'<a href="/page/create">Create</a>');
    response.send(template);
});

// 외부 모듈에 연결
module.exports=router;
