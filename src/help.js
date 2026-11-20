import { escape } from './ui.js';

export const reviewedAt = '21/09/2026';
export const helpTopics = [
  {
    id: 'dinheiro', title: 'Enviei dinheiro', summary: 'Pix, boleto ou compra no cartão.',
    steps: [
      'Procure seu banco imediatamente pelo aplicativo ou canal oficial. Explique o ocorrido e peça orientação sobre a contestação do pagamento.',
      'Se foi Pix, conteste a transação para solicitar o Mecanismo Especial de Devolução (MED). A devolução depende da análise e dos recursos disponíveis; não é garantida.',
      'Se passou os dados do cartão, peça o bloqueio e confira compras que não reconhece. Para boleto, informe ao banco os dados do pagamento.',
    ],
    source: 'Banco Central — Segurança no Pix', url: 'https://www.bcb.gov.br/estabilidadefinanceira/pix-seguranca',
  },
  {
    id: 'conta', title: 'Compartilhei senha ou código', summary: 'Acesso a contas e mensagens.',
    steps: [
      'Abra o aplicativo ou site oficial do serviço e altere a senha exposta, inclusive nas contas onde ela foi repetida.',
      'Revise os aparelhos conectados, encerre sessões desconhecidas e ative a verificação em duas etapas.',
      'Perdeu o acesso? Use a recuperação de conta no serviço oficial. Se alguém estiver se passando por você, avise seus contatos por outro canal conhecido.',
    ],
    source: 'CERT.br — Golpes: Caiu? Veja o que Fazer (PDF)', url: 'https://cartilha.cert.br/fasciculos/golpes-o-que-fazer/fasciculo-golpes-o-que-fazer.pdf',
  },
  {
    id: 'link', title: 'Cliquei em um link', summary: 'Página, arquivo ou aplicativo suspeito.',
    steps: [
      'Feche a página suspeita e não forneça mais informações. Se digitou uma senha ou pagou, consulte também os caminhos de conta e dinheiro.',
      'Se abriu um arquivo ou instalou um programa suspeito, faça uma verificação de segurança e procure ajuda técnica de confiança.',
      'Use outro aparelho confiável para proteger suas contas se suspeitar de invasão. A recuperação do aparelho pode exigir reinstalação; peça orientação antes de apagar seus arquivos.',
    ],
    source: 'CERT.br — Golpes: Caiu? Veja o que Fazer (PDF)', url: 'https://cartilha.cert.br/fasciculos/golpes-o-que-fazer/fasciculo-golpes-o-que-fazer.pdf',
  },
];

export function renderHelp(id) {
  const topic = helpTopics.find(item => item.id === id);
  return `<div class="notice"><p class="label">Você não precisa resolver tudo de uma vez.</p><p>Escolha o que aconteceu. Se mais de uma situação se aplica, consulte os outros caminhos também. Não informe senhas, códigos ou dados bancários neste site.</p></div>
    <nav class="choice-grid" aria-label="O que aconteceu?">${helpTopics.map(item => `<a class="panel choice-card ${topic?.id === item.id ? 'selected' : ''}" href="#ajuda/${item.id}" ${topic?.id === item.id ? 'aria-current="page"' : ''}><span class="section-title">${item.title}</span><span class="small">${item.summary}</span></a>`).join('')}</nav>
    ${topic ? `<article class="panel"><p class="kicker">PRIMEIROS PASSOS</p><h2 class="card-title">${topic.title}</h2><ol class="tips">${topic.steps.map(step => `<li class="body">${escape(step)}</li>`).join('')}</ol><p class="source-note">Fonte: <a href="${topic.url}">${topic.source}</a> · Revisado em ${reviewedAt}.</p></article>` : '<p class="body">Toque em uma das opções acima para ver os primeiros passos.</p>'}
    <section class="panel"><h2 class="section-title">Cuidados em qualquer situação</h2><ol class="tips"><li class="body">Interrompa o contato suspeito. Não envie novos valores para uma promessa de recuperar o dinheiro.</li><li class="body">Guarde mensagens, capturas de tela, comprovantes e protocolos de atendimento.</li><li class="body">Registre o ocorrido na Polícia Civil do seu estado, por uma delegacia ou pelo portal oficial. Leve as evidências que reuniu.</li></ol><p class="source-note">Fonte: <a href="https://www.nic.br/noticia/releases/caiu-em-um-golpe-novo-fasciculo-do-cert-br-da-orientacoes-sobre-como-agir/">NIC.br — Orientações após um golpe</a> · Revisado em ${reviewedAt}.</p><p class="small">O CuidadOnline oferece orientação educativa. A contestação e o atendimento são feitos pelos canais oficiais das instituições.</p></section>`;
}
