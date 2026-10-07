import {ARROIOS} from './model';
import type {EntryTemplate} from './entry-templates';

// Equipment identified in the public Booking gallery on 2026-10-07.
// This is a cleaning plan, not an assessment of the property's current condition.
const visit='Referência da estadia:\nHora limite para ficar pronto:\n\nUsar produtos compatíveis com cada material, segundo o rótulo. Não misturar produtos. Separar panos da sanita, restantes superfícies da casa de banho e quarto. Registar faltas ou avarias numa ocorrência com fotografia.';
export const arroiosCleaningTemplates:EntryTemplate[]=[
 {
  id:'arroios-room',kind:'task',scope:ARROIOS,label:'Quarto e cama de casal',
  recordTitle:'Limpar o quarto e fazer a cama de casal',category:'Limpeza · Entre hóspedes',
  hint:'Entre hóspedes · cama, pó, tapete, louça e chão.',description:visit,
  steps:[
   'Confirmar saída, ocupação seguinte e hora limite; arejar o quarto em segurança',
   'Recolher lixo; guardar objetos esquecidos e registar danos ou faltas',
   'Retirar lençóis e fronhas usados sem sacudir; separar da roupa limpa',
   'Inspecionar colchão, protetor e almofadas; retirar peças com manchas, humidade ou odor',
   'Limpar a cabeceira, incluindo frestas, estrutura da cama e pés',
   'Limpar mesas de cabeceira, candeeiros e interruptores acessíveis',
   'Limpar puxadores, comandos e pontos de contacto com produto adequado',
   'Tirar o pó de todas as prateleiras abertas, gavetas vazias e cabides',
   'Limpar a TV e o suporte acessível sem pulverizar diretamente no equipamento',
   'Limpar mesas, cadeiras, entre as ripas e almofadas dos assentos',
   'Lavar e secar loiça, copos, chávenas e talheres; verificar marcas e resíduos',
   'Limpar o móvel de apoio, tabuleiros e individuais; verificar migalhas nos cantos',
   'Se presentes, limpar cafeteira, chaleira e minibar conforme o fabricante; retirar restos',
   'Limpar vidros interiores, puxadores e peitoris acessíveis; retirar dedadas',
   'Verificar cortinas e cortinados: pó, manchas e odores; retirar para lavar se necessário',
   'Retirar o pó dos objetos decorativos e vasos, incluindo a zona por baixo',
   'Aspirar o tapete dos dois lados e o chão por baixo',
   'Aspirar chão, cantos, rodapés e debaixo da cama e dos móveis acessíveis',
   'Limpar o chão de madeira com método adequado, sem o encharcar; deixar secar',
   'Com mãos limpas, fazer a cama de casal com lençóis e fronhas lavados e totalmente secos',
   'Rever colcha, manta e almofadas decorativas; colocar apenas peças limpas, sem pelos ou odor',
   'Se houver cama individual em utilização, aplicar os mesmos cuidados e preparar a roupa',
   'Repor os consumíveis combinados e deixar o lixo limpo com saco novo',
   'Rever à luz natural: sem pó, cabelos, migalhas, manchas ou humidade; registar pendências'
  ]
 },
 {
  id:'arroios-bathroom',kind:'task',scope:ARROIOS,label:'Casa de banho impecável',
  recordTitle:'Limpar a fundo a casa de banho entre hóspedes',category:'Limpeza · Entre hóspedes',
  hint:'Entre hóspedes · banheira, ralos, juntas e sanitários.',description:visit,
  steps:[
   'Arejar em segurança, preparar panos separados e retirar toalhas, tapete e lixo usados',
   'Retirar cabelos e resíduos visíveis da banheira, lavatório e chão',
   'Limpar a banheira inteira: fundo, laterais, rebordo e frente',
   'Limpar ralo, tampa e corrente acessíveis; verificar se a água escoa',
   'Limpar torneira, chuveiro e mangueira, removendo resíduos com produto compatível',
   'Limpar azulejos na zona da banheira, sobretudo juntas e cantos',
   'Inspecionar silicone e juntas; fotografar bolor persistente, fissuras ou fugas para reparação',
   'Limpar lavatório, ralo, torneira, transbordo acessível e zona por trás da torneira',
   'Limpar bancada, móvel do lavatório, puxadores e prateleiras vazias',
   'Limpar o espelho e os seus bordos, deixando sem dedadas ou marcas',
   'Limpar doseadores por fora, bicos e suportes; repor produtos conforme as instruções',
   'Limpar a estante de madeira: ripas, cantos, parte inferior e pés; secar bem',
   'Limpar porta, puxador, interruptor, janela e peitoril pelo lado interior acessível',
   'Com material exclusivo, limpar sanita: tampa dos dois lados, assento, dobradiças e autoclismo',
   'Limpar interior e rebordo da sanita, exterior, base e chão à volta',
   'Limpar escovilhão e suporte segundo o procedimento definido; substituir se degradados',
   'Desinfetar os pontos de contacto previstos, após limpar, respeitando o tempo do rótulo',
   'Lavar o chão, cantos e atrás da sanita com material próprio; deixar seco',
   'Com mãos limpas, colocar toalhas e tapete lavados, secos e sem manchas para a ocupação confirmada',
   'Repor papel higiénico, sabonete e saco do lixo; deixar suportes limpos',
   'Revisão final: sem cabelos, calcário visível, restos de sabão, odor ou água no chão'
  ]
 },
 {
  id:'arroios-deep',kind:'task',scope:ARROIOS,label:'Limpeza de detalhe',
  recordTitle:'Limpeza de detalhe — quarto e casa de banho',category:'Limpeza · A fundo',
  hint:'Agendar à parte · tecidos, zonas escondidas e pormenores.',
  description:'Complemento à limpeza entre hóspedes. Escolher a data conforme a utilização e o tempo de secagem necessário. Não substitui as rotinas do quarto e da casa de banho.\n\n'+visit,
  steps:[
   'Planear o trabalho com o quarto livre e tempo suficiente para tudo secar antes da entrada',
   'Lavar cortinas e cortinados conforme as etiquetas; limpar varões e suportes acessíveis',
   'Lavar colcha, manta, capas decorativas e protetores conforme as etiquetas',
   'Verificar almofadas e edredão; limpar conforme a etiqueta ou encaminhar para lavandaria',
   'Aspirar colchão, costuras e estrutura conforme o fabricante; verificar sinais de pragas',
   'Se houver sinais de pragas ou contaminação, avisar a gestão e não preparar a cama para uso',
   'Mover apenas móveis seguros de deslocar; limpar atrás e por baixo sem danificar o soalho',
   'Limpar rodapés, aros de portas, cantos altos e superfícies superiores acessíveis',
   'Esvaziar e limpar prateleiras, gavetas, móvel de apoio e zona dos equipamentos',
   'Limpar a fundo o tapete e estofos conforme as etiquetas; garantir secagem completa',
   'Limpar caixilhos, calhas, portadas e vidros interiores acessíveis; nunca se debruçar para o exterior',
   'Limpar varanda, mesa, cadeiras e guarda pelo lado seguro, se estiverem em uso',
   'Descalcificar chuveiro, torneiras e equipamentos aplicáveis segundo o fabricante',
   'Limpar a fundo juntas, cantos e ralos acessíveis; comunicar degradação do silicone',
   'Limpar a grelha acessível na frente da banheira sem desmontar instalações',
   'Rever humidade, odores, ventilação e fugas; criar ocorrências do que precisar de reparação',
   'Confirmar que os tecidos e superfícies estão completamente secos; registar o trabalho feito'
  ]
 },
 {
  id:'arroios-ready',kind:'task',scope:ARROIOS,label:'Revisão antes da chegada',
  recordTitle:'Verificar quarto e casa de banho antes da chegada',category:'Limpeza · Revisão final',
  hint:'Último olhar · roupa, cabelos, consumíveis e acesso.',
  description:'Só concluir depois de verificar o quarto e a casa de banho. Se algo falhar, corrigir ou criar uma ocorrência. Depois, atualizar também o estado da limpeza na estadia correspondente.',
  steps:[
   'Confirmar total de hóspedes, hora de chegada e roupa preparada para essa ocupação',
   'Rever cama de casal, lençóis, fronhas, manta e almofadas: sem cabelos, manchas ou odor',
   'Passar pano limpo num ponto de controlo: cabeceira, prateleira e peitoril',
   'Rever banheira, ralos, lavatório e sanita: sem cabelos, resíduos, calcário visível ou fugas',
   'Confirmar toalhas secas, papel higiénico, sabonete e lixo vazio',
   'Verificar louça limpa, tapete e chão seco, incluindo debaixo da cama',
   'Verificar luzes, comandos, água e acesso; deixar janelas e porta em posição segura',
   'Registar problemas e fotografias finais sem pessoas nem dados de hóspedes',
   'Quando tudo estiver pronto, atualizar a limpeza na estadia para Concluída'
  ]
 }
];
