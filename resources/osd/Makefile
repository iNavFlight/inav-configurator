.PHONY: all clean

FONTS = default bold large
CHARMAPS = $(addsuffix .mcm, $(FONTS))
PREVIEWS = $(addsuffix .png, $(FONTS))

all: $(CHARMAPS) $(PREVIEWS)

%.mcm: % %/*.png
	max7456tool -f build $< $@

%.png: %.mcm
	max7456tool -f png $< $@

clean:
	$(RM) $(CHARMAPS) $(PREVIEWS)
