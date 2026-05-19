# Cheatsheet Community — Roadmap

> Visão: transformar o cheatsheet pessoal em uma plataforma colaborativa para profissionais de Segurança, DevOps e SysAdmin.

---

## Estado Atual (v2.0)

- 254 comandos em 32 categorias (Security, Linux, Windows, AD, DevOps, Wireshark...)
- Assistente IA (Anthropic, OpenAI, Gemini)
- Usuários online em tempo real (Firebase)
- Import / Export de comandos (JSON)
- Syntax highlighting
- Contador de uso por comando
- PWA — instalar como app, funciona offline
- Deploy automático via GitHub Actions

---

## Fase 1 — Fundação da Comunidade

**Objetivo:** autenticação e perfis de usuário.

- [ ] Autenticação com Google / GitHub via Firebase Auth
- [ ] Perfil público do usuário (username, bio, avatar)
- [ ] Comandos salvos na nuvem por usuário (Firestore) — não mais só localStorage
- [ ] Página pública de perfil: `/u/israelson`

---

## Fase 2 — Comandos Compartilhados

**Objetivo:** qualquer usuário pode publicar e consumir comandos da comunidade.

- [ ] Publicar comando para a comunidade (toggle "público/privado")
- [ ] Feed de comandos recentes da comunidade
- [ ] Sistema de votos (upvote/downvote) nos comandos
- [ ] Tags e filtros na busca da comunidade
- [ ] Moderação: denúncia de comando inadequado
- [ ] Badges de autor nos cards (avatar + username)

---

## Fase 3 — Fórum

**Objetivo:** espaço de discussão técnica integrado à ferramenta.

- [ ] Categorias do fórum alinhadas às categorias do cheatsheet
  - Ex: `/forum/devops`, `/forum/pentest`, `/forum/sysadmin`
- [ ] Criar tópico com Markdown + syntax highlight
- [ ] Respostas aninhadas (thread)
- [ ] Reações por post (👍 🔥 💡)
- [ ] Vincular comando do cheatsheet a um post do fórum
- [ ] Busca global: comandos + posts do fórum numa só pesquisa
- [ ] Notificações de resposta

---

## Fase 4 — Gamificação e Reputação

**Objetivo:** incentivar contribuições de qualidade.

- [ ] Sistema de pontos por ação:
  - Publicar comando aceito pela comunidade: +10 pts
  - Receber upvote em comando: +2 pts
  - Responder no fórum com solução aceita: +15 pts
  - Login diário: +1 pt
- [ ] Níveis: Novato → Especialista → Expert → Elite
- [ ] Badges especiais:
  - 🔒 Security Researcher
  - ⚙️ DevOps Engineer
  - 🐧 Linux Master
  - 🏆 Top Contributor
- [ ] Ranking semanal/mensal de contribuidores
- [ ] Perfil público com histórico e badges

---

## Fase 5 — Conteúdo e Curadoria

**Objetivo:** conteúdo de qualidade e organização editorial.

- [ ] Coleções (playlists de comandos): ex. "Checklist HTB — Active Directory"
- [ ] Coleções públicas criadas pela comunidade
- [ ] Artigos técnicos curtos (tipo TIL — Today I Learned)
- [ ] Newsletter semanal com os comandos mais votados
- [ ] Destaque editorial: "Comando da Semana"

---

## Fase 6 — Integrações e API

**Objetivo:** conectar a ferramenta ao fluxo de trabalho real.

- [ ] API pública REST para consumir comandos programaticamente
- [ ] Plugin para VS Code (buscar comando sem sair do editor)
- [ ] CLI (`cheatsheet search "nmap"`) via npm package
- [ ] Integração com Obsidian (exportar comandos como notas)
- [ ] Webhook: notificar canal Slack/Discord quando novo comando é publicado

---

## Stack Planejada

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite (atual) |
| Autenticação | Firebase Auth |
| Banco de dados | Firestore (comandos, perfis) + Realtime DB (presença) |
| Storage | Firebase Storage (avatares) |
| Fórum | Próprio sobre Firestore ou integração Discourse |
| API | Firebase Functions (serverless) |
| Deploy | GitHub Pages (frontend) + Firebase (backend) |
| CI/CD | GitHub Actions (atual) |

---

## Princípios

1. **Privacy first** — LGPD, sem rastreamento, dados do usuário sob controle dele
2. **Offline first** — PWA, funciona sem internet
3. **Open source** — código aberto, comunidade pode contribuir via PR
4. **Multilíngue** — PT-BR primeiro, EN como segunda língua

---

## Contribuindo

O projeto é open source: **https://github.com/israelson/cheatsheet**

Para sugerir comandos, abrir um Issue ou PR no repositório.
