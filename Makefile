TSC = tsc

build:
	$(TSC)

test: build
	node test/*_test.ts
