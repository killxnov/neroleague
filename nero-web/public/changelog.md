# Changelog - Nero

Todas as mudanças notáveis e marcos de desenvolvimento do projeto **Nero** são documentados neste arquivo. O projeto segue os princípios de Versionamento Semântico.

---

## [1.0.0] - 2026-09-21

### 🚀 Lançamento Oficial (Initial Production Release)
Esta versão marca a consolidação do **Nero** como um ecossistema multiplataforma robusto. O sistema agora entrega uma integração totalmente nativa e em tempo real com o cliente do League of Legends (LCU), permitindo o controlo completo através de uma aplicação de ambiente de trabalho (Desktop) em Electron combinada com um painel de controle móvel (Mobile Web) em React e Express.

### ✨ O que foi construído e implementado
* **Arquitetura Híbrida de Alta Performance:** 
  Fusão estruturada entre o processo principal do Electron (responsável pelo ciclo de vida da aplicação e gestão de processos do sistema operativo) e um servidor HTTP/WebSocket interno construído em Express para comunicação de rede local (LAN).
* **Master Loop de Sincronização Contínua:** 
  Implementação de um mecanismo de polling inteligente que atualiza o estado da interface móvel a cada 1 segundo. Isso elimina definitivamente a necessidade de intervenção manual ou atualizações forçadas (F5) por parte do utilizador.
* **Ecossistema de Autenticação por PIN Global:** 
  Desenvolvimento de um sistema de segurança onde o código PIN de sessão é gerado unicamente na inicialização pelo processo principal e propagado de forma síncrona para o Tray (bandeja do sistema), interface desktop e servidor web móvel.
* **Instalador Nativo Profissional (Windows NSIS):** 
  Configuração avançada através do *Electron-Builder*, garantindo a geração de um executável instalável (`Nero Setup 1.0.0.exe`) com suporte a ícones personalizados de alta resolução, criação automática de atalhos e gestão de diretórios de recursos embutidos.

### 🐛 Correções de Bugs e Ajustes Críticos
* **Resolução do Congelamento de Cache em Dispositivos Móveis:** 
  Correção do comportamento agressivo de cache dos navegadores móveis (como Safari no iOS e Chrome no Android) através da injeção automatizada de carimbos de tempo (`_t` timestamps) em todas as requisições HTTP do Axios.
* **Correção de Divergência de PINs:** 
  Eliminação do erro de múltiplas instâncias de geração de variáveis, garantindo que o PIN exibido na bandeja do sistema seja exatamente o mesmo exigido para autenticação no telemóvel.
* **Correção de Caminhos de Recursos Empacotados:** 
  Ajuste nos apontamentos estáticos do servidor Express para detetar corretamente se a aplicação está a correr em ambiente de desenvolvimento ou a partir do executável empacotado (`process.resourcesPath`), evitando erros de diretório inexistente (`ENOENT`).