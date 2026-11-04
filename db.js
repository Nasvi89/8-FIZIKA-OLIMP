/* Слой базы данных: синхронизация localStorage ↔ Supabase.
   Грузится ДО app.js. При старте выгружает все общие данные из Supabase в localStorage,
   чтобы app.js (синхронный) видел актуальную базу. Все saveX-функции в app.js дублируют
   записи в облако асинхронно через window.DB.push.

   Таблицы Supabase: kv(key text primary key, value jsonb).
   Ключи: users, classes, homework, olympmarks, content, prog_<login>.
*/
(function(){
if(window.__DB_LOADED) return; window.__DB_LOADED=true;

var url = (window.DB_CONFIG&&DB_CONFIG.url)||"";
var key = (window.DB_CONFIG&&DB_CONFIG.publishableKey)||"";

// Карта: ключ Supabase -> ключ localStorage
function lsKeyFor(dbKey){ return dbKey==="olympmarks" ? "olymp8_olympiads" : ("olymp8_"+dbKey); }
function dbKeyForLk(lk){ return lk==="olymp8_olympiads" ? "olympmarks" : lk.replace(/^olymp8_/,""); }

function makeHeaders(prefer){
  var h = {
    "apikey": key,
    "Authorization": "Bearer "+key,
    "Content-Type": "application/json"
  };
  if(prefer) h["Prefer"] = prefer;
  return h;
}

window.DB = {
  ready: false,
  err: null,

  // Синхронная выгрузка всей базы из Supabase в localStorage (вызывается автоматически внизу)
  hydrateSync: function(){
    try{
      if(!url||!key){ window.DB.err="Нет конфигурации БД (db-config.js)"; return; }
      var rows = this.fetchAllSync();
      if(!rows || !rows.length) return;
      rows.forEach(function(r){
        if(!r || !r.key) return;
        var val = (typeof r.value==="object" && r.value!==null) ? r.value : {};
        try{ localStorage.setItem(lsKeyFor(r.key), JSON.stringify(val)); }catch(e){}
      });
      this.ready = true;
    }catch(e){ window.DB.err = String(e&&e.message||e); }
  },

  fetchAllSync: function(){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url+"/rest/v1/kv?select=key,value", false);
    var h={"apikey":key,"Authorization":"Bearer "+key,"Accept":"application/json","Content-Type":"application/json"};
    for(var k in h) xhr.setRequestHeader(k,h[k]);
    xhr.send(null);
    if(xhr.status>=200 && xhr.status<300){ return JSON.parse(xhr.responseText||"[]"); }
    throw new Error("HTTP "+xhr.status+" "+xhr.statusText);
  },

  // Асинхронная запись значения по ключу (опт-ин sher).
  push: function(dbKey, value){
    if(!url||!key) return Promise.resolve(false);
    return fetch(url+"/rest/v1/kv?on_conflict=key", {
      method:"POST",
      headers: makeHeaders("resolution=merge-duplicates"),
      body: JSON.stringify([{ key: dbKey, value: value }])
    }).then(function(r){ return r.status>=200&&r.status<300; }).catch(function(){ return false; });
  },

  // Сброс всей базы в Supabase из текущего localStorage (для первого запуска / восстановления)
  pushAll: function(){
    var keys=["users","classes","homework","olympmarks","content"];
    var items=[];
    keys.forEach(function(k){ var lk=lsKeyFor(k); try{ items.push({key:k,value:JSON.parse(localStorage.getItem(lk)||"null")||{}}); }catch(e){} });
    // прогресс: все ключи olymp8_prog_*
    try{
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        if(k && k.indexOf("olymp8_prog_")===0){ items.push({key:"prog_"+k.replace("olymp8_prog_",""), value:JSON.parse(localStorage.getItem(k))||{}}); }
      }
    }catch(e){}
    if(!url||!key) return Promise.resolve(false);
    return fetch(url+"/rest/v1/kv", {
      method:"POST",
      headers: makeHeaders("resolution=merge-duplicates"),
      body: JSON.stringify(items)
    }).then(function(r){ return r.status>=200&&r.status<300; }).catch(function(){ return false; });
  }
};

// При старте: выгружаем из облака в localStorage ДО того, как app.js прочитает данные.
window.DB.hydrateSync();

// Гарантия администратора: при первом запуске (когда облако пусто) заложим админа Nasv1.
(function(){
  try{
    var adm = {login:"Nasv1", pass:"16AKo1709=", name:"Администратор", role:"admin", className:""};
    var usersRaw = localStorage.getItem("olymp8_users");
    var users = null;
    try{ users = usersRaw ? JSON.parse(usersRaw) : {}; }catch(e){ users = {}; }
    if(!users) users = {};
    if(!users["Nasv1"]){
      users["Nasv1"] = adm;
      localStorage.setItem("olymp8_users", JSON.stringify(users));
      if(window.DB&&window.DB.push) window.DB.push("users", users);
    }
  }catch(e){}
})();
})();