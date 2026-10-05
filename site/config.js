/* Contatos da Frutatt — preencha e todos os botões/links do site aparecem sozinhos.
 * instagram:    só o @ (sem "@"), ex.: "sucofrutatt"
 * whatsapp:     DDI + DDD + número, só dígitos, ex.: "5585999999999"
 * whatsappLink: link pronto do WhatsApp Business (api.whatsapp.com/message/...).
 *               Se preenchido, tem prioridade sobre o número em todos os botões.
 * Vazio = o botão fica escondido. */
window.FRUTATT_CONTACT = {
  instagram: "frutattosuqo",
  whatsapp: "",
  whatsappLink: "https://api.whatsapp.com/message/R7XAESDRWZ34E1?autoload=1&app_absent=0&utm_source=ig",
};

/* Pontos de venda por cidade — alimentam a seção "Onde encontrar" da home.
 * ⚠ Os itens abaixo são EXEMPLOS de estrutura: troque pelos pontos reais antes de publicar.
 * Cidade sem pontos = a lista mostra um atalho para perguntar no WhatsApp. */
window.FRUTATT_PONTOS = {
  recife: [
    { nome: "Ponto de venda (exemplo)", bairro: "Boa Viagem", tipo: "Mercado" },
    { nome: "Ponto de venda (exemplo)", bairro: "Casa Forte", tipo: "Empório" },
    { nome: "Ponto de venda (exemplo)", bairro: "Espinheiro", tipo: "Lanchonete" },
  ],
  "joao-pessoa": [
    { nome: "Ponto de venda (exemplo)", bairro: "Manaíra", tipo: "Mercado" },
    { nome: "Ponto de venda (exemplo)", bairro: "Tambaú", tipo: "Quiosque" },
  ],
  natal: [
    { nome: "Ponto de venda (exemplo)", bairro: "Ponta Negra", tipo: "Mercado" },
    { nome: "Ponto de venda (exemplo)", bairro: "Petrópolis", tipo: "Empório" },
  ],
};

/* Depoimentos reais de clientes (com autorização). Vazio = só o mosaico do Instagram aparece.
 * { nome: "Ana", cidade: "Recife", texto: "…", usuario: "@ana" } */
window.FRUTATT_DEPOIMENTOS = [];
