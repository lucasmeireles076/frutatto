# LP Frutatto

Landing page do Suco Frutatt com motion design (GSAP + ScrollTrigger).

## Páginas
- `index.html` — home (hero Caju + seção de produtos)
- `sabores.html` — catálogo (cada card com a cor do sabor)
- `caju.html`, `uva.html`, `caja.html` — página por sabor (mesma campanha, fundo e entrada próprios)
- `contato.html` — WhatsApp e Instagram

## Instagram e WhatsApp
Preencha `site/config.js`. Todos os botões/links (menu, hero, rodapé, botão flutuante) aparecem sozinhos;
vazio = escondido. `whatsappLink` (link do WhatsApp Business) tem prioridade sobre o número.

## Seções da home (conversão)
Hero → Produtos → Benefícios → Carrossel "Peça o seu" → Rótulo → Onde encontrar (mapa) →
Instagram/depoimentos → FAQ → CTA final, com botão de WhatsApp fixo em todas as páginas.

Conteúdo editável sem mexer no HTML, em `site/config.js`:
- `FRUTATT_PONTOS` — pontos de venda de Recife, João Pessoa e Natal (os atuais são **exemplos**: troque antes de publicar)
- `FRUTATT_DEPOIMENTOS` — depoimentos reais de clientes; vazio = bloco escondido

## Estrutura
- `site/` — o site (sirva a pasta: `python -m http.server -d site` e abra http://localhost:8000)
- `build_pages.py` — gera catálogo, páginas de sabor e contato a partir da lista `FLAVORS`
- `asset/` — arquivos-fonte (fundo e PNGs dos produtos com transparência)
- `build_assets.py` — recorta as folhas do fundo em camadas, gera os fundos de cada sabor
  (recolorindo a arte original) e otimiza tudo em AVIF/WebP responsivo → `site/img/`
- `make_video.py` — gera o vídeo de vitrine dos sabores (`frutatto_showcase.mp4`)

## Adicionar um produto
Salve a garrafa em PNG transparente em `asset/` (`uva.png`, `caja.png`, `granola.png`, `acai.png`)
e rode:

```
pip install pillow opencv-python-headless numpy
python build_assets.py
python build_pages.py
```

Fotos de produto são sempre as reais — nada de embalagem gerada.
