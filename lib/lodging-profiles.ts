import {ARROIOS,DUPLEX,ALFAMA} from './model';

export const lodgingProfiles:Record<string,{summary:string;focus:string}|undefined>={
 [ARROIOS]:{summary:'Quarto · Cama de casal · Casa de banho',focus:'Cabeceira, tapete, prateleiras, banheira e juntas.'},
 [DUPLEX]:{summary:'2 quartos · 2 camas de casal · Cozinha · Casa de banho · Sala, escadas e terraço',focus:'Sofá-cama conforme a ocupação. Atenção aos degraus, estofos, dois lavatórios e vidro do duche.'},
 [ALFAMA]:{summary:'Quarto · Sala com sofá-cama · Kitchenette · Casa de banho',focus:'Atenção à cabine de duche, juntas dos azulejos, exaustor, têxteis e recantos do espaço compacto.'}
};
