RAW_VERSION=$(shell cat VERSION)
VERSION=$(strip $(RAW_VERSION))
ZIP=zip
PKG_DIR=pkg
NAME=fireless
EXT=xpi
IGNORE=.zipignore
FILENAME=$(PKG_DIR)/$(NAME)-$(VERSION).$(EXT)

$(PKG_DIR):
	mkdir $(PKG_DIR)

xpi: $(PKG_DIR)
	rm -f $(FILENAME)
	$(ZIP) -r $(FILENAME) . -x@$(IGNORE)