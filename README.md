# LP Frutatto

Landing page do Suco Frutatt com motion design (GSAP + ScrollTrigger).

## Estrutura
- `site/` — a landing page (abra `site/index.html` ou sirva a pasta: `python -m http.server -d site`)
- `asset/` — arquivos-fonte (fundo e PNGs dos produtos com transparência)
- `build_assets.py` — recorta as folhas do fundo em camadas, otimiza tudo em AVIF/WebP responsivo → `site/img/`
- `make_video.py` — gera o vídeo de vitrine dos sabores (`frutatto_showcase.mp4`)

## Adicionar um produto
Salve o PNG transparente em `asset/` (`granola.png`, `acai.png`, …) e rode:

```
pip install pillow opencv-python-headless numpy
python build_assets.py
```
