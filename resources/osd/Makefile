# max7456tool: https://github.com/fiam/max7456tool
# Minimum version required: 0.4
.PHONY: all clean

FONT_VERSION = 1

FONTS = default vision impact clarity clarity_medium bold large
CHARMAPS = $(addsuffix .mcm, $(FONTS))
PREVIEWS = $(addsuffix .png, $(FONTS))

# 'I', 'N', 'A', 'V', 1
INAV_METADATA = lu8:73,lu8:78,lu8:65,lu8:86,lu8:1
FONT_VERSION_METADATA = lu8:${FONT_VERSION}
CHAR_METADATA = ${INAV_METADATA},${FONT_VERSION_METADATA}
METADATA = 255=${CHAR_METADATA}-256=${CHAR_METADATA}

all: $(CHARMAPS) $(PREVIEWS)

%.mcm: % %/*.png
	max7456tool -f build -md ${METADATA} $< $@

%.png: %.mcm
	max7456tool -f png $< $@

clean:
	$(RM) $(CHARMAPS) $(PREVIEWS)
