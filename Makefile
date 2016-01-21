PACK = quickpack build  index.js -p --no-uglify -o lib

.PHONY: build
build:
	$(PACK)

.PHONY: watch
watch:
	$(PACK) -w