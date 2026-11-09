/* Генерация PDF в «Физика.Олимп» (pdf-lib + DejaVu Sans, кириллица).
   Функции: PDF-листовка контрольной работы (2 варианта), PDF банка задач,
   PDF статистики класса. Всё — настоящий PDF, не печать. */
(function(){
if(window.__OLYMP_PDFGEN) return; window.__OLYMP_PDFGEN=true;

function base64ToBytes(b64){
  var bin=atob(b64), len=bin.length, bytes=new Uint8Array(len);
  for(var i=0;i<len;i++) bytes[i]=bin.charCodeAt(i);
  return bytes;
}
function esc(s){ return String(s==null?"":s); }
window.__downloadPdfBytes=function(bytes, name){
  var blob=new Blob([bytes],{type:"application/pdf"});
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url; a.download=name;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); },500);
};

/* Общая подготовка doc+font */
function pdfDoc(){
  return window.PDFLib.PDFDocument.create().then(function(doc){
    if(window.__FONTKIT) doc.registerFontkit(window.__FONTKIT);
    return doc.embedFont(base64ToBytes(window.FIZIKA8_FONT_B64)).then(function(font){ return {doc:doc,font:font,PDFLib:window.PDFLib,A4:window.PDFLib.PageSizes.A4,rgb:window.PDFLib.rgb}; });
  });
}
function wrapText(font, text, maxW, size){
  var words=String(text==null?"":text).split(/\s+/), lines=[], cur="";
  var fits=function(t){ return font.widthOfTextAtSize(t,size)<=maxW; };
  words.forEach(function(w){
    var probe=cur?(cur+" "+w):w;
    if(cur && !fits(probe)){ lines.push(cur); cur=w; } else cur=probe;
  });
  if(cur) lines.push(cur);
  var out=[];
  lines.forEach(function(l){
    while(l && font.widthOfTextAtSize(l,size)>maxW){
      var avg=font.widthOfTextAtSize(l,size)/l.length;
      var cut=Math.max(3,Math.floor(maxW/avg));
      out.push(l.slice(0,cut)); l=l.slice(cut);
    }
    if(l) out.push(l);
  });
  return out;
}

/* ============ PDF: контрольная работа (2 варианта, один = страница A4) ============ */
window.OLYMP_buildControlPdf=function(opts){
  // opts: { v1:{A,B,C}, v2:{A,B,C}, theme, fileName }
  return pdfDoc().then(function(ctx){
    var doc=ctx.doc, font=ctx.font, W=595.28, H=841.89, M=42, cw=W-2*M;
    var rgb=ctx.rgb, ink=rgb(0.12,0.15,0.28), inkSoft=rgb(0.32,0.36,0.55), accent=rgb(0.27,0.42,0.88), line=rgb(0.80,0.83,0.91), band=rgb(0.95,0.96,0.995);
    function wrap(text,size){ return wrapText(font,text,cw,size); }
    [[opts.v1,"Вариант 1"],[opts.v2,"Вариант 2"]].forEach(function(pair){
      var V=pair[0], label=pair[1];
      var page=doc.addPage(ctx.A4); var y=H-40;
      function t(s,x,size,color,gap){ page.drawText(esc(s),{x:x,y:y,size:size,color:color||ink,font:font}); y-=(gap!==undefined?gap:(size+4)); }
      function center(s,size,color,gap){ var w=font.widthOfTextAtSize(esc(s),size); t(s,W/2-w/2,size,color,gap); }
      page.drawRectangle({x:0,y:H-70,width:W,height:70,color:band});
      page.drawLine({start:{x:0,y:H-70},end:{x:W,y:H-70},thickness:2,color:accent});
      y=H-38;
      var head="Контрольная работа \u00AB"+(opts.theme||"физика \u2014 8 класс")+"\u00BB";
      var hsize = font.widthOfTextAtSize(head,14)>cw ? 11.5 : 14;
      wrap(head,hsize).forEach(function(ln){ center(ln,hsize,ink,18); });
      y-=1;
      wrap("Блок A (задания 1\u20136) \u2013 база \u00B71 балл; блок B (7\u20139) \u2013 актив \u00B72; блок C (10\u201311) \u2013 олимп \u00B73.",9.5).forEach(function(ln){ center(ln,9.5,inkSoft,13); });
      y-=4;
      page.drawLine({start:{x:M,y:y},end:{x:M+cw,y:y},thickness:1,color:line});
      y-=14;
      var bw=font.widthOfTextAtSize(label,12)+30;
      page.drawRectangle({x:W/2-bw/2,y:y-3,width:bw,height:20,color:accent,borderRadius:10});
      page.drawText(esc(label),{x:W/2-font.widthOfTextAtSize(esc(label),12)/2,y:y-1,size:12,color:rgb(1,1,1),font:font});
      y-=24;
      var num=0;
      V.A.concat(V.B).concat(V.C).forEach(function(tt){
        num++;
        var pts = tt.level==="base"?1:(tt.level==="olimp"?3:2);
        var bodyLines=wrap(tt.text,10.5), optJoined="";
        if(tt.options&&tt.options.length){ tt.options.forEach(function(o,i){ optJoined+=((i+1)+") "+o)+"     "; }); }
        var optLines = tt.options&&tt.options.length ? wrapText(font,optJoined,cw-14,10) : [];
        var needed = 13 + bodyLines.length*12.5 + optLines.length*12 + 14;
        if(y < needed+60){ page=doc.addPage(ctx.A4); y=H-52; }
        var h="Задание "+num+". ";
        page.drawText(esc(h),{x:M,y:y,size:11.5,color:accent,font:font});
        page.drawText(esc("("+pts+" балл"+(pts===1?"":"а")+")"),{x:M+font.widthOfTextAtSize(h,11.5)+2,y:y,size:10,color:inkSoft,font:font});
        y-=15;
        bodyLines.forEach(function(ln){ page.drawText(esc(ln),{x:M+2,y:y,size:10.5,color:ink,font:font}); y-=12.5; });
        y-=2;
        if(optLines.length){
          optLines.forEach(function(ln){ page.drawText(esc(ln),{x:M+14,y:y,size:10,color:inkSoft,font:font}); y-=12; });
          y-=3;
        }
        y-=6;
      });
      y-=6;
      if(y>100) page.drawLine({start:{x:M,y:y},end:{x:M+cw,y:y},thickness:0.7,color:line});
    });
    return doc;
  }).then(function(doc){ return doc.save(); })
    .then(function(bytes){ window.__downloadPdfBytes(bytes, opts.fileName||"Контрольная_работа.pdf"); });
};

/* ============ PDF: билеты сессии (2 комплекта) ============ */
// opts: { set1:[{topic:{name,body,desc},tasks:[{text,options?,answer?,image?}]}], set2:[...], clsName, fileName }
window.OLYMP_buildTicketsPdf=function(opts){
  return pdfDoc().then(function(ctx){
    var doc=ctx.doc, font=ctx.font, W=595.28, H=841.89, M=42, cw=W-2*M;
    var rgb=ctx.rgb, ink=rgb(0.12,0.15,0.28), inkSoft=rgb(0.32,0.36,0.55), accent=rgb(0.27,0.42,0.88), line=rgb(0.80,0.83,0.91), band=rgb(0.95,0.96,0.995), white=rgb(1,1,1);
    // кэш загруженных картинок: srcKey -> {img,w,h}
    var imgCache={};
    function loadImage(src){
      var key=src;
      if(imgCache[key]) return Promise.resolve(imgCache[key]);
      return fetch(src).then(function(res){ if(!res.ok) throw new Error("img "+res.status); return res.arrayBuffer(); })
        .then(function(buf){ return doc.embedPng(new Uint8Array(buf)); })
        .then(function(img){ var r={img:img,w:img.width,h:img.height}; imgCache[key]=r; return r; })
        .catch(function(){ imgCache[key]={img:null,w:0,h:0}; return imgCache[key]; });
    }

    function drawHeader(page, label, clsName){
      var y=H-40;
      page.drawRectangle({x:0,y:H-70,width:W,height:70,color:band});
      page.drawLine({start:{x:0,y:H-70},end:{x:W,y:H-70},thickness:2,color:accent});
      var title="Билеты по физике \u00B7 8 класс \u00B7 Зимняя сессия";
      var thsize = font.widthOfTextAtSize(title,13.5)>cw ? 11 : 13.5;
      wrapText(font,title,cw,thsize).forEach(function(ln){ page.drawText(esc(ln),{x:W/2-font.widthOfTextAtSize(ln,thsize)/2,y:y,size:thsize,color:ink,font:font}); y-=16; });
      var sub=(clsName?"Класс: "+clsName+"    \u00B7    ":"")+label;
      page.drawText(esc(sub),{x:W/2-font.widthOfTextAtSize(sub,9.5)/2,y:y,size:9.5,color:inkSoft,font:font});
      page.drawLine({start:{x:M,y:y-14},end:{x:M+cw,y:y-14},thickness:1,color:line});
      return y-20;
    }

    var page=null, y=0;
    function addPage(){ page=doc.addPage(ctx.A4); y=H-56; return page; }
    // разбить "| a | b |" строки таблицы на массивы ячеек; вернуть {rows:[[...]], text:[...]}
    function splitTable(text){
      var lines=String(text).split("\n");
      var rows=[], parts=[], inT=false;
      lines.forEach(function(raw){
        if(/^\s*\|/.test(raw)){
          var cells=raw.split("|").slice(1,-1).map(function(c){return c.trim();});
          var sig=cells.join("").replace(/[\s:|-]/g,"");
          if(sig){ rows.push(cells); } // пропускаем |---|
        } else { parts.push(raw); }
      });
      return { rows:rows, text:parts.join("\n").trim() };
    }
    // рисует один билет
    function drawTicket(t, num){
      var padded=num<10?("0"+num):String(num);
      if(y<60){ page=addPage(); }
      page.drawRectangle({x:M,y:y-3,width:cw,height:22,color:rgb(0.955,0.965,0.995)});
      page.drawLine({start:{x:M,y:y-3},end:{x:W-M,y:y-3},thickness:1.2,color:accent});
      page.drawText(esc("\u0411\u0438\u043b\u0435\u0442 "+padded),{x:M+8,y:y,size:12,color:accent,font:font});
      y-=24;
      // пункт 1: тема (название)
      var tl=wrapText(font,"1. "+t.topic.name,cw-14,9.5);
      if(y<tl.length*12+50){ page=addPage(); }
      tl.forEach(function(ln){ page.drawText(esc(ln),{x:M+7,y:y,size:9.5,color:ink,font:font}); y-=12; });
      y-=6;
      // задачи
      (t.tasks||[]).forEach(function(q,qi){
        var label=String(qi+2)+". ";
        var st=splitTable(q.text||"");
        var bodyLines=wrapText(font,label+st.text,cw-14,9.5);
        var optLines=[];
        if(q.options&&q.options.length){ q.options.forEach(function(o,i){ optLines=optLines.concat(wrapText(font,"  "+String(i+1)+") "+o,cw-24,9)); }); }
        var imgH=0; var imgR=imgCache[String(q.image&&(Array.isArray(q.image)?q.image[0]:q.image))||""];
        if(imgR&&imgR.img){ imgH=Math.min(200, (200*(imgR.h||1))/(imgR.w||1)); }
        var needed = 14 + bodyLines.length*12 + optLines.length*11 + (st.rows.length? st.rows.length*13+8:0) + imgH + 14;
        if(y<needed+40){ page=addPage(); }
        bodyLines.forEach(function(ln){ page.drawText(esc(ln),{x:M+7,y:y,size:9.5,color:ink,font:font}); y-=12; });
        y-=3;
        // таблица
        if(st.rows.length){
          var colw=cw-14;
          var rowH=13;
          st.rows.forEach(function(r){
            var x=M+12;
            var cellw=colw/(r.length||1);
            r.forEach(function(cell){
              page.drawText(esc(cell),{x:x+2,y:y,size:8.5,color:ink,font:font});
              page.drawLine({start:{x:x,y:y-3},end:{x:x+cellw,y:y-3},thickness:0.4,color:line});
              page.drawLine({start:{x:x,y:y-3},end:{x:x,y:y-rowH},thickness:0.4,color:line});
              x+=cellw;
            });
            page.drawLine({start:{x:M+12+colw,y:y-3},end:{x:M+12+colw,y:y-rowH},thickness:0.4,color:line});
            page.drawLine({start:{x:M+12,y:y-rowH},end:{x:M+12+colw,y:y-rowH},thickness:0.4,color:line});
            y-=rowH;
          });
          y-=5;
        }
        optLines.forEach(function(ln){ page.drawText(esc(ln),{x:M+20,y:y,size:9,color:inkSoft,font:font}); y-=11; });
        y-=4;
        // картинка
        if(imgR&&imgR.img){
          var drawW=Math.min(240, cw-14);
          var drawH=drawW*(imgR.h)/(imgR.w||1);
          if(drawH>220){ drawH=220; drawW=drawH*(imgR.w)/(imgR.h||1); }
          if(y<drawH+30){ page=addPage(); }
          page.drawImage(imgR.img,{x:M+10,y:y-drawH,width:drawW,height:drawH});
          y-=drawH+10;
        }
        y-=4;
      });
      y-=8;
      page.drawLine({start:{x:M,y:y},end:{x:M+cw,y:y},thickness:0.4,color:line});
      y-=14;
    }

    // загружаем все картинки обеих комплектов перед отрисовкой
    var loaders=[];
    [opts.set1,opts.set2].forEach(function(list){ (list||[]).forEach(function(t){ (t.tasks||[]).forEach(function(q){ if(q.image){ var s=Array.isArray(q.image)?q.image[0]:q.image; loaders.push(loadImage(s)); } }); }); });
    return Promise.all(loaders).then(function(){
      [[opts.set1,"Комплект 1"],[opts.set2,"Комплект 2"]].forEach(function(pair){
        var list=pair[0], label=pair[1];
        if(!list||!list.length) return;
        addPage();
        y=drawHeader(page, label, opts.clsName||"");
        list.forEach(function(t,ti){ drawTicket(t, t.num||(ti+1)); });
      });
      return doc;
    });
  }).then(function(doc){ return doc.save(); })
    .then(function(bytes){ window.__downloadPdfBytes(bytes, opts.fileName||"Билеты_сессии.pdf"); });
};
window.OLYMP_buildBankPdf=function(tasks, title, fileName){
  // tasks: [{text,options?,answer?,level}]
  return pdfDoc().then(function(ctx){
    var doc=ctx.doc, font=ctx.font, W=595.28, H=841.89, M=42, cw=W-2*M;
    var rgb=ctx.rgb, ink=rgb(0.12,0.15,0.28), inkSoft=rgb(0.32,0.36,0.55), accent=rgb(0.27,0.42,0.88), line=rgb(0.80,0.83,0.91), band=rgb(0.95,0.96,0.995);
    var wrap=function(text,size){ return wrapText(font,text,cw-8,size); };
    var page=doc.addPage(ctx.A4); var y=H-50;
    function t(s,x,size,color,gap){ page.drawText(esc(s),{x:x,y:y,size:size,color:color||ink,font:font}); y-=(gap!==undefined?gap:(size+4)); }
    function center(s,size,color,gap){ var w=font.widthOfTextAtSize(esc(s),size); t(s,W/2-w/2,size,color,gap); }
    page.drawRectangle({x:0,y:H-66,width:W,height:66,color:band});
    page.drawLine({start:{x:0,y:H-66},end:{x:W,y:H-66},thickness:2,color:accent});
    y=H-38;
    var hsize = font.widthOfTextAtSize(esc(title||"Банк задач"),14)>cw ? 11.5 : 14;
    wrap(title||"Банк задач",hsize).forEach(function(ln){ center(ln,hsize,ink,20); });
    y-=2;
    center("Блок A \u2013 база (1 балл) \u00B7 блок B \u2013 актив (2) \u00B7 блок C \u2013 олимп (3).",9.5,inkSoft,14);
    y-=8;
    page.drawLine({start:{x:M,y:y},end:{x:M+cw,y:y},thickness:1,color:line});
    y-=18;
    var num=0;
    tasks.forEach(function(tt){
      num++;
      var tag = tt.level==="base"?"A":(tt.level==="olimp"?"C":"B");
      var bodyLines=wrap(tt.text,10.5);
      var ansLines=wrap(tt.answer?("Ответ: "+tt.answer):"",10);
      var needed = 14 + bodyLines.length*12.5 + ansLines.length*12.5 + 12;
      if(y < needed+60){ page=doc.addPage(ctx.A4); y=H-56; }
      page.drawText(esc(num+". [\u0411\u043b\u043e\u043a "+tag+"]"), {x:M,y:y,size:11,color:accent,font:font});
      y-=15;
      bodyLines.forEach(function(ln){ page.drawText(esc(ln),{x:M+4,y:y,size:10.5,color:ink,font:font}); y-=12.5; });
      y-=2;
      if(ansLines.length){
        ansLines.forEach(function(ln){ page.drawText(esc(ln),{x:M+4,y:y,size:10,color:inkSoft,font:font}); y-=12.5; });
      }
      y-=7;
      page.drawLine({start:{x:M,y:y+10},end:{x:M+cw,y:y+10},thickness:0.3,color:line});
    });
    return doc;
  }).then(function(doc){ return doc.save(); })
    .then(function(bytes){ window.__downloadPdfBytes(bytes, fileName||"Банк_задач.pdf"); });
};

/* ============ PDF: статистика класса ============ */
// rows: [{name, xp, level, solved, olymp, pct}]
// olympTable: [{name, hearts:bool[]}]
// olympNames: string[] — названия олимпиад в том же порядке, что hearts
// olympSolvedNames: {login: string[]} — названия решённых олимпиад по логину (доп.)
window.OLYMP_buildStatsPdf=function(clsName, rows, olympTable, olympNames, olympSolvedNames, fileName){
  olympNames=olympNames||[];
  olympSolvedNames=olympSolvedNames||{};
  return pdfDoc().then(function(ctx){
    var doc=ctx.doc, font=ctx.font, W=595.28, H=841.89, M=42, cw=W-2*M;
    var rgb=ctx.rgb, ink=rgb(0.12,0.15,0.28), inkSoft=rgb(0.32,0.36,0.55), accent=rgb(0.27,0.42,0.88), line=rgb(0.80,0.83,0.91), band=rgb(0.95,0.96,0.995);
    function addPage(){ var p=doc.addPage(ctx.A4); return {p:p,y:H-50}; }
    var P=addPage(); var page=P.p; var y=P.y;
    function t(s,x,size,color,gap){ page.drawText(esc(s),{x:x,y:y,size:size,color:color||ink,font:font}); y-=(gap!==undefined?gap:(size+4)); }
    page.drawRectangle({x:0,y:H-66,width:W,height:66,color:band});
    page.drawLine({start:{x:0,y:H-66},end:{x:W,y:H-66},thickness:2,color:accent});
    y=H-36;
    t("Статистика класса \u00AB"+(clsName||"")+"\u00BB",M,14,ink,20);
    t("Прогресс, олимпиады РСОШ · экспорт из раздела «Классы»",M,9.5,inkSoft,14);
    y-=6;
    page.drawLine({start:{x:M,y:y},end:{x:M+cw,y:y},thickness:1,color:line});
    y-=20;

    // Таблица учеников
    var cols=[{h:"Ученик",w:0.34},{h:"XP",w:0.10},{h:"Уровень",w:0.20},{h:"Задач",w:0.12},{h:"Олимп",w:0.12},{h:"Блоки %",w:0.12}];
    var colW=cw, x0=M;
    function cellW(c){ return colW*c.w; }
    // заголовок
    var cx=M;
    cols.forEach(function(c){ page.drawText(esc(c.h),{x:cx+2,y:y,size:9,color:rgb(1,1,1),font:font}); cx+=cellW(c); });
    page.drawRectangle({x:M,y:y-3,width:cw,height:16,color:accent});
    // перерисовать заголовок поверх rect
    cx=M; cols.forEach(function(c){ page.drawText(esc(c.h),{x:cx+2,y:y,size:9,color:rgb(1,1,1),font:font}); cx+=cellW(c); });
    y-=20;
    rows.forEach(function(r){
      if(y<70){ P=addPage(); page=P.p; y=P.y; }
      cx=M; var vals=[r.name,String(r.xp),r.level,String(r.solved),String(r.olymp),String(r.pct)];
      cols.forEach(function(c,i){
        var vtxt=esc(vals[i]);
        var sz= c.w<0.20 ? 8 : 9;
        if(font.widthOfTextAtSize(vtxt,sz)> cellW(c)-4){ vtxt=wrapText(font,vtxt,cellW(c)-4,sz).join(" "); }
        page.drawText(vtxt,{x:cx+2,y:y,size:sz,color:ink,font:font}); cx+=cellW(c);
      });
      page.drawLine({start:{x:M,y:y-4},end:{x:M+cw,y:y-4},thickness:0.3,color:line});
      y-=16;
    });
    y-=14;
    // Раздел: успеваемость по олимпиадам
    page.drawText(esc("Успеваемость по олимпиадам РСОШ"),{x:M,y:y,size:12,color:accent,font:font});
    y-=16;
    if(y<70){ P=addPage(); page=P.p; y=P.y; }
    if(!olympTable || !olympTable.length){
      page.drawText(esc("Нет данных."),{x:M,y:y,size:10,color:inkSoft,font:font});
      y-=14;
    } else {
      var oh=olympTable[0].hearts?olympTable[0].hearts.length:0;
      var nameW=120, heartW=16, hx=M+nameW;
      page.drawText(esc("Ученик"),{x:M,y:y,size:9,color:inkSoft,font:font});
      page.drawText(esc("Олимпиада №1.."+oh+" (\u2665 = решена)"),{x:hx,y:y,size:8,color:inkSoft,font:font});
      y-=13;
      olympTable.forEach(function(rw){
        if(y<60){ P=addPage(); page=P.p; y=P.y; }
        page.drawText(esc(rw.name),{x:M,y:y,size:9,color:ink,font:font});
        (rw.hearts||[]).forEach(function(on,i){
          page.drawText(on?"\u2665":"\u2661",{x:hx+i*heartW,y:y,size:9,color:on?rgb(0.9,0.3,0.2):inkSoft,font:font});
        });
        y-=14;
      });
    }
    // Решённые олимпиады по именам
    y-=8;
    if(olympSolvedNames && Object.keys(olympSolvedNames).length){
      page.drawText(esc("Конкретные олимпиады, отмеченные у учеников"),{x:M,y:y,size:11,color:accent,font:font});
      y-=14;
      olympTable.forEach(function(rw){
        var names=olympSolvedNames[rw.login]||[];
        if(!names.length) return;
        if(y<70){ P=addPage(); page=P.p; y=P.y; }
        page.drawText(esc("\u2665 "+rw.name+":"),{x:M,y:y,size:8.5,color:rgb(0.7,0.25,0.15),font:font});
        y-=11;
        var blocks=wrapText(font,names.join(", "),cw,8.5);
        blocks.forEach(function(b){
          if(y<60){ P=addPage(); page=P.p; y=P.y; }
          page.drawText(esc(b),{x:M+10,y:y,size:8.5,color:ink,font:font});
          y-=11;
        });
        y-=3;
      });
    }
    return doc;
  }).then(function(doc){ return doc.save(); })
    .then(function(bytes){ window.__downloadPdfBytes(bytes, fileName||("Статистика_класса_"+(clsName||"")+".pdf")); });
};

/* ============ PDF: олимпиадное движение (отдельный экспорт) ============ */
// rows: [{login,name,level,hearts:bool[]}] ученики класса (level необязателен)
// olympNames: string[] названия олимпиад (порядок как hearts)
// olympLevels: number[] уровни олимпиад 1..3 (необязателен)
// Формат: 1 ученик = 1 страница: имя; ниже список олимпиад, у каждой + (решено) / - (не решено).
window.OLYMP_buildOlympMovementPdf=function(clsName, rows, olympNames, olympLevels, fileName){
  olympNames=olympNames||[];
  olympLevels=olympLevels||[];
  return pdfDoc().then(function(ctx){
    var doc=ctx.doc, font=ctx.font, W=595.28, H=841.89, M=42, cw=W-2*M;
    var rgb=ctx.rgb, ink=rgb(0.12,0.15,0.28), inkSoft=rgb(0.32,0.36,0.55), accent=rgb(0.27,0.42,0.88), line=rgb(0.80,0.83,0.91), band=rgb(0.95,0.96,0.995), ok=rgb(0.15,0.55,0.35), no=rgb(0.6,0.63,0.72);
    function t(p,s,x,size,color,gap){ p.drawText(esc(s),{x:x,y:y,size:size,color:color||ink,font:font}); y-=(gap!==undefined?gap:(size+4)); }

    function studentPage(rw){
      var page=doc.addPage(ctx.A4);
      var py=H-52;
      page.drawRectangle({x:0,y:H-66,width:W,height:66,color:band});
      page.drawLine({start:{x:0,y:H-66},end:{x:W,y:H-66},thickness:2,color:accent});
      page.drawText(esc("Олимпиадное движение"),{x:M,y:H-38,size:11,color:ink,font:font});
      page.drawText(esc("Ученик \u00AB"+(clsName||"")+"\u00BB"),{x:M,y:H-26,size:8.5,color:inkSoft,font:font});
      page.drawLine({start:{x:M,y:H-72},end:{x:M+cw,y:H-72},thickness:1,color:line});
      // Имя ученика
      page.drawText(esc(rw.name||""),{x:M,y:py,size:15,color:accent,font:font});
      py-=16;
      // Шапка таблицы: Олимпиада | Уровень | Статус
      var markW=30, lvW=40;
      page.drawRectangle({x:M,y:py-6,width:cw,height:15,color:accent});
      page.drawText(esc("Олимпиада (уровень)"),{x:M,y:py-4,size:9,color:rgb(1,1,1),font:font});
      page.drawText(esc("Статус"),{x:W-M-markW,y:py-4,size:9,color:rgb(1,1,1),font:font});
      py-=21;
      // Строки: олимпиада + +/-
      var count=olympNames.length;
      for(var i=0;i<count;i++){
        var solved= rw.hearts && rw.hearts[i];
        var lvLabel = olympLevels[i]===0 ? " (МинПрос)" : (olympLevels[i]? " (ур."+olympLevels[i]+")" : "");
        var label=String(i+1)+". "+olympNames[i] + lvLabel;
        if(py<60){ page=doc.addPage(ctx.A4); py=H-40; page.drawRectangle({x:0,y:H-66,width:W,height:66,color:band}); page.drawLine({start:{x:0,y:H-66},end:{x:W,y:H-66},thickness:2,color:accent}); page.drawText(esc(rw.name||""),{x:M,y:H-36,size:14,color:accent,font:font}); py=H-60; }
        // слово перенос на строки при необходимости
        var lines=wrapText(font,label,cw-markW-lvW-10,8.5);
        lines.forEach(function(ln,li){
          page.drawText(esc(ln),{x:M,y:py-3,size:8.5,color:ink,font:font});
          py-=11;
        });
        page.drawText(esc(solved?"+":"-"),{x:W-M-markW+6,y:py+8,size:12,color:solved?ok:no,font:font});
        page.drawLine({start:{x:M,y:py-2},end:{x:M+cw,y:py-2},thickness:0.3,color:line});
        py-=7;
      }
      py-=6;
      // Итог: сколько из скольких
      var solvedCount=olympNames.reduce(function(a,_,i){ return a+((rw.hearts&&rw.hearts[i])?1:0); },0);
      page.drawText(esc("Итог: решено "+solvedCount+" из "+count),{x:M,y:py,size:9.5,color:solvedCount?ok:inkSoft,font:font});
    }

    (rows||[]).forEach(function(rw){ studentPage(rw); });
    return doc;
  }).then(function(doc){ return doc.save(); })
    .then(function(bytes){ window.__downloadPdfBytes(bytes, fileName||("Олимпиадное_движение_"+(clsName||"")+".pdf")); });
};

})();