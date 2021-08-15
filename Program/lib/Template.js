const path=require('path');

// Template 객체
var Template={
  // HTML 코드가 담긴 문자열 반환
  HTML:(title,authStatusUI,li_list,body,control)=>{
    return `
    <!doctype html>
    <html>
    <head>
      <title>UBI - ${title}</title>
      <meta charset="utf-8">
    </head>
    <body>
      ${authStatusUI}
      <h1><a href="/">UBI Forum</a></h1>
      <ul>
        ${li_list}
      </ul>
      <p>${control}</p>
      <h2>${title}</h2>
      ${body}
    </body>
    </html>
    `;
  },

  // 로그인하지 않고 게시판을 이용하려고 할 때 나올 화면 반환
  LOGIN:()=>{
    return`
    <h2 style="color:red;">Login required!!</h2>
    <a style="color:red;" href="/page/login">Login</a>
    `;
  },

  // authStatusUI(로그인 유무 UI)에 관한 a태그 반환
  AUTH:(user)=>{
    if(user !== undefined)
      authStatusUI=`${user.Nickname} | <a href="/log_in_out/process_logout">Logout</a>`;
    else
      authStatusUI=`<a href="/page/login">Login</a> | <a href="/page/register">Register</a>`;
    return authStatusUI;
  },

  // HTML의 li태그가 담긴 문자열 반환
  LIST:(dblist)=>{
    let li_list=""; // (파일명이 추가된 li태그) 목록
    dblist.forEach((item,index)=>{
         li_list=li_list+"<li><a href=/page/"+item.post_id+">"+`${item.title} (${item.user_nickname})`+"</a></li>";
    });
    return li_list;
  },

  // HTML의 li태그가 담긴 문자열 반환 <UBI Zone>
  ULIST:(dblist)=>{
    let uli_list=""; // (파일명이 추가된 li태그) 목록
    dblist.forEach((item,index)=>{
         uli_list=uli_list+"<li><a href=/ubi/page/"+item.post_id+">"+`${item.title} (${item.user_nickname})`+"</a></li>";
    });
    return uli_list;
  },

  // HTML의 form태그가 담긴 문자열 반환
  FORM:(skill,value_id,value_title,description)=>{
    // 데이터는 form태그안의 name변수들을 묶어서 보낸다고 생각하면 편함
    // 사용자가 보내는 데이터는 localhost서버에서 담당 (이 서버의 프로그램에서 ${skill}라는 path가 올 때 처리를 함)
    // value, description, id변수는 <글 수정>에서 사용함
    return `<form action="${skill}" method="post">
     <input type="hidden" name="id" ${value_id}>
      <p><input type="text" size="30" name="title" placeholder="title" ${value_title}></p>
      <p>
        <textarea rows="10" cols="40" name="description" placeholder="description">${description}</textarea>
      </p>
      <p>
        <input type="submit">
      </p>
    </form>
    `;
  }
};

// module.exports속성이 가리키는 객체 변경
module.exports=Template;
