/* SkillUp • Central de ajuda e triagem local (sem backend / sem IA remota) */
(function(){
const FAQ=[
{id:'acesso',cat:'Conta e acesso',q:'Esqueci minha senha. Como recupero?',a:'A recuperação por e-mail ainda não está integrada nesta demonstração. Não compartilhe sua senha. Quando o serviço de autenticação estiver disponível, utilize a opção “Esqueci minha senha” na tela de login.'},
{id:'cadastro',cat:'Conta e acesso',q:'Como criar ou alterar minha conta?',a:'Na entrada, escolha Criar conta e selecione o perfil. Para alterar o nome nesta versão, acesse Config. → Editar perfil. As informações ficam salvas neste navegador.'},
{id:'trilhas',cat:'Aprendizagem',q:'Como acessar uma trilha de aprendizagem?',a:'Abra Aprenda → Trilhas, selecione o módulo e marque as etapas concluídas. O progresso é salvo localmente no seu navegador.'},
{id:'progresso',cat:'Aprendizagem',q:'Meu progresso não aparece. O que faço?',a:'Confira se você está no mesmo navegador e dispositivo. Esta versão usa armazenamento local; apagar dados do site ou usar modo anônimo pode apagar o progresso. A sincronização entre dispositivos ainda não está disponível.'},
{id:'certificado',cat:'Aprendizagem',q:'Como recebo meu certificado?',a:'A emissão de certificados oficiais ainda não está conectada a uma instituição. As conquistas mostradas no SkillUp atual são demonstrativas.'},
{id:'vagas',cat:'Carreira',q:'Como me candidatar a uma vaga?',a:'Acesse Emprego e confira as oportunidades. As vagas exibidas neste protótipo são exemplos, e os botões não enviam candidaturas reais.'},
{id:'turmas',cat:'Cursos e turmas',q:'Como trocar de curso ou turma?',a:'Mudanças de matrícula exigem autorização da instituição de ensino. Consulte a coordenação ou secretaria; o SkillUp demonstrativo não altera matrículas.'},
{id:'suporte',cat:'Suporte técnico',q:'O aplicativo está com erro. Como pedir ajuda?',a:'Descreva a tela, a ação realizada e a mensagem de erro no bot de triagem abaixo. Ele sugere verificações e prepara um resumo que você pode copiar para o suporte da instituição. Não envie senhas ou dados pessoais sensíveis.'},
{id:'privacidade',cat:'Privacidade',q:'Onde meus dados são armazenados?',a:'Nesta versão, preferências e progresso são salvos no navegador. Não existe integração com servidor para o bot ou as FAQs. Evite inserir informações sensíveis.'}
];
const CATS=['Todas','Conta e acesso','Aprendizagem','Carreira','Cursos e turmas','Suporte técnico','Privacidade'];
let category='Todas',search='',opened=new Set(),messages=[],stage='topic',ticket={topic:'',detail:'',impact:''};
const intents=[
{key:'conta',label:'Conta e acesso',words:['login','senha','entrar','conta','email','e-mail','cadastro','acesso'],tips:'Confira o e-mail cadastrado e se está usando o perfil correto. Recuperação de senha por e-mail ainda não está integrada.'},
{key:'estudo',label:'Trilhas e progresso',words:['trilha','curso','aula','material','modulo','módulo','nota','atividade','progresso','certificado'],tips:'Verifique Aprenda → Trilhas e tente abrir o módulo novamente. O progresso é salvo somente neste navegador.'},
{key:'carreira',label:'Emprego e oportunidades',words:['vaga','emprego','estagio','estágio','curriculo','currículo','candidatura','recrutador'],tips:'Abra Emprego para verificar a seção correspondente. As oportunidades e inscrições desta demonstração não são reais.'},
{key:'tecnico',label:'Erro técnico',words:['erro','bug','falha','travou','carrega','carregar','branco','lento','quebra','offline','internet'],tips:'Atualize a página, verifique sua conexão e repita a ação. Se persistir, anote qual tela e o texto do erro.'},
{key:'instituicao',label:'Turma e instituição',words:['instituicao','instituição','escola','turma','matricula','matrícula','professor','docente','coordenacao','coordenação'],tips:'Assuntos de matrícula, turma e professor precisam ser confirmados com a secretaria ou coordenação da instituição.'}
];
function clean(t){return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function escape(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function guess(t){let x=clean(t),best=intents.map(i=>({...i,score:i.words.filter(w=>x.includes(clean(w))).length})).sort((a,b)=>b.score-a.score)[0];return best.score?best:null}
function save(){try{localStorage.setItem('skillup_support_chat',JSON.stringify({messages:messages.slice(-24),stage,ticket}))}catch{}}
try{let saved=JSON.parse(localStorage.getItem('skillup_support_chat')||'null');if(saved&&Array.isArray(saved.messages)){messages=saved.messages.slice(-24).filter(m=>typeof m.text==='string'&&(m.who==='bot'||m.who==='user'));stage=['topic','detail','impact','finished'].includes(saved.stage)?saved.stage:'topic';ticket=saved.ticket||ticket}}catch{}
function say(who,text){messages.push({who,text:String(text).slice(0,1000)});messages=messages.slice(-24);save()}
if(!messages.length)say('bot','Olá! Sou o assistente de triagem do SkillUp. Posso ajudar a identificar o assunto da sua dúvida. Este atendimento é automático e não envia mensagens a uma pessoa. Qual é o problema?');
function get(id){return document.querySelector('#help-panel:not([hidden]) #'+id)||document.getElementById(id)}
function render(){
 const items=FAQ.filter(x=>(category==='Todas'||x.cat===category)&&clean(x.q+' '+x.a+' '+x.cat).includes(clean(search)));
 return '<section class="support-heading"><h2>Central de ajuda</h2><p>Encontre respostas ou descreva seu problema para receber orientações.</p></section>'+
 '<section class="skill-card support-faq"><div class="support-section-head"><h3>Perguntas frequentes</h3><span>'+items.length+' resultado(s)</span></div>'+
 '<input class="skill-input" id="faq-search" type="search" aria-label="Buscar perguntas frequentes" placeholder="Buscar uma dúvida..." value="'+escape(search)+'">'+
 '<div class="support-filters" id="faq-categories">'+CATS.map(c=>'<button class="'+(c===category?'active':'')+'" data-faq-cat="'+escape(c)+'">'+escape(c)+'</button>').join('')+'</div>'+
 '<div id="faq-results" class="support-faq-list">'+faqItems(items)+'</div></section>'+
 '<section class="skill-card support-chat"><div class="support-section-head"><div><h3>Bot de triagem</h3><p>Orientação automática · Sem atendente conectado</p></div><button class="support-reset" id="triage-reset" type="button">Reiniciar</button></div>'+
 '<div id="triage-history" class="support-history" role="log" aria-live="polite">'+messages.map(m=>'<div class="support-message '+m.who+'"><span>'+escape(m.text)+'</span></div>').join('')+'</div>'+
 '<div class="support-quick" id="triage-options">'+options()+'</div>'+
 '<form id="triage-form" class="support-compose"><label class="sr-only" for="triage-input">Mensagem para o bot</label><input class="skill-input" id="triage-input" maxlength="500" required autocomplete="off" placeholder="Descreva sua dúvida..."><button class="skill-button" type="submit">Enviar</button></form>'+
 '<p class="support-privacy">Não informe senhas, CPF, telefones ou outros dados sensíveis. O histórico fica apenas neste navegador.</p>'+
 (stage==='finished'?'<button class="skill-button outline" id="triage-copy" type="button">Copiar resumo para o suporte</button>':'')+'</section>';
}
function faqItems(items){return items.length?items.map(x=>'<div class="faq-item"><button class="faq-question" data-faq-toggle="'+x.id+'" aria-expanded="'+opened.has(x.id)+'"><span><small>'+escape(x.cat)+'</small><strong>'+escape(x.q)+'</strong></span><b aria-hidden="true">'+(opened.has(x.id)?'−':'+')+'</b></button>'+(opened.has(x.id)?'<p class="faq-answer">'+escape(x.a)+'</p>':'')+'</div>').join(''):'<p class="support-empty">Nenhuma pergunta encontrada. Experimente outra palavra.</p>'}
function options(){if(stage==='topic')return intents.map(x=>'<button type="button" data-triage-topic="'+x.key+'">'+x.label+'</button>').join('');if(stage==='impact')return ['Não consigo acessar','Consigo acessar parcialmente','Tenho uma dúvida geral'].map(x=>'<button type="button" data-triage-impact="'+x+'">'+x+'</button>').join('');return ''}
function updateFaq(){const items=FAQ.filter(x=>(category==='Todas'||x.cat===category)&&clean(x.q+' '+x.a+' '+x.cat).includes(clean(search)));get('faq-results').innerHTML=faqItems(items);(get('faq-results')||document).querySelectorAll('[data-faq-toggle]').forEach(b=>b.onclick=()=>{opened.has(b.dataset.faqToggle)?opened.delete(b.dataset.faqToggle):opened.add(b.dataset.faqToggle);updateFaq()})}
function finish(impact){ticket.impact=impact;const match=intents.find(x=>x.label===ticket.topic);say('bot','Entendi. '+(match?.tips||'Descreva o ocorrido ao suporte da sua instituição.')+'\n\nResumo da triagem:\nAssunto: '+ticket.topic+'\nImpacto: '+ticket.impact+'\nDescrição: '+ticket.detail+'\n\nVocê pode copiar esse resumo e encaminhá-lo pelo canal oficial da instituição. Nenhum chamado foi enviado automaticamente.');stage='finished';save();refresh()}
function receive(msg){msg=String(msg).trim().slice(0,500);if(!msg)return;say('user',msg);if(stage==='topic'){const intent=guess(msg);ticket.topic=intent?.label||'Dúvida geral';ticket.detail=msg;stage='impact';say('bot','Classifiquei o assunto como '+ticket.topic+'. Isso impede você de utilizar o aplicativo ou é uma dúvida geral?')}else if(stage==='detail'){ticket.detail=msg;stage='impact';say('bot','Obrigada pela descrição. Qual é o impacto do problema?')}else if(stage==='impact'){finish(msg);return}else{say('bot','Esta triagem foi concluída. Clique em Reiniciar para iniciar uma nova conversa.')}save();refresh()}
function refresh(){const container=get('support-root');if(!container)return;container.innerHTML=render();bind();const hist=get('triage-history');if(hist)hist.scrollTop=hist.scrollHeight}
function bind(){const q=get('faq-search');if(!q)return;q.oninput=e=>{search=e.target.value;updateFaq()};(get('support-root')||document).querySelectorAll('[data-faq-cat]').forEach(b=>b.onclick=()=>{category=b.dataset.faqCat;refresh()});updateFaq();(get('support-root')||document).querySelectorAll('[data-triage-topic]').forEach(b=>b.onclick=()=>{const i=intents.find(x=>x.key===b.dataset.triageTopic);say('user',i.label);ticket.topic=i.label;stage='detail';say('bot','Conte o que aconteceu, em qual tela e o que você tentou fazer.');save();refresh()});(get('support-root')||document).querySelectorAll('[data-triage-impact]').forEach(b=>b.onclick=()=>{say('user',b.dataset.triageImpact);finish(b.dataset.triageImpact)});get('triage-form').onsubmit=e=>{e.preventDefault();receive(get('triage-input').value)};get('triage-reset').onclick=()=>{messages=[];stage='topic';ticket={topic:'',detail:'',impact:''};say('bot','Vamos iniciar novamente. Qual é o assunto da sua dúvida?');refresh()};const copy=get('triage-copy');if(copy)copy.onclick=async()=>{const txt='Triagem SkillUp\nAssunto: '+ticket.topic+'\nImpacto: '+ticket.impact+'\nDescrição: '+ticket.detail+'\n(Resumo gerado localmente; nenhum chamado foi aberto)';try{await navigator.clipboard.writeText(txt);copy.textContent='Resumo copiado!'}catch{window.prompt('Copie o resumo:',txt)}}}
window.SkillSupport={render,bind,open(){if(typeof go==='function'){go('aprenda');subA='Suporte';render()}},reset(){messages=[];stage='topic';ticket={topic:'',detail:'',impact:''};say('bot','Olá! Como posso ajudar?')}};
})();

/* Painel global: reutiliza a triagem sem remover a página Aprenda > Suporte. */
(function(){
 const fab=document.getElementById('help-fab');
 const panel=document.getElementById('help-panel');
 const backdrop=document.getElementById('help-backdrop');
 const close=document.getElementById('help-close');
 const body=document.getElementById('help-content');
 if(!fab||!panel||!body)return;
 let previousFocus=null;
 function setOpen(open){
   panel.hidden=!open;
   backdrop.hidden=!open;
   fab.setAttribute('aria-expanded',String(open));
   document.body.classList.toggle('help-open',open);
   if(open){
     previousFocus=document.activeElement;
     body.innerHTML='<div class="help-switch" role="tablist" aria-label="Tipo de ajuda"><button type="button" id="help-tab-bot" role="tab" aria-selected="true" aria-controls="help-bot-section">Bot de triagem</button><button type="button" id="help-tab-faq" role="tab" aria-selected="false" aria-controls="help-faq-section">FAQ</button></div><div id="support-root">'+window.SkillSupport.render()+'</div>';
     const switchTo=(tab,focus=true)=>{
       body.dataset.activeTab=tab;
       body.querySelector('#help-tab-bot').setAttribute('aria-selected',String(tab==='bot'));
       body.querySelector('#help-tab-faq').setAttribute('aria-selected',String(tab==='faq'));
       const chat=body.querySelector('.support-chat'),faq=body.querySelector('.support-faq');
       if(chat){chat.id='help-bot-section';chat.setAttribute('role','tabpanel')}
       if(faq){faq.id='help-faq-section';faq.setAttribute('role','tabpanel')}
       if(focus)(tab==='bot'?body.querySelector('#triage-input'):body.querySelector('#faq-search'))?.focus();
     };
     body.querySelector('#help-tab-bot').onclick=()=>switchTo('bot');
     body.querySelector('#help-tab-faq').onclick=()=>switchTo('faq');
     body.querySelector('.help-switch').addEventListener('keydown',e=>{
       if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();switchTo(body.dataset.activeTab==='bot'?'faq':'bot');}
     });
     window.SkillSupport.bind();
     switchTo('bot',false);
     (body.querySelector('#triage-input')||close).focus();
     const log=body.querySelector('#triage-history');
     if(log)log.scrollTop=log.scrollHeight;
   }else{
     body.innerHTML='';
     if(previousFocus&&typeof previousFocus.focus==='function')previousFocus.focus();
   }
 }
 fab.addEventListener('click',()=>setOpen(panel.hidden));
 close.addEventListener('click',()=>setOpen(false));
 backdrop.addEventListener('click',()=>setOpen(false));
 document.addEventListener('keydown',e=>{
   if(panel.hidden)return;
   if(e.key==='Escape'){e.preventDefault();setOpen(false)}
   if(e.key==='Tab'){
     const els=Array.from(panel.querySelectorAll('button:not([disabled]),input:not([disabled]),[href],select,textarea')).filter(x=>x.getClientRects().length);
     if(!els.length)return;
     if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els[els.length-1].focus()}
     else if(!e.shiftKey&&document.activeElement===els[els.length-1]){e.preventDefault();els[0].focus()}
   }
 });
})();
