import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db";
import { UserModel } from "../src/models/User";
import { LessonModel } from "../src/models/Lesson";
import { QuestionModel, SimulationModel, GlossaryModel, HelpModel } from "../src/models/Content";

const lessons = [
  ["pix","Golpes com Pix","Confira antes de transferir.","Alguém pode se passar por um familiar ou funcionário do banco para pedir dinheiro. A pressa é um sinal de alerta.",["Confirme pedidos de dinheiro por uma ligação para um número que você já conhece.","Confira o nome do recebedor e o valor na tela do banco antes de confirmar.","Não transfira para uma suposta conta segura por orientação de uma ligação."],"#16836F","#E7F7F1"],
  ["boleto","Boletos falsos","Nem toda cobrança é verdadeira.","Um boleto falso pode parecer igual ao original. Confira os dados no aplicativo do banco antes de pagar.",["Busque a cobrança no aplicativo ou site oficial da empresa.","Confira beneficiário, documento e valor na tela de pagamento.","Se houver diferença, fale com a empresa por um contato oficial."],"#AD7423","#FFF4E3"],
  ["whatsapp","Golpes no WhatsApp","Proteja sua conta e suas conversas.","Criminosos podem usar a foto de alguém conhecido em outro número ou tentar tomar sua conta pedindo um código.",["Nunca compartilhe códigos recebidos por SMS.","Ative a confirmação em duas etapas.","Confirme pedidos de dinheiro por outro canal conhecido."],"#269268","#E9F7EF"],
  ["lojas","Lojas falsas","Compre com mais tranquilidade.","Uma oferta muito barata pode levar a uma loja falsa. Aparência bonita e cadeado no navegador não bastam.",["Desconfie de preços muito abaixo do mercado.","Confira o endereço do site e pesquise a empresa.","Confira os dados do recebedor e as condições de entrega."],"#7860BA","#F1EDFB"],
  ["suporte","Falso suporte técnico","Não entregue o controle do aparelho.","Golpistas podem fingir que trabalham para um banco e pedir instalação de aplicativo ou acesso remoto.",["Encerre o contato e procure a empresa pelo canal oficial.","Não instale aplicativos por orientação de ligação inesperada.","Funcionários não precisam da sua senha ou código."],"#B45309","#FFF7E6"],
  ["conta","Conta invadida ou roubada","Recupere o acesso com segurança.","Uma senha descoberta ou um código compartilhado pode permitir que outra pessoa entre na sua conta.",["Use a recuperação apenas pelo aplicativo ou site oficial.","Troque a senha por uma nova e diferente.","Encerre sessões desconhecidas e ative a verificação em duas etapas."],"#B23A57","#FDECF1"],
].map(([slug,title,summary,intro,tips,color,background],order)=>({slug,title,summary,intro,tips,color,background,order}));

const questions = [
 ["whatsapp","Número desconhecido","Oi, mãe! Troquei de número. Faz um Pix de R$ 850 para mim?",true,"Número novo, urgência e pedido de dinheiro são sinais de golpe. Ligue para o número antigo."],
 ["pix","Aplicativo oficial do banco","A tela oficial mostra o nome do recebedor e pede que você confira os dados.",false,"Conferir dados dentro do aplicativo oficial faz parte de um pagamento seguro."],
 ["whatsapp","Suposto suporte","Envie o código de 6 dígitos que chegou por SMS para manter sua conta ativa.",true,"Nunca envie códigos de confirmação a outras pessoas."],
 ["boleto","Cobrança inesperada","O boleto tem logotipo conhecido, mas o pagamento mostra uma empresa desconhecida.",true,"Dados diferentes exigem que você interrompa e confirme pelo canal oficial."],
 ["lojas","Loja desconhecida","Celular novo por R$ 99! Só por cinco minutos e pagamento por Pix.",true,"Preço muito baixo e urgência são sinais para parar e pesquisar."],
 ["boleto","Portal oficial","Você acessou diretamente o portal oficial e conferiu beneficiário e valor.",false,"O exemplo descreve verificações adequadas em canais oficiais."],
 ["lojas","Mensagem de prêmio","Você ganhou um produto, mas precisa fazer um Pix agora para liberar o prêmio.",true,"Cobrança antecipada para prêmio inesperado é sinal de alerta."],
 ["pix","Pedido de familiar","Você ligou para o número conhecido, confirmou o pedido e conferiu os dados.",false,"Confirmar por um contato conhecido e conferir os dados são cuidados adequados."],
 ["suporte","Central de segurança","Instale este aplicativo de acesso remoto para o atendente proteger sua conta.",true,"Uma central verdadeira não precisa controlar seu aparelho."],
 ["suporte","Atendimento oficial","O atendimento no aplicativo orientou o bloqueio do cartão sem pedir senha.",false,"Ação iniciada em canal oficial e realizada no próprio aplicativo reduz o risco."],
 ["conta","Alerta de acesso","Um link encurtado pede sua senha para cancelar um acesso desconhecido.",true,"Abra diretamente o aplicativo oficial; não use o link recebido."],
 ["conta","Configurações oficiais","Você encerrou uma sessão desconhecida e ativou a verificação em duas etapas.",false,"Essas são medidas adequadas quando feitas nas configurações oficiais."],
].map(([lessonSlug,sender,message,scam,explanation],order)=>({lessonSlug,sender,message,scam,explanation,order}));

const simulations = [
 {slug:"conversa",title:"Conversa suspeita",description:"Observe sinais em um pedido urgente de dinheiro.",kind:"conversation",items:[
  {label:"Número novo pedindo dinheiro",explanation:"A foto e o nome podem ser copiados. Confirme pelo contato antigo."},{label:"Pressa para pagar em cinco minutos",explanation:"A urgência tenta impedir que você verifique a história."},{label:"Conta de uma pessoa desconhecida",explanation:"Pare antes de confirmar e confira o recebedor."}]},
 {slug:"loja",title:"Loja fictícia",description:"Explore uma oferta e confira os sinais antes de comprar.",kind:"inspection",items:[
  {label:"Celular por R$ 99",explanation:"Preço muito abaixo do esperado pede pesquisa fora da loja."},{label:"Pagamento somente por Pix",explanation:"Confira se o recebedor corresponde à empresa."},{label:"Oferta termina agora",explanation:"Pressão para decidir rápido é um sinal de alerta."}]},
 {slug:"boleto",title:"Boleto de exemplo",description:"Compare a cobrança com os dados do pagamento.",kind:"inspection",items:[
  {label:"Beneficiário diferente",explanation:"O nome precisa corresponder à empresa esperada."},{label:"Valor maior que a cobrança",explanation:"Uma diferença exige conferência antes do pagamento."},{label:"Mensagem com urgência",explanation:"Busque a segunda via no canal oficial."}]},
].map((x,order)=>({...x,data:{items:x.items},order}));

const glossary=[
 {term:"Autenticação em duas etapas",definition:"Uma segunda confirmação além da senha para proteger a conta.",lessonSlug:"conta"},
 {term:"Beneficiário",definition:"Pessoa ou empresa que receberá o pagamento.",lessonSlug:"boleto"},
 {term:"Código de confirmação",definition:"Código temporário e secreto usado para confirmar acesso.",lessonSlug:"whatsapp"},
 {term:"Phishing",definition:"Tentativa de enganar alguém para obter senhas, códigos ou dados.",lessonSlug:"conta"},
 {term:"Acesso remoto",definition:"Tecnologia que permite controlar outro aparelho à distância.",lessonSlug:"suporte"},
];
const help=[{slug:"banco",title:"Fale com o banco",description:"Use apenas os canais oficiais.",steps:["Contate o banco o quanto antes.","Explique a situação e siga as orientações de bloqueio.","Guarde protocolos e comprovantes."],order:1},{slug:"contas",title:"Proteja suas contas",description:"Interrompa acessos desconhecidos.",steps:["Troque as senhas em um aparelho seguro.","Encerre sessões desconhecidas.","Ative a autenticação em duas etapas."],order:2},{slug:"registro",title:"Registre as informações",description:"Preserve evidências sem reenviar dados sensíveis.",steps:["Guarde capturas, números e comprovantes.","Registre ocorrência nos canais indicados para sua região.","Avise contatos se alguém usou seu nome."],order:3}];

async function seed(){await connectDB();for(const lesson of lessons)await LessonModel.updateOne({slug:lesson.slug},{$set:lesson},{upsert:true});for(const q of questions)await QuestionModel.updateOne({order:q.order},{$set:q},{upsert:true});for(const s of simulations)await SimulationModel.updateOne({slug:s.slug},{$set:s},{upsert:true});for(const item of glossary)await GlossaryModel.updateOne({term:item.term},{$set:item},{upsert:true});for(const item of help)await HelpModel.updateOne({slug:item.slug},{$set:item},{upsert:true});const email=process.env.ADMIN_EMAIL?.toLowerCase();const password=process.env.ADMIN_PASSWORD;if(email&&password){await UserModel.updateOne({email},{$set:{name:process.env.ADMIN_NAME??"Administrador",role:"admin",status:"active",passwordHash:await bcrypt.hash(password,12)}},{upsert:true});}console.log(`Seed concluído: ${lessons.length} aulas, ${questions.length} perguntas e ${simulations.length} simulações.`);process.exit(0)}
seed().catch(error=>{console.error(error);process.exit(1)});
