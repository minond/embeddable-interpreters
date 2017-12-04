TSC = ./node_modules/.bin/tsc

build:
	$(TSC)

install:
	npm install

test: build
	@echo "Running brainfuck tests:"
	@node test/brainfuck_test.ts
	@echo
	@echo "Running brainloller tests:"
	@node test/brainloller_test.ts
