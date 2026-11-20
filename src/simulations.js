import { escape } from './ui.js';

export const simulations = [
  { id: 'conversa', title: 'Conversa suspeita', description: 'Escolha como responder a um pedido de dinheiro.' },
  { id: 'loja', title: 'Loja fictícia', description: 'Explore uma oferta e confira os sinais antes de comprar.' },
  { id: 'boleto', title: 'Boleto de exemplo', description: 'Compare a cobrança com os dados do pagamento.' },
];

const conversation = {
  start: { message: 'Oi! Sou eu, seu filho. Troquei de número. Preciso de um Pix agora. Você pode me ajudar?', options: [
    { label: 'Ligar para o número que já conheço', next: 'safe', reply: 'Na ligação para o número antigo, seu familiar diz que não fez esse pedido.', explanation: 'Confirmar por um contato conhecido ajuda a verificar a identidade. A foto e o nome de um perfil podem ser copiados.' },
    { label: 'Perguntar por que mudou de número', next: 'pressure', reply: 'Meu celular quebrou. Não posso falar agora. É urgente, preciso pagar em cinco minutos!', explanation: 'Uma explicação convincente ainda não confirma a identidade. A urgência tenta diminuir o tempo que você tem para conferir.' },
  ] },
  pressure: { message: 'Usa a minha foto como confirmação! Envie R$ 850 para uma conta de outra pessoa. Depois te explico.', options: [
    { label: 'Parar e confirmar por outro contato conhecido', next: 'safe', reply: 'Você interrompe a conversa e descobre que o pedido não era do seu familiar.', explanation: 'Você pode parar a qualquer momento. A pressão e a conta de outra pessoa são motivos para conferir antes de agir.' },
    { label: 'Confiar na foto e continuar', next: 'payment', reply: 'Ótimo! Vou mandar os dados. Nem precisa conferir o nome, é de um amigo.', explanation: 'A foto não comprova quem está falando. Pedir para ignorar o recebedor é mais um sinal de alerta.' },
  ] },
  payment: { message: 'O recebedor mostrado é desconhecido. O que você faria antes de confirmar?', options: [
    { label: 'Cancelar e falar com meu familiar', next: 'safe', reply: 'Você cancela antes da confirmação. Nenhuma transferência é feita.', explanation: 'Confira o destinatário e confirme o pedido por um canal conhecido. Mesmo depois de começar, você pode interromper.' },
    { label: 'Confirmar o envio na situação fictícia', next: 'risk', reply: 'Na história, o dinheiro iria para uma pessoa desconhecida. Aqui, nenhum pagamento foi feito.', explanation: 'Se isso acontecer fora do exercício, procure seu banco pelos canais oficiais. Na seção Ajuda há orientações para começar.' },
  ] },
};

const hotspots = {
  loja: [
    { id: 'address', label: 'Endereço: ofertas-exemplo.invalid', explanation: 'Em uma compra real, confira o endereço com o site oficial da empresa. Este endereço é fictício e não deve ser acessado.' },
    { id: 'price', label: 'Celular por R$ 99 · Oferta termina AGORA!', explanation: 'Preço muito abaixo do esperado e pressão para decidir rápido são sinais para parar e pesquisar fora da loja.' },
    { id: 'payment', label: 'Pagamento: somente Pix para uma pessoa desconhecida', explanation: 'Confira quem vai receber e se corresponde à empresa. Neste exemplo, o recebedor não corresponde à loja anunciada.' },
    { id: 'lock', label: 'Desenho de cadeado e avaliações com cinco estrelas', explanation: 'Cadeado e avaliações na própria página não comprovam a reputação da loja. Procure referências independentes.' },
  ],
  boleto: [
    { id: 'recipient', label: 'Recebedor no pagamento: Outra Empresa Exemplo', explanation: 'A cobrança diz Escola Exemplo, mas o pagamento mostra outra empresa. Pare e confirme com a escola por um contato oficial.' },
    { id: 'value', label: 'Valor no pagamento: R$ 480,00', explanation: 'O documento diz R$ 180,00. A diferença exige conferência antes de pagar. Não confirme um valor inesperado.' },
    { id: 'origin', label: 'Mensagem: pague este novo boleto em 10 minutos', explanation: 'Pressa e troca inesperada da cobrança são sinais de alerta. Busque a segunda via diretamente no canal oficial.' },
    { id: 'logo', label: 'Logotipo: Escola Exemplo', explanation: 'O logotipo pode ser copiado. Confira os dados na tela de pagamento e a origem da cobrança; a aparência sozinha não comprova autenticidade.' },
  ],
};

export function createSimulation(id) {
  return { id, node: 'start', feedback: null, examined: [], finished: false, recorded: false };
}
export function chooseConversation(state, index) {
  if (state.id !== 'conversa' || state.finished || state.feedback) return false;
  const option = conversation[state.node]?.options[index];
  if (!option) return false;
  state.feedback = { ...option };
  return true;
}
export function advanceConversation(state) {
  if (!state.feedback || state.finished) return false;
  state.node = state.feedback.next;
  state.feedback = null;
  state.finished = ['safe', 'risk'].includes(state.node);
  return true;
}
export function examineHotspot(state, id) {
  const spot = hotspots[state.id]?.find(item => item.id === id);
  if (!spot || state.finished) return false;
  if (!state.examined.includes(id)) state.examined.push(id);
  state.feedback = spot;
  return true;
}
export function completeInspection(state) {
  if (state.finished || !hotspots[state.id] || state.examined.length !== hotspots[state.id].length) return false;
  state.finished = true;
  return true;
}

export function renderSimulations(id, state) {
  const selected = simulations.find(item => item.id === id);
  const catalog = `<nav class="choice-grid" aria-label="Escolha uma simulação">${simulations.map(item => `<a class="panel choice-card ${id === item.id ? 'selected' : ''}" href="#simulacoes/${item.id}" ${id === item.id ? 'aria-current="page"' : ''}><span class="section-title">${item.title}</span><span class="small">${item.description}</span></a>`).join('')}</nav>`;
  if (!selected || !state) return catalog + '<p class="body">Escolha uma situação para praticar. Você pode tentar quantas vezes quiser.</p>';
  let content;
  if (state.finished) {
    content = `<div class="feedback ${state.node === 'risk' ? 'warning' : 'success'}"><h3 class="section-title" id="simulation-feedback" tabindex="-1">${state.node === 'risk' ? 'Essa escolha teria um risco.' : 'Prática concluída!'}</h3><p class="body">${state.id === 'conversa' ? 'Na dúvida, interrompa a conversa e confirme o pedido por um canal que você já conhece.' : 'Você explorou os pontos do exemplo. Antes de pagar, confirme a origem, o recebedor e o valor.'}</p></div><div class="action-row"><button class="button" data-action="restart-simulation">Tentar novamente</button><a class="button secondary" href="#progresso">Ver meu progresso</a><a class="link" href="#ajuda">Preciso de ajuda com uma situação real</a></div>`;
  } else if (state.id === 'conversa') {
    const node = conversation[state.node];
    content = `<div class="chat-example"><p class="label">Número desconhecido · conversa fictícia</p><p class="chat-bubble body">${node.message}</p>${state.feedback ? `<p class="chat-bubble outgoing body">Sua escolha: ${escape(state.feedback.label)}</p><p class="chat-bubble body">${escape(state.feedback.reply)}</p>` : ''}</div>`
      + (state.feedback ? `<div class="feedback success" id="simulation-feedback" tabindex="-1" role="status"><p class="label">Vamos observar</p><p class="body">${escape(state.feedback.explanation)}</p></div><button class="button" data-action="advance-conversation">${['safe', 'risk'].includes(state.feedback.next) ? 'Concluir simulação' : 'Continuar conversa'}</button>` : `<p class="description">Como você responderia?</p><div class="option-list">${node.options.map((option, index) => `<button class="button secondary" data-action="conversation-choice" data-index="${index}">${option.label}</button>`).join('')}</div>`);
  } else {
    content = `<div class="inspection ${state.id}">${state.id === 'loja' ? '<div class="mock-store"><p class="kicker">LOJA EXEMPLO · EXERCÍCIO</p><div class="product-placeholder" aria-hidden="true">▯</div><h3 class="card-title">Uma oferta que parece imperdível</h3></div>' : '<div class="mock-bill"><p class="kicker">SEM VALOR PARA PAGAMENTO</p><h3 class="card-title">Escola Exemplo</h3><p class="body">Cobrança esperada: R$ 180,00</p><p class="small">Documento fictício, sem código de barras ou dados bancários.</p></div>'}<p class="description">Toque em cada ponto para entender o que conferir.</p><div class="option-list">${hotspots[state.id].map(spot => `<button class="hotspot" data-action="inspect" data-id="${spot.id}" aria-pressed="${state.examined.includes(spot.id)}">${state.examined.includes(spot.id) ? '✓ ' : ''}${spot.label}</button>`).join('')}</div></div>${state.feedback ? `<div class="feedback success" id="simulation-feedback" tabindex="-1" role="status"><p class="body">${escape(state.feedback.explanation)}</p></div>` : ''}<p class="small inspection-count">${state.examined.length} de ${hotspots[state.id].length} pontos explorados</p><button class="button" data-action="complete-inspection" ${state.examined.length < hotspots[state.id].length ? 'disabled' : ''}>Concluir simulação</button>`;
  }
  return catalog + `<article class="panel"><p class="kicker">SIMULAÇÃO EDUCATIVA · DADOS FICTÍCIOS</p><h2 class="card-title" id="simulation-title" tabindex="-1">${selected.title}</h2><p class="description">Nenhuma mensagem ou pagamento será enviado. As escolhas servem apenas para aprender.</p>${content}</article>`;
}
