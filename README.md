
#  Kinoplekis - Sistema de Reserva de Ingressos

 ( # ESTE É UM PROJETO PESSOAL) Releitura moderna e tecnológica da plataforma de cinema Kinoplex. Este projeto é uma aplicação **Full-Stack** que permite navegar por um catálogo de filmes, selecionar sessões e reservar assentos em tempo real com persistência de dados.

##  Tecnologias Utilizadas

### Backend:
- **Python 3.x**
- **FastAPI**: Framework web de alta performance.
- **SQLAlchemy**: ORM para comunicação com o banco de dados.
- **SQLite**: Banco de dados relacional para persistência das reservas.
- **Uvicorn**: Servidor ASGI para rodar a aplicação.

### Frontend:
- **HTML5 & CSS3**: Layout responsivo com foco em identidade visual premium (Dark Mode).
- **JavaScript (ES6+)**: Lógica assíncrona para consumo de API (Fetch API) e manipulação dinâmica do DOM.

##  Funcionalidades

-  **Catálogo Dinâmico**: Os filmes e sessões são carregados diretamente do banco de dados.
-  **Mapa de Assentos**: Interface interativa para seleção de poltronas.
-  **Diferenciação VIP**: Lógica para assentos especiais (KinoEvolution).
-  **Persistência de Dados**: As reservas são salvas no SQLite, impedindo que o mesmo assento seja comprado duas vezes após o recarregamento.
-  **Navegação Dinâmica**: Integração entre catálogo e tela de checkout via parâmetros de URL.

PROJETO em desenvolvimento (NAO TEM VERSOES TESTE DISPONIVEL) 

