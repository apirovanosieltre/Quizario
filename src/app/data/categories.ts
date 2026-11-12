export interface CategoryStyle { slug:string; title:string; description:string; emoji:string; tint:string; }
export const CATEGORY_STYLES:readonly CategoryStyle[]=[
  { slug:'cultura',title:'Un po’ di tutto',description:'Domande inattese, risposte sorprendenti.',emoji:'✦',tint:'peach'},
  { slug:'geografia',title:'Giro del mondo',description:'Confini, capitali e luoghi da esplorare.',emoji:'◎',tint:'blue'},
  { slug:'storia',title:'Salto nel tempo',description:'Un viaggio tra epoche e personaggi.',emoji:'⌛',tint:'lavender'},
  { slug:'scienza',title:'Pianeta scienza',description:'Piccole scoperte, grandi curiosità.',emoji:'⚗',tint:'mint'},
  { slug:'sport',title:'Sport e record',description:'Sport, campioni e competizioni.',emoji:'⚽',tint:'mint'},
  { slug:'cinema',title:'Ciak, si gira!',description:'Grande e piccolo schermo.',emoji:'✳',tint:'lavender'},
];
