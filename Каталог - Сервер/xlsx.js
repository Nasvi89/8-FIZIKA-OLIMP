/* Минимальный автономный генератор .xlsx (без внешних библиотек).
   Экспорт: window.makeXlsxFromAoA(aoa, {sheetName}) -> { blob, name }
   Собирает ZIP без сжатия (метод store) из XML-частей, читаемых Excel. */
(function(root){
if(root.__XLSX_MIN) return; root.__XLSX_MIN=true;

// CRC32 (zlib)
var CRC_TABLE=null;
function crcTable(){ if(CRC_TABLE) return CRC_TABLE; CRC_TABLE=new Uint32Array(256); for(var n=0;n<256;n++){ var c=n; for(var k=0;k<8;k++){ c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);} CRC_TABLE[n]=c;} return CRC_TABLE;}
function crc32(data){ var t=crcTable(); var c=0xFFFFFFFF; for(var i=0;i<data.length;i++){ c=t[(c^data[i])&0xFF]^(c>>>8);} return (c^0xFFFFFFFF)>>>0; }

function utf8Bytes(str){ return new TextEncoder().encode(str); }
function concatBytes(arrs){ var len=0; arrs.forEach(function(a){len+=a.length;}); var out=new Uint8Array(len); var o=0; arrs.forEach(function(a){ out.set(a,o); o+=a.length;}); return out; }
function u16(n){ return [n&255,(n>>8)&255]; }
function u32(n){ return [n&255,(n>>8)&255,(n>>16)&255,(n>>24)&255]; }

// Прямой (store) метод ZIP. content: [Uint8Array]
function buildZip(entries){
  var local=[], central=[], offset=0;
  entries.forEach(function(e){
    var name=utf8Bytes(e.name), data=e.data;
    var crc=crc32(data);
    // локальный заголовок: sig(4) ver(2) flags(2) method(2) time(2) date(2) crc(4) csize(4) usize(4) namelen(2) extralen(2)
    var l=[0x50,0x4b,0x03,0x04]; l=l.concat(u16(20),u16(0),u16(0),u16(0),u16(0)); l=l.concat(u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0));
    local.push(concatBytes([new Uint8Array(l),name,data]));
    // центральный заголовок: sig(4) verMade(2) verNeeded(2) flags(2) method(2) time(2) date(2) crc(4) csize(4) usize(4) namelen(2) extralen(2) commentlen(2) disk(2) intattr(2) extattr(4) offset(4)
    var ch=[0x50,0x4b,0x01,0x02]; ch=ch.concat(u16(20),u16(20),u16(0),u16(0),u16(0),u16(0)); ch=ch.concat(u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset));
    central.push(concatBytes([new Uint8Array(ch),name]));
    offset += (30 + name.length + data.length);
  });
  var centralData=concatBytes(central);
  var eocd=[0x50,0x4b,0x05,0x06]; eocd=eocd.concat(u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralData.length),u32(offset),u16(0));
  return concatBytes(local.concat([centralData,new Uint8Array(eocd)]));
}
function xmlEscape(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"); }
function colName(i){ var n=i+1, s=""; while(n>0){ var r=(n-1)%26; s=String.fromCharCode(65+r)+s; n=Math.floor((n-1)/26);} return s; }

function sheetXml(aoa){
  var rows="";
  aoa.forEach(function(row,ri){
    var cells="";
    row.forEach(function(v,ci){
      var ref=colName(ci)+(ri+1);
      var style=ci===0?" s=\"1\"":"";
      if(v===null||v===undefined||v===""){ cells+="<c r=\""+ref+"\"/>"+style; }
      else if(typeof v==="number"){ cells+="<c r=\""+ref+"\""+style+"><v>"+v+"</v></c>"; }
      else { cells+="<c r=\""+ref+"\""+style+" t=\"inlineStr\"><is><t xml:space=\"preserve\">"+xmlEscape(v)+"</t></is></c>"; }
    });
    rows+="<row r=\""+(ri+1)+"\">"+cells+"</row>";
  });
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetData>'
    +rows
    +'</sheetData></worksheet>';
}

root.makeXlsxFromAoA=function(aoa, opts){
  opts=opts||{};
  var sheetName=(opts.sheetName||"Лист1").slice(0,31).replace(/[\\\/\?\*\[\]:]/g,"_");
  var aoaNorm=aoa||[[]];
  var files=[
    { name:"[Content_Types].xml", data:utf8Bytes('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>') },
    { name:"_rels/.rels", data:utf8Bytes('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>') },
    { name:"xl/workbook.xml", data:utf8Bytes('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+xmlEscape(sheetName)+'" sheetId="1" r:id="rId1"/></sheets></workbook>') },
    { name:"xl/_rels/workbook.xml.rels", data:utf8Bytes('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>') },
    { name:"xl/worksheets/sheet1.xml", data:utf8Bytes(sheetXml(aoaNorm)) },
    { name:"xl/styles.xml", data:utf8Bytes('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>') }
  ];
  var zip=buildZip(files);
  return { blob: new Blob([zip], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), name:(opts.fileName||"export.xlsx") };
};

root.__xlsxDownloadAoA=function(aoa, opts){
  var r=root.makeXlsxFromAoA(aoa, opts);
  var url=URL.createObjectURL(r.blob);
  var a=document.createElement("a"); a.href=url; a.download=r.name;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); },400);
};

/* ---------- Чтение .xlsx -> AOA (для импорта) ---------- */
// Распаковывает ZIP-XLSX (store method), читает sheet1.xml -> массив строк.
function utf8ToStr(u8){
  if(typeof TextDecoder!=="undefined"){ return new TextDecoder().decode(u8); }
  var s=""; for(var i=0;i<u8.length;i++){ s+=String.fromCharCode(u8[i]); } return decodeURIComponent(escape(s));
}
function readZipEntries(bytes){
  // ищем сигнатуры PK\x03\x04, вынимаем имена и данные (store)
  var entries={}, i=0;
  while(i<bytes.length-4){
    if(bytes[i]===0x50&&bytes[i+1]===0x4b&&bytes[i+2]===0x03&&bytes[i+3]===0x04){
      var method=(bytes[i+8]|(bytes[i+9]<<8));
      var csize=(bytes[i+18]|(bytes[i+19]<<8)|(bytes[i+20]<<16)|(bytes[i+21]<<24))>>>0;
      var nlen=(bytes[i+26]|(bytes[i+27]<<8));
      var elen=(bytes[i+28]|(bytes[i+29]<<8));
      var name="";
      for(var k=0;k<nlen;k++) name+=String.fromCharCode(bytes[i+30+k]);
      var dataStart=i+30+nlen+elen;
      var data=bytes.slice(dataStart, dataStart+csize);
      entries[name]=data;
      i=dataStart+csize;
    } else { i++; }
  }
  return entries;
}
function xlsxSheetToAoa(entries){
  var xml=entries["xl/worksheets/sheet1.xml"];
  if(!xml) return [];
  var text=utf8ToStr(xml);
  var aoa=[];
  var rowRe=/<row[^>]*>([\s\S]*?)<\/row>/g, m;
  while((m=rowRe.exec(text))){
    var rowHtml=m[1];
    var row=[], cellIdx=0;
    var cellRe=/<c[^>]*r="([A-Z]+)\d+"[^>]*>([\s\S]*?)<\/c>/g, cm;
    // предзаполняем
    var refs={};
    while((cm=cellRe.exec(rowHtml))){
      var col=cm[1];
      var inner=cm[2]||"";
      var val="";
      // inlineStr
      var is=/<is><t[^>]*>([\s\S]*?)<\/t><\/is>/.exec(inner);
      if(is){ val=inlineUnescape(is[1]); }
      else {
        var tv=/<v>([\s\S]*?)<\/v>/.exec(inner);
        if(tv){ val=tv[1]; if(val.indexOf(".")>=0 && !isNaN(parseFloat(val))){ val=parseFloat(val); } else if(!isNaN(+val)&&val!==""){ val=+val; } }
      }
      // shared string index
      var st=/ t="s"/.exec(inner);
      if(st && /<v>(\d+)<\/v>/.test(inner)){ var si=+RegExp.$1; if(entries.shared) val=(entries.shared[si]!==undefined)?entries.shared[si]:" "; }
      refs[col]=val;
    }
    // собрать по порядку колонок A..Z и дальше
    var maxCol=Object.keys(refs).reduce(function(a,b){ var v=colToNum(b); return v>a?v:a; },0)||0;
    for(var c2=0;c2<=maxCol;c2++){ row.push(refs[colName(c2)]!==undefined?refs[colName(c2)]:""); }
    aoa.push(row);
  }
  return aoa;
}
function colToNum(col){ var n=0; for(var i=0;i<col.length;i++){ n=n*26+(col.charCodeAt(i)-64); } return n-1; }
function inlineUnescape(t){ return String(t).replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'"); }
root.__xlsxReadFileToAoa=function(file, cb, errCb){
  var r=new FileReader();
  r.onload=function(){
    try{
      var u8=new Uint8Array(r.result);
      var entries=readZipEntries(u8);
      var aoa=xlsxSheetToAoa(entries);
      cb(aoa);
    }catch(e){ errCb&&errCb(e); }
  };
  r.onerror=function(){ errCb&&errCb(new Error("read error")); };
  r.readAsArrayBuffer(file);
};
root.__xlsxReadBytesToAoa=function(bytes, shared){
  try{
    var entries=readZipEntries(bytes);
    if(shared) entries.shared=shared;
    return xlsxSheetToAoa(entries);
  }catch(e){ return []; }
};

})(typeof self!=='undefined'?self:this);