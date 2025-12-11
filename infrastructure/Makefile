# Makefile for Docker infrastructure management
# Uses BuildKit for faster builds

.PHONY: help up down restart logs ps clean build

# Enable BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

help:
	@echo "Docker Infrastructure Management"
	@echo ""
	@echo "Available commands:"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - Show logs for all services"
	@echo "  make ps          - Show running containers"
	@echo "  make clean       - Remove all containers and volumes"
	@echo "  make build       - Build Docker images"
	@echo "  make mailhog     - Open MailHog web UI"

up:
	@echo "🚀 Starting infrastructure services..."
	docker compose up -d
	@echo "✅ Services started"
	@echo ""
	@echo "Services available at:"
	@echo "  PostgreSQL: localhost:3802"
	@echo "  Redis:      localhost:3803"
	@echo "  MailHog UI: http://localhost:3810"
	@echo "  MailHog SMTP: localhost:3811"
	@echo ""
	@echo "Application services (start separately):"
	@echo "  Web App:    http://localhost:3800"
	@echo "  API:        http://localhost:3801/v1"

down:
	@echo "🛑 Stopping infrastructure services..."
	docker compose down

restart:
	@echo "🔄 Restarting infrastructure services..."
	docker compose restart

logs:
	docker compose logs -f

ps:
	docker compose ps

clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker compose down -v
	@echo "✅ Cleanup complete"

build:
	@echo "🔨 Building Docker images with BuildKit..."
	DOCKER_BUILDKIT=1 docker compose build

mailhog:
	@echo "📧 Opening MailHog web UI..."
	open http://localhost:3810 || xdg-open http://localhost:3810 || echo "Visit http://localhost:3810"

# Service-specific commands
postgres:
	docker compose up -d postgres

redis:
	docker compose up -d redis

mailhog-service:
	docker compose up -d mailhog

# Health checks
health:
	@echo "🏥 Checking service health..."
	@docker compose ps
	@echo ""
	@echo "Testing connections..."
	@curl -s http://localhost:3810 > /dev/null && echo "✅ MailHog UI is accessible" || echo "❌ MailHog UI not accessible"
	@docker exec er-postgres pg_isready -U postgres > /dev/null && echo "✅ PostgreSQL is ready" || echo "❌ PostgreSQL not ready"
	@docker exec er-redis redis-cli ping > /dev/null && echo "✅ Redis is ready" || echo "❌ Redis not ready"
