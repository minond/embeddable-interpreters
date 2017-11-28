TSC = tsc
TFLAGS = --outDir dist --lib dom,es2017 --module commonjs --strict --noImplicitAny --alwaysStrict

build:
	$(TSC) type/*/*.d.ts *.ts $(TFLAGS)
