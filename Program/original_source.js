var http = require('http');
var fs = require('fs');
var url=require('url');
var qs=require('querystring');
var path=require('path');
var sanitizeHtml=require('sanitize-html'); // 함수를 반환
var Template=require('./lib/Template');

var app = http.createServer(function(request,response){
    // url의 path~query 데이터 불러오는 명령어
    var _url = request.url;
    // url의 경로 데이터를 불러오는 명령어
    var pathname=url.parse(_url,true).pathname;
    // url의 쿼리 데이터를 불러오는 명령어
    var queryData=url.parse(_url,true).query;

    // 조건문으로 title변수 다르게 설정하기
    var title='';
    if(_url === '/') // 루트 상태인 경우
      title="Welcome!";
    if(pathname !== "/") // path가 있는 경우
        title=pathname.split('/')[1];
    if(queryData.id !== undefined) // 쿼리 아이디가 있는 경우
        title=queryData.id;

    // 클라이언트에서 입력한 데이터를 처리하는 경우 <글 생성>
    // 사용자가 create-submit을 통해 서버에 데이터를 전송했을 때 (응답 코드)
    if(pathname === "/process_create"){
      var body='';
      // on은 특정 이벤트가 발생하면 콜백을 실행하는 메소드
      // 데이터가 들어올 때마다 'data' 이벤트 발생 -> 두 번째 인수 자리의 콜백 함수 실행
      request.on('data',function(data){
        body=body+data; // data는 클라이언트로부터 받은 정보
      });
      // 데이터 들어오는 것이 끝나면 'end' 이벤트 발생 -> 두 번째 인수 자리의 콜백 함수 실행
      request.on('end', function(){
          var post = qs.parse(body); // parse함수를 통해 body(클라이언트로부터 받은 정보 모음)를 객체화
          var title = post.title.replace(/(\s*)/g, ""); // 공백 제거해서 타이틀 만들기 (html오류 방지)
          var description = post.description;
          var filteredTitle=path.parse(title).base; // 경로 세탁 (사용자가 다른 디렉토리에 생성 못 하게 막음)
          fs.writeFile(`data/${filteredTitle}`, description, 'utf8', function(err){
            // 302는 리다이렉션 코드 (리다이렉션: 사용자의 입력에 의해 일시적으로 페이지를 변경)
            response.writeHead(302, {Location: `/?id=${filteredTitle}`});
            response.end();
          })
      });
    }

    // 클라이언트에서 입력한 데이터를 처리하는 경우 <글 수정>
    // 사용자가 update-submit을 통해 서버에 데이터를 전송했을 때 (응답 코드)
    else if(pathname === "/process_update"){
      var body='';
      request.on('data',function(data){
        body=body+data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id=post.id;
          var title = post.title.replace(/(\s*)/g, ""); // 공백 제거해서 타이틀 만들기 (html오류 방지)
          var description = post.description;
          var filteredTitle=path.parse(title).base; // 경로 세탁 (사용자가 다른 디렉토리 파일 수정 못 하게 막음)
          // title변수로 파일명 다시 짓고 파일 내용 수정 및 리다이렉션
          fs.rename(`data/${id}`, `data/${filteredTitle}`, function(err){ // id변수를 통해 파일명을 수정할 파일을 정함
            fs.writeFile(`data/${filteredTitle}`, description, 'utf8', function(err){
              response.writeHead(302, {Location: `/?id=${filteredTitle}`});
              response.end();
            })
          })
      });
    }

    // 클라이언트에서 입력했던 데이터를 처리하는 경우 <글 삭제>
    // 사용자가 delete버튼을 통해 서버에 데이터를 전송했을 때 (응답 코드)
    else if(pathname === "/process_delete"){
      var body='';
      request.on('data',function(data){
        body=body+data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id=post.id;
          var filteredId=path.parse(id).base; // 경로 세탁 (사용자가 임의로 삭제 못 하게 막음)
          // id변수로 파일 삭제 및 리다이렉션 (루트로)
          fs.unlink(`data/${filteredId}`, function(err){
              response.writeHead(302, {Location: `/`});
              response.end();
          })
      });
    }

    // 클라이언트에서 입력한 데이터를 처리하지 않는 경우 (일반적)
    else{
      // (파일 목록 출력) 자동화하기
      // fs.readdir 활용하기 <비동기적>
      let li_list=""; // (파일명이 추가된 li태그) 목록
      const testFolder='./data';
      // testFolder경로에 있는 파일을 배열로 만들어서 두 번째 인수의 filelist에 전달
      fs.readdir(testFolder,(err,filelist)=>{
            // li_list 업데이트하면서 문자열(li태그) 부여
            filelist.forEach((item,index)=>{
                 li_list=li_list+"<li><a href=/?id="+item+">"+item+"</a></li>";
            });

            /* path모듈을 이용한 경로 세탁
              : 일단 parse함수를 이용해서 문자열 변수를 객체화시키고 base멤버만 가져오면 경로가 세탁됨
              ex) ~/password.js 파일에 비밀번호가 있는 상황인데 사용자가 홈 디렉토리에 비밀번호 파일이 있다는 것을 알게 됨
                  -> url창에 '127.0.0.1/?id=../password.js'라고 치면 내용이 노출 됨 (data/../password.js)
                  -> base멤버만 가져오면 '../'를 제외하고 'password.js'만 남으므로 경로 세탁이 되고 내용 노출을 막게 됨 (data/password.js)
            */
            var filteredId=queryData.id;
            if(queryData.id !== undefined)
              filteredId=path.parse(queryData.id).base;

            // 동적인 웹 페이지 만들기 (title,description변수 이용)
            // fs객체의 readfile메소드는 첫 번째 인수에 적힌 파일의 내용을 세 번째 인수의 description매개변수에 보내고 해당 함수를 실행
            fs.readFile(`data/${filteredId}`,'utf8',(err,description)=>{

              // description이 존재하지 않는 경우 (쿼리 아이디가 없거나 파일과 매칭이 안 되는 상태)
              // description이 undefined이면 다음과 같이 수정
              if(description===undefined){
                if(_url === '/')
                  description="Hello World!!";
                else
                  description="Undefined";
              }

              /* sanitize-html모듈을 이용한 악성코드 방지
                : 만약 사용자가 글을 생성할 때 description부분에 <script>태그를 넣는다면, 누군가 해당 글을 클릭하면 스크립트가 실행된다.
                헤당 스크립트가 이상한 것이 아니라면 상관없겠지만 악성코드라면 큰 문제가 발생할 수 있다.
                ex) 'virus' 글을 클릭 시 pc를 감염시키는 바이러스 사이트로 이동하는 스크립트
                -> require('sanitize-html')을 해서 가져온 함수를 이용하면 태그가 발견될 시 해당 내용을 무효화한다. (서버에는 내용이 있지만 클라이언트에는 볼 수가 없도록 함)
                -> 예를 들어, description에 누군가 '<script>alert("virus")</script>'를 쓴다면 해당 내용은 무료화된다.
              */
              var sanitizedTitle=sanitizeHtml(title);
              var sanitizeDescription=sanitizeHtml(description,{allowedTags:['h1']});

              // (클라이언트에 전달할) 'HTML 코드가 담긴 문자열' 생성
              var template='';

              // 홈 디렉토리일 때
              if(_url === '/')
                template=Template.HTML(sanitizedTitle,li_list,sanitizeDescription,'');
              // pathname이 create가 될 때 (사용자가 create버튼 클릭)
              else if(pathname === "/create")
                template=Template.HTML(sanitizedTitle,li_list,Template.FORM('process_create',`value=""`,""),'');
              // pathname이 update가 될 때 (사용자가 update버튼 클릭)
              else if(pathname ==="/update")
                template=Template.HTML(sanitizedTitle,li_list,Template.FORM('process_update',`value=${sanitizedTitle}`,sanitizeDescription),'');
              // 홈 디렉토리가 아닐 때 (사용자가 리스트 요소를 클릭)
              else if(_url !== '/')
                template=Template.HTML(sanitizedTitle,li_list,sanitizeDescription,`
                  <!-- 글 수정 버튼 -->
                  <a href="/update?id=${sanitizedTitle}">update</a>

                  <!-- 글 삭제 버튼 -->
                  <form action="process_delete" method="post">
                    <input type="hidden" name="id" value="${sanitizedTitle}">
                    <input type="submit" value="delete">
                  </form>
                  `);

              // "이 콘텐츠는 표준 텍스트이다"라는 것을 클라이언트에 전달
              response.writeHead(200);
              response.end(template);
            });
      });
  }

});
app.listen(3000);
