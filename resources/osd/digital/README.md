# INAV HD fonts

These font character images are for use with HD FPV systems. These are the master images for editing, adding new symbols, or deriving alternate fonts from. Use the [HD OSD Font Tool](https://github.com/MrD-RC/hdosd-font-tool) to compile these font character images in to specific files, for use with HD FPV video system.

## Use
This is the **font root** directory. The __default__ subdirectory contains the default INAV HD fonts. This is where new symbols should be added, and the default font maintained. Within __default__ there are three subdirectories:
- 12x18
- 24x36
- 36x54

The naming of these subdirectories indicate the pixel size per character of the images contained within. This directory structure must be adhered to within new fonts. The default font should not be renamed, and should always contain all font symbols required for the master release of INAV.

**12x18 was** was requested by Walksnail. But does not appear to be used.
**24x36** is used by Avatar and HDZero.
**36x54** is used by Avatar and WTF OS.

### Creating a new font
Create a new directory within this `digital` **font root** directory. Give it the name of your font. Inside your font's directory, create the directory structure for the font sizes you wish to modify, shown above. You do not need to create all directories. If you only create one, I would recommend the `36x54` images directory. 

When you create your images, you only need to include those that you wish to change. Missing images will be pulled from the default font. All images must be PNG files with transparency (RGBA). Avatar and WTF OS use the Alpha channel for transparency in the OSD. HDZero uses an RGB(127, 127, 127) grey background. But this is added automatically by the tool. Therefore, only create characters with Alpha transparency, as they can be used on all three systems.

Once you have created your images. Use the HD OSD Font Tool to generate the images files used by your chosen firmware.
