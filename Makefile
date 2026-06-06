.DEFAULT_GOAL := deploy

.PHONY: deploy build

deploy:
	npm run dev

build:
	npm run build
