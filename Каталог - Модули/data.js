// Физика.Олимп 8 класс — метаданные олимпиадного трека
// Модули (12), уровень трека, навыки, достижения

// Модуль: { id, no, name, short, color, icon, desc, req (id предыдущего модуля или null),
//           unlocks: массив уровней, доступных в модуле }
var OLYMP_MODULES = [
  { id:"session", no:"С", name:"Зимняя сессия", short:"Сессия", color:"#0e7ab8", icon:"❄️",
    req:null, pinned:true,
    desc:"Подготовка к зимней сессии: теория по билетам и задачи ОГЭ. Блок открыт всем, закреплён." },
  { id:"meta", no:"0", name:"Олимпиадная техника", short:"Техника", color:"#7d5ba6", icon:"🎯",
    req:null,
    desc:"Эксперимент, измерения и погрешности, оформление письменных решений. Сквозной мета-блок, который возвращается в каждом туре." },
  { id:"hydro", no:"1", name:"Гидростатика", short:"Гидростатика", color:"#1aa2b8", icon:"🌊",
    req:"meta",
    desc:"Давление жидкости, закон Паскаля, сила Архимеда, плавание тел." },
  { id:"stat", no:"2", name:"Статика", short:"Статика", color:"#2f9e63", icon:"⚖️",
    req:"hydro",
    desc:"Равновесие тел, рычаги, правило моментов, центр масс." },
  { id:"energy", no:"3", name:"Работа и энергия", short:"Энергия", color:"#f4a825", icon:"⚡",
    req:"stat",
    desc:"Механическая работа, мощность, кинетическая и потенциальная энергия, закон сохранения." },
  { id:"thermal", no:"4", name:"Тепловые явления", short:"Теплота", color:"#e8703a", icon:"🔥",
    req:"energy",
    desc:"Количество теплоты, теплоёмкость, уравнение теплового баланса." },
  { id:"heatmach", no:"5", name:"Тепловые машины", short:"Машины", color:"#c23b6b", icon:"🛠️",
    req:"thermal",
    desc:"КПД тепловых двигателей, циклы, фазовые переходы и теплота." },
  { id:"current", no:"6", name:"Постоянный ток", short:"Пост. ток", color:"#4a4de0", icon:"🔌",
    req:"heatmach",
    desc:"Закон Ома, сопротивление, последовательное и параллельное соединение, работа и мощность тока." },
  { id:"circuits", no:"7", name:"Электрические цепи", short:"Цепи", color:"#5a2fd0", icon:"🕸️",
    req:"current",
    desc:"Эквивалентные схемы, правила Кирхгофа, расчёт сложных цепей." },
  { id:"optics", no:"8", name:"Геометрическая оптика", short:"Оптика", color:"#1f9d8a", icon:"🔭",
    req:"circuits",
    desc:"Отражение и преломление света, зеркала, линзы, ход лучей." },
  { id:"dyn",  no:"9", name:"Динамика и силы", short:"Динамика", color:"#e8503a", icon:"💪",
    req:"optics",
    desc:"Законы Ньютона, сила тяжести, упругости, трения, вес." },
  { id:"final", no:"10", name:"Пробная олимпиада", short:"Финал", color:"#333a66", icon:"🏆",
    req:"dyn",
    desc:"Заключительный полноформатный письменный тур и работа над ошибками." }
];

// Уровни внутри модуля
var OLYMP_LEVELS = [
  { id:"base",   name:"База",   color:"#2f9e63", icon:"🌱", desc:"школьный уровень + минимум приёмов" },
  { id:"active", name:"Актив",  color:"#2f6fed", icon:"⚡", desc:"типовые олимпиадные задачи (школьный/муниципальный этап)" },
  { id:"olimp",  name:"Олимп",  color:"#e8503a", icon:"🔥", desc:"региональный уровень, эксперимент и нестандартные методы" },
  { id:"session",name:"СЕССИЯ", color:"#0e7ab8", icon:"❄️", desc:"задачи зимней сессии (повторение и закрепление)" }
];

// Типы задач
var OLYMP_TYPES = [
  { id:"calc",      name:"Расчётная задача",  icon:"🧮" },
  { id:"test",      name:"Тест",              icon:"✅" },
  { id:"expert",    name:"Экспертная",        icon:"💬" },
  { id:"experiment",name:"Эксперимент",       icon:"🔬" }
];

// Пять колец навыков
var OLYMP_SKILLS = [
  { id:"calc",   name:"Расчёт",          color:"#4a4de0", max:100, icon:"🧮" },
  { id:"solve",  name:"Скорость решения", color:"#2f9e63", max:100, icon:"⏱️" },
  { id:"exp",    name:"Оформление",      color:"#2f6fed", max:100, icon:"✍️" },
  { id:"experiment", name:"Эксперимент",  color:"#e8503a", max:100, icon:"🔬" },
  { id:"analysis", name:"Анализ ошибок",  color:"#f4a825", max:100, icon:"🎯" }
];

// Уровни трека (по накопленному XP)
var OLYMP_TRACK_LEVELS = [
  { level:1, xp:0,    name:"Новичок" },
  { level:2, xp:120,  name:"Подмастерье" },
  { level:3, xp:280,  name:"Исследователь" },
  { level:4, xp:520,  name:"Экспериментатор" },
  { level:5, xp:850,  name:"Мастер задач" },
  { level:6, xp:1250, name:"Физик" },
  { level:7, xp:1750, name:"Знаток" },
  { level:8, xp:2400, name:"Эксперт" },
  { level:9, xp:3200, name:"Олимпиец" },
  { level:10,xp:4200, name:"Максвелл" }
];

// Очки опыта за действия
var OLYMP_XP = {
  base:  10,     // решена задача уровня База
  active:20,     // решена задача уровня Актив
  olimp: 35,     // решена задача уровня Олимп
  session:30,    // решена задача уровня Сессия
  fixError:15,   // закрыта работа над ошибками
  module:60,     // зачтён модуль (мастерство 100%)
  olympTest:40   // решена пробная олимпиада
};

// Достижения: { id, name, icon, desc, check(state, stats) }
// check должен вернуть true, когда достижение открыто
var OLYMP_ACHIEVEMENTS = [
  { id:"first",  name:"Первый шаг",  icon:"🌱", xp:20,  desc:"Реши первую задачу.", check:function(s){ return s.solvedTotal>=1; } },
  { id:"ten",    name:"Десяточка",   icon:"🔟", xp:50,  desc:"Реши 10 задач.", check:function(s){ return s.solvedTotal>=10; } },
  { id:"fifty",  name:"Сотка задач", icon:"📚", xp:150, desc:"Реши 50 задач.", check:function(s){ return s.solvedTotal>=50; } },
  { id:"streak3",name:"Серия: 3",    icon:"🔥", xp:40,  desc:"Реши 3 задачи подряд верно.", check:function(s){ return s.bestStreak>=3; } },
  { id:"streak5",name:"Серия: 5",    icon:"⚡", xp:70,  desc:"Реши 5 задач подряд верно.", check:function(s){ return s.bestStreak>=5; } },
  { id:"fixer",  name:"Мастер ошибок",icon:"🛠️", xp:60, desc:"Закрой 5 работ над ошибками.", check:function(s){ return s.errorsClosed>=5; } },
  { id:"clean",  name:"Чистый блок",icon:"🧹", xp:80, desc:"Закрой первый блок на 100%.", check:function(s){ return s.modulesCompleted>=1; } },
  { id:"half",   name:"Половина пути",icon:"🌗", xp:160, desc:"Закрой 5 блоков.", check:function(s){ return s.modulesCompleted>=5; } },
  { id:"allexp", name:"Физик",       icon:"🧠", xp:250, desc:"Дочитай кольцо «Расчёт» до конца.", check:function(s){ return s.skillCalc>=100; } },
  { id:"olymp",  name:"Олимпиец",    icon:"🏆", xp:300, desc:"Прогони первую пробную олимпиаду.", check:function(s){ return s.olympiads>=1; } },
  { id:"boost",  name:"Быстрый старт",icon:"🚀", xp:90, desc:"Прыгни через уровень и открой блок раньше.", check:function(s){ return s.didBoost; } },
  { id:"perfect",name:"Идеальный тур",icon:"💯", xp:200, desc:"Собери максимум баллов в пробном туре.", check:function(s){ return s.perfectOlymp>=1; } }
];

// Цвета уровней для бейджей
function olympLvlColor(id){
  var l=OLYMP_LEVELS.filter(function(x){return x.id===id;})[0];
  return l?l.color:"#6b7394";
}
function olympLvlName(id){
  var l=OLYMP_LEVELS.filter(function(x){return x.id===id;})[0];
  return l?l.name:id;
}
function olympModuleMeta(id){
  var m=OLYMP_MODULES.filter(function(x){return x.id===id;})[0];
  return m||{id:id,name:id,short:id,color:"#6b7394",icon:"📘"};
}