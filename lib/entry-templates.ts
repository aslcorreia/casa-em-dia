import {ARROIOS,areas,lodgingAreas,isLodgingArea,normalizeArea,Data,Item} from './model';

import {apartmentCleaningTemplates} from './apartment-cleaning';
import {arroiosCleaningTemplates} from './arroios-cleaning';

type Scope=Data['area']|'Alojamentos'|'Todos';
export type EntryTemplate={id:string;kind:Item['kind'];scope:Scope;label:string;hint:string;steps?:string[];routine?:boolean;excludeAreas?:readonly Data['area'][];recordTitle?:string;description?:string;category?:string;channel?:Data['channel']};
export const entryKinds:Record<Item['kind'],string>={task:'Tarefa',incident:'Problema',purchase:'Compra',stay:'Estadia',supplier:'Contacto'};
export const entryTemplates:EntryTemplate[]=[
 {id:'home-clean-base',kind:'task',scope:'Casa',label:'Limpeza da casa — rotina base',hint:'Casas de banho, cozinha, pó e chão.',routine:true,steps:['Arrumar as superfícies para limpar','Limpar as casas de banho','Limpar a cozinha e a bancada','Limpar o pó','Aspirar e lavar o chão','Esvaziar o lixo e anotar o que falta']},
 {id:'home-clean-detail',kind:'task',scope:'Casa',label:'Limpeza da casa — segunda visita',hint:'Vidros, quartos, roupa e manutenção.',routine:true,steps:['Confirmar as prioridades desta visita','Limpar os vidros e espelhos combinados','Mudar a roupa das camas indicadas','Arrumar e tratar da roupa combinada','Rever cozinha e casas de banho','Aspirar e lavar as zonas necessárias']},
 {id:'home-food',kind:'task',scope:'Casa',label:'Preparar sopa e refeição vegetal',hint:'Combinar o menu e preparar as refeições.',steps:['Confirmar o menu e os ingredientes disponíveis','Preparar a sopa','Preparar o prato combinado','Acondicionar e identificar as refeições','Deixar a cozinha limpa']},
 {id:'home-linen',kind:'task',scope:'Casa',label:'Tratar da roupa',hint:'Lavar, secar, dobrar e arrumar.',steps:['Separar a roupa conforme as etiquetas','Lavar e secar','Dobrar ou passar o combinado','Arrumar nos locais certos']},
 {id:'home-deep',kind:'task',scope:'Casa',label:'Limpeza a fundo de uma divisão',hint:'Escolher uma zona e concentrar o trabalho.',steps:['Indicar a divisão e o que deve ser limpo','Confirmar materiais necessários','Fazer a limpeza combinada','Registar alguma avaria ou falta de material']},
 {id:'home-shopping',kind:'purchase',scope:'Casa',label:'Produtos de limpeza em falta',hint:'Produto, quantidade e alternativa aceitável.',description:'Produtos e quantidades:\n\nAlternativas aceitáveis:',category:'Limpeza'},
 {id:'family-pickup',kind:'task',scope:'Família',label:'Combinar quem vai buscar',hint:'Criança, local, dia e hora.',description:'Quem vai ser buscado:\nLocal:\nHora:',steps:['Confirmar quem vai buscar','Confirmar o local e a hora']},
 {id:'family-activity',kind:'task',scope:'Família',label:'Preparar atividade ou compromisso',hint:'Horário, transporte e material necessário.',steps:['Confirmar horário e local','Combinar o transporte','Preparar o material necessário']},
 {id:'family-school',kind:'task',scope:'Família',label:'Tratar de um assunto da escola',hint:'Documento, reunião ou autorização.',steps:['Ler o pedido da escola','Preparar a resposta ou documento','Registar a data limite']},
 {id:'family-pets',kind:'task',scope:'Família',label:'Organizar os cuidados do cão e do gato',hint:'Alimentação, passeio, areia e material.',steps:['Combinar alimentação e água','Combinar o passeio do cão','Limpar a caixa de areia','Verificar se é preciso comprar ração ou areia']},
 {id:'family-appointment',kind:'task',scope:'Família',label:'Marcar consulta ou compromisso',hint:'Quem precisa, contacto e disponibilidade.',steps:['Identificar a pessoa e o serviço','Confirmar disponibilidades','Registar a marcação e o transporte']},
 {id:'quinta-garden',kind:'task',scope:'Quinta · Arruda',label:'Dar uma volta à horta e ao pomar',hint:'Observar, fotografar e apontar o que falta.',steps:['Verificar as plantas e a humidade do solo','Observar a rega e possíveis fugas','Registar problemas com fotografias','Escolher o próximo trabalho']},
 {id:'quinta-irrigation',kind:'task',scope:'Quinta · Arruda',label:'Verificar a rega',hint:'Programação, tubos e gotejadores.',steps:['Verificar a programação prevista','Ver se a água chega às zonas de rega','Identificar fugas ou gotejadores entupidos','Registar o que precisa de reparação']},
 {id:'quinta-outside',kind:'task',scope:'Quinta · Arruda',label:'Limpar e arrumar o exterior',hint:'Caminhos, folhas e ferramentas.',steps:['Definir a zona a tratar','Recolher folhas e resíduos','Arrumar ferramentas e materiais','Anotar o que precisa de manutenção']},
 {id:'quinta-work',kind:'task',scope:'Quinta · Arruda',label:'Planear um trabalho na quinta',hint:'Objetivo, material e quem executa.',steps:['Definir o resultado pretendido','Listar materiais e ferramentas','Confirmar quem executa e quando','Pedir orçamento se necessário']},
 {id:'quinta-material',kind:'purchase',scope:'Quinta · Arruda',label:'Material para a quinta',hint:'Medidas, quantidade e finalidade.',description:'Para que trabalho:\nMaterial e medidas:\nQuantidade:',category:'Horta e manutenção'},
 {id:'laundry-check',kind:'task',scope:'Lavandaria',label:'Verificar a lavandaria',hint:'Máquinas, pagamentos, limpeza e consumíveis.',steps:['Verificar se há erros visíveis nas máquinas','Verificar o sistema de pagamento','Verificar a limpeza do espaço','Verificar o nível dos consumíveis','Registar avarias ou material em falta']},
 {id:'laundry-clean',kind:'task',scope:'Lavandaria',label:'Limpar a lavandaria',hint:'Bancadas, máquinas, filtros e chão.',steps:['Limpar bancadas e superfícies exteriores','Limpar os filtros de acordo com o procedimento do equipamento','Limpar portas e vidros','Esvaziar o lixo','Aspirar e lavar o chão','Anotar material em falta']},
 {id:'laundry-stock',kind:'task',scope:'Lavandaria',label:'Repor consumíveis',hint:'Confirmar o stock e repor os produtos.',steps:['Verificar os produtos e quantidades em stock','Repor conforme o procedimento do equipamento','Registar o que precisa de ser encomendado']},
 {id:'laundry-service',kind:'task',scope:'Lavandaria',label:'Marcar assistência a uma máquina',hint:'Máquina, erro, técnico e visita.',steps:['Identificar a máquina e o problema','Juntar a fotografia ou código de erro','Contactar o técnico','Registar a data e o orçamento']},
 {id:'laundry-fault',kind:'incident',scope:'Lavandaria',label:'Máquina ou secador com problema',hint:'Identificar o equipamento e juntar fotografia.',description:'Equipamento / número:\nO que aconteceu:\nCódigo de erro (se existir):',steps:['Registar o problema e a fotografia','Definir o próximo passo com o responsável']},
 {id:'laundry-buy',kind:'purchase',scope:'Lavandaria',label:'Detergente e consumíveis',hint:'Produto, quantidade e stock disponível.',description:'Produto:\nQuantidade necessária:\nStock atual:',category:'Consumíveis da lavandaria'},
 ...arroiosCleaningTemplates,
 ...apartmentCleaningTemplates,
 {id:'al-turnover',kind:'task',scope:'Alojamentos',excludeAreas:[ARROIOS],label:'Limpeza entre hóspedes',hint:'Uma lista para deixar a casa pronta.',steps:['Confirmar a saída e a hora da próxima entrada','Recolher lixo e roupa usada','Verificar e fotografar danos ou faltas','Limpar cozinha e casas de banho','Limpar superfícies e chão','Fazer as camas e colocar toalhas','Repor os consumíveis combinados','Verificar a casa e confirmar que está pronta'],description:'Referência da estadia:\nHora limite para a casa ficar pronta:'},
 {id:'al-confirm',kind:'task',scope:'Alojamentos',label:'Confirmar hóspedes e chegada',hint:'Total de pessoas, hora e necessidades.',steps:['Verificar se a plataforma já enviou uma mensagem','Pedir o total de adultos, crianças e bebés','Pedir a hora prevista de chegada','Confirmar necessidades de camas ou berço','Atualizar a estadia com a resposta']},
 {id:'al-arrival',kind:'task',scope:'Alojamentos',label:'Preparar o check-in',hint:'Casa pronta, acesso e instruções.',steps:['Confirmar que a limpeza está concluída','Verificar camas, toalhas e consumíveis','Confirmar chaves ou instruções de acesso','Rever a mensagem de chegada antes de enviar']},
 {id:'al-checkout',kind:'task',scope:'Alojamentos',label:'Verificar a casa após a saída',hint:'Objetos esquecidos, danos e manutenção.',steps:['Confirmar a saída dos hóspedes','Procurar objetos esquecidos','Verificar danos ou material em falta','Criar ocorrências com fotografias','Combinar a limpeza e a próxima entrada']},
 {id:'al-linen',kind:'task',scope:'Alojamentos',label:'Preparar roupa de cama e toalhas',hint:'Quantidade, lavagem e conjuntos de reserva.',steps:['Contar os conjuntos necessários','Separar roupa usada e limpa','Preparar camas e toalhas para a ocupação confirmada','Registar peças em falta ou danificadas']},
 {id:'al-maintenance',kind:'task',scope:'Alojamentos',label:'Revisão do alojamento',hint:'Acessos, equipamentos e pequenas reparações.',routine:true,steps:['Verificar luzes, tomadas e equipamentos','Verificar torneiras e autoclismos','Verificar chaves e acessos','Testar a ligação Wi-Fi','Listar reparações necessárias']},
 {id:'al-buy',kind:'purchase',scope:'Alojamentos',label:'Repor material do alojamento',hint:'Higiene, limpeza, cozinha ou roupa.',description:'Material e quantidade:\nNecessário antes de que entrada:',category:'Reposição do alojamento'},
 {id:'al-booking',kind:'stay',scope:'Alojamentos',label:'Reserva Booking',hint:'Introduzir hóspede, datas e ocupação.',recordTitle:'',channel:'Booking'},
 {id:'al-airbnb',kind:'stay',scope:'Alojamentos',label:'Reserva Airbnb',hint:'Introduzir hóspede, datas e ocupação.',recordTitle:'',channel:'Airbnb'},
 {id:'al-trip',kind:'stay',scope:'Alojamentos',label:'Reserva Trip.com',hint:'Introduzir hóspede, datas e ocupação.',recordTitle:'',channel:'Trip.com'},
 {id:'al-direct',kind:'stay',scope:'Alojamentos',label:'Reserva direta',hint:'Introduzir uma estadia recebida diretamente.',recordTitle:'',channel:'Manual'},
 {id:'issue-repair',kind:'incident',scope:'Todos',label:'Algo precisa de reparação',hint:'Local, problema e fotografia.',recordTitle:'',description:'Local exato:\nO que não está a funcionar:\nQuando foi detetado:',steps:['Juntar uma fotografia do problema','Combinar o próximo passo com o responsável']},
 {id:'issue-water',kind:'incident',scope:'Todos',label:'Fuga de água',hint:'Indicar a origem e o que já foi feito.',description:'Local da fuga:\nO que foi observado:\nO que já foi feito:',steps:['Registar o local e fotografias','Contactar o responsável pela reparação']},
 {id:'issue-missing',kind:'incident',scope:'Todos',label:'Falta material para trabalhar',hint:'Para a equipa registar o que precisa.',recordTitle:'',description:'Material em falta:\nQuantidade:\nTrabalho que está à espera:',steps:['Listar o material em falta','Informar o responsável']},
 {id:'buy-product',kind:'purchase',scope:'Todos',label:'Comprar um produto',hint:'Descrição, quantidade e orçamento.',recordTitle:'',description:'O que precisamos:\nQuantidade / medidas:\nOrçamento pretendido:'},
 {id:'contact-clean',kind:'supplier',scope:'Todos',label:'Contacto de limpeza',hint:'Guardar nome, telefone e espaços atendidos.',recordTitle:'',category:'Limpeza'},
 {id:'contact-technician',kind:'supplier',scope:'Todos',label:'Técnico de manutenção',hint:'Equipamentos, contacto e trabalhos anteriores.',recordTitle:'',category:'Manutenção'},
 {id:'contact-plumber',kind:'supplier',scope:'Todos',label:'Canalizador ou eletricista',hint:'Especialidade, contacto e disponibilidade.',recordTitle:'',category:'Reparações'}
];
export function templatesFor(area:string,kind:Item['kind']|'all',admin:boolean){
 area=normalizeArea(area) as string;
 return entryTemplates.filter(t=>!t.excludeAreas?.includes(area as Data['area'])&&(admin||(['task','incident'].includes(t.kind)&&t.scope!=='Família'))&&(kind==='all'||t.kind===kind)&&(area==='Todas as áreas'||t.scope==='Todos'||t.scope===area||(t.scope==='Alojamentos'&&isLodgingArea(area)))).sort((a,b)=>Number(b.scope===area)-Number(a.scope===area));
}
export function templateArea(t:EntryTemplate,selected:string):Data['area']{
 selected=normalizeArea(selected) as string;
 if(areas.includes(selected as Data['area'])&&(t.scope==='Todos'||t.scope===selected||(t.scope==='Alojamentos'&&isLodgingArea(selected))))return selected as Data['area'];
 return t.scope==='Alojamentos'?(lodgingAreas.find(a=>!t.excludeAreas?.includes(a))||ARROIOS):t.scope==='Todos'?'Casa':t.scope;
}
export function templateDraft(t:EntryTemplate,base:Data,selected:string):Data{
 const steps=(t.steps||[]).map(title=>({id:crypto.randomUUID(),title,done:false}));
 return {...base,title:t.recordTitle??t.label,area:templateArea(t,selected),description:t.description||'',steps,nextStep:steps[0]?.title||'',repeat:t.routine?'Semanal':'Não repetir',category:t.category||'',channel:t.channel||'Manual',quotes:[],due:'',time:'',checkout:'',guestsConfirmed:false,arrivalConfirmed:false,cleaning:'Por marcar'};
}
