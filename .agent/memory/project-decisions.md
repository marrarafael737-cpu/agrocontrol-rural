---
type: project
created: 2026-06-08
updated: 2026-06-08
---

# Project Decisions & Context

## Regras de Negócio Pecuária
- **Identificação do Gado**: A fazenda não trabalha com brinco ou ID individual para o rebanho comercial. O controle é feito por **Marca** (ex: R, Am) e **Categoria/Era**.
- **Manejo (Modo Curral)**: O controle de vacinação e movimentação funciona como um "Caixa". O app conta o volume que passou no curral e compara com a estimativa do sistema (reconciliação de lote). Diferenças são tratadas como nascimento, morte ou erro de estimativa.
- **Operador**: Assumir que o usuário principal do app no campo é o patrão/gerente, o que permite que ele tome decisões de ajuste de estoque (como justificar sobras de gado) na mesma hora, no curral.

## Funcionalidades em Espera
- **Modo Curral**: Plano de implementação gerado (UI otimizada com botões grandes de "+1", modal de fechamento com resolução de diferenças de saldo).
