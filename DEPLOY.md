# Publicando no GitHub Pages

Este projeto já vem com deploy automático configurado (`.github/workflows/deploy.yml`).

## Passo a passo

1. **Crie um repositório** no [github.com/new](https://github.com/new) (público — Pages é gratuito só em repos públicos).
2. **Envie o código** (de dentro da pasta do projeto):
   ```bash
   git init
   git add .
   git commit -m "primeiro commit"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git
   git push -u origin main
   ```
3. **Ative o Pages**: no repositório, vá em **Settings → Pages** e em *Source* escolha **GitHub Actions**.
4. Pronto! O workflow roda a cada `git push` e publica em:
   `https://SEU-USUARIO.github.io/NOME-DO-REPO/`

> Se o seu branch padrão se chama `master`, não precisa mudar nada — o workflow aceita `main` ou `master`.

## Alternativa manual (sem Actions)

Se preferir publicar por branch, instale o pacote `gh-pages` e rode, a cada atualização:

```bash
npx vite build --base=./
npx gh-pages -d dist
```

O site sai na mesma URL acima.

## Observações

- `--base=./` deixa os caminhos relativos: o mesmo build funciona em qualquer subpasta.
  Se um dia quiser travar o caminho no `vite.config.ts`, use `base: '/NOME-DO-REPO/'`.
- O repositório precisa conter o `package-lock.json` (ele já existe aqui).
- Para domínio próprio (ex.: `qubitlab.com.br`), configure em **Settings → Pages → Custom domain**.
