async function loadArticles(){
  const res=await fetch('articles/');
  const html=await res.text();
  const parser=new DOMParser();
  const doc=parser.parseFromString(html,'text/html');
  const links=[...doc.querySelectorAll('a')].map(a=>a.getAttribute('href')).filter(h=>/(md|html)$/.test(h));
  const logRes=await fetch('logs/neomonday_creative_chat.md');
  const logText=await logRes.text();
  const chatMap={};
  logText.split(/\n###\s*/).forEach(block=>{
    const [title,...rest]=block.split('\n');
    if(title)chatMap[title.trim()]=rest.join('\n').trim();
  });
  const container=document.getElementById('articles');
  for(const file of links){
    const text=await fetch('articles/'+file).then(r=>r.text());
    let titleMatch=text.match(/^#\s*(.+)/m);
    if(!titleMatch){const d=parser.parseFromString(text,'text/html');const h1=d.querySelector('h1');if(h1)titleMatch=[0,h1.textContent];}
    const title=(titleMatch?titleMatch[1]:file).trim();
    const plain=text.replace(/<[^>]+>/g,'');
    const firstSentence=plain.match(/[^.!?]+[.!?]/);
    const excerpt=firstSentence?firstSentence[0].trim():plain.slice(0,80);
    const urlMatch=text.match(/https?:\/\/[^\s)]+/);
    const url=urlMatch?urlMatch[0]:'#';
    createCard({file,title,excerpt,url,article:text,chat:chatMap[title]||''});
  }
  initLazy();
}
function createCard({file,title,excerpt,url,article,chat}){
  const card=document.createElement('div');
  card.className='card';
  const img=document.createElement('img');
  img.dataset.src='assets/'+file.replace(/\.(md|html)$/,'')+'.jpg';
  img.alt='';
  const h3=document.createElement('h3');
  h3.textContent=title;
  const p=document.createElement('p');
  p.textContent=excerpt.split(' ').slice(0,15).join(' ')+'…';
  const btn=document.createElement('button');
  btn.textContent='Open';
  btn.addEventListener('click',()=>openModal(title,article,url,chat));
  card.append(img,h3,p,btn);
  document.getElementById('articles').appendChild(card);
}
function initLazy(){
  const imgs=document.querySelectorAll('img[data-src]');
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const img=e.target;
        img.src=img.dataset.src;
        io.unobserve(img);
      }
    });
  });
  imgs.forEach(img=>io.observe(img));
}
function openModal(title,article,url,chat){
  const modal=document.getElementById('modal');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  document.getElementById('modal-title').textContent=title;
  const words=article.replace(/<[^>]+>/g,'').split(/\s+/).slice(0,120).join(' ');
  document.getElementById('modal-text').textContent=words+'…';
  document.getElementById('modal-link').href=url;
  document.getElementById('modal-chat').textContent=chat.split(/\s+/).slice(0,320).join(' ');
  const focusables=modal.querySelectorAll('button,a');
  let idx=0;focusables[idx].focus();
  function trap(e){
    if(e.key==='Escape'){closeModal();}
    if(e.key==='Tab'){
      e.preventDefault();
      idx=(idx+(e.shiftKey?-1:1)+focusables.length)%focusables.length;
      focusables[idx].focus();
    }
  }
  modal.dataset.trapListener='true';
  modal.addEventListener('keydown',trap);
  modal.addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal();});
  modal.querySelector('.modal-close').onclick=closeModal;
  function closeModal(){
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    modal.removeEventListener('keydown',trap);
  }
}
window.addEventListener('DOMContentLoaded',loadArticles);

