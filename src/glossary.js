import { escape } from './ui.js';
import { matchesSearch } from './learning.js';

export const terms = [
  { title: 'Código de verificação', text: 'Código usado para confirmar uma ação ou acesso. Se alguém pedir o código que chegou ao seu celular, não compartilhe.', lesson: 'whatsapp' },
  { title: 'Link', text: 'Um atalho que abre outra página ou recurso. Em mensagens inesperadas, confira a origem antes de abrir.', lesson: 'lojas' },
  { title: 'Phishing', text: 'Tentativa de enganar usando mensagens ou páginas falsas para conseguir dados ou induzir ações. Pode imitar uma empresa conhecida.', lesson: 'whatsapp' },
  { title: 'QR Code', text: 'Imagem com quadradinhos que pode abrir um endereço ou iniciar um pagamento ao ser lida pela câmera. Confira o destino e os dados antes de continuar.', lesson: 'pix' },
  { title: 'Verificação em duas etapas', text: 'Uma proteção extra para entrar na conta, além da senha. Ative nas configurações oficiais do serviço.', lesson: 'whatsapp' },
  { title: 'Engenharia social', text: 'Uso de histórias, pressão ou confiança para convencer alguém a entregar dados, dinheiro ou acesso. Pare e confirme por outro canal.', lesson: 'suporte' },
  { title: 'Acesso remoto', text: 'Recurso que permite controlar um aparelho à distância. Não instale nem autorize por pedido de uma ligação inesperada.', lesson: 'suporte' },
  { title: 'Malware', text: 'Programa criado para prejudicar, espionar ou tomar controle do aparelho. Instale aplicativos somente por lojas e fontes oficiais.', lesson: 'suporte' },
  { title: 'Sessão conectada', text: 'Acesso que permanece aberto em um aparelho ou navegador. Encerre sessões que você não reconhece nas configurações da conta.', lesson: 'conta' },
  { title: 'Conta laranja', text: 'Conta usada para receber ou movimentar dinheiro de golpes. Confira sempre o nome do recebedor e não empreste sua conta.', lesson: 'pix' },
];
export function renderTerms(query) {
  const found = terms.filter(term => matchesSearch(`${term.title} ${term.text}`, query));
  return `<p class="small" role="status">${found.length} termo(s) encontrado(s).</p>${found.map(term => `<article class="panel"><h2 class="section-title">${escape(term.title)}</h2><p class="description">${escape(term.text)}</p><a class="link" href="#aprender/${term.lesson}">Ver uma leitura relacionada →</a></article>`).join('')}${found.length ? '' : '<p class="description">Não encontramos esse termo. Tente outra palavra.</p>'}`;
}
export function renderGlossary(query) {
  return `<div class="panel"><label class="label" for="glossary-search">Buscar uma palavra</label><input class="search-input" id="glossary-search" type="search" maxlength="120" placeholder="Ex.: código, link, phishing" value="${escape(query)}"></div><div id="glossary-results" class="option-list">${renderTerms(query)}</div><p class="source-note">Explicações educativas baseadas nos <a href="https://cartilha.cert.br/fasciculos/">fascículos do CERT.br</a>, incluindo Phishing e Outros Golpes e Verificação em Duas Etapas. Revisado em 19/10/2026.</p>`;
}
