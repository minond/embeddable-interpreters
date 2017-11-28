TSC = tsc
TFLAGS = --outDir dist --lib dom,es2017 --module commonjs

build:
	$(TSC) type/*/*.d.ts *.ts $(TFLAGS)
