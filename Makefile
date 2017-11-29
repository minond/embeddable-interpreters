TSC = tsc
TFLAGS = --outDir dist --lib dom,es2017 --module umd --strict --noImplicitAny --alwaysStrict

build:
	$(TSC) type/*.d.ts *.ts $(TFLAGS)

test: build
	node test/*_test.ts
