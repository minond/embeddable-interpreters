TSC = ./node_modules/.bin/tsc

build:
	$(TSC)

install:
	npm install

test: build
	node test/*_test.ts
