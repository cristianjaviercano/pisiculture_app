.PHONY: help setup db-up db-down db-migrate db-seed test typecheck clean

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?##"}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

setup: db-up db-migrate db-seed test ## Levanta Postgres, migra, siembra y corre tests
	@echo "\n✅  Sprint 0 — Definition of Done completada"

db-up: ## Levanta Postgres con Docker Compose
	docker compose up -d postgres
	@echo "Esperando a que Postgres esté listo..."
	docker compose up flyway

db-down: ## Detiene y elimina los contenedores
	docker compose down -v

db-migrate: ## Aplica migraciones Flyway
	docker compose run --rm flyway

db-seed: ## Corre el seed de datos piloto (V009)
	@echo "Seed incluido en las migraciones Flyway (V009)"

test: ## Ejecuta el suite de tests del dominio (node:test)
	npm run test --workspace @aquashell/shared

typecheck: ## Type-check TypeScript sin compilar
	npm run typecheck --workspace @aquashell/shared

install: ## Instala dependencias del workspace
	npm install

clean: ## Elimina dist/ y node_modules
	find . -name "dist" -type d -not -path "*/.git/*" -exec rm -rf {} + 2>/dev/null || true
	find . -name "node_modules" -type d -not -path "*/.git/*" -exec rm -rf {} + 2>/dev/null || true
	@echo "Limpieza completada"
