# Avatar HD System fonts

These font character images are for use with the Walksnail/Caddx/Fat Shark Avatar HD system. These are the master images for editing, adding new symbols, or deriving alternate fonts from. Use https://github.com/MrD-RC/avatar-font-tool to compile these font character images in to a file for use with the Avatar system.

## Use
This is the **font root** directory. The __default__ subdirectory contains the default INAV HD fonts. This is where new symbols should be added, and the default font maintained. Within __default__ there are three subdirectories:
- 12x18
- 24x36
- 36x54

The naming of these subdirectories indicate the pixel size per character of the images contained within. This directory structure must be adhered to within new fonts. The default font should not be renamed, and should always contain all font symbols required for the master release of INAV.

### Creating a new font
Create a new directory within this `avatar` **font root** directory. Give it the name of your font. Inside your font's directory, create the directory structure for the font sizes you wish to modify, shown above. You do not need to create all directories. If you only create one, I would recommend the `36x54` images directory. 

When you create your images, you only need to include those that you wish to change. Missing images will be pulled from the default font. All images must be PNG files with transparency (RGBA). Avatar uses the Alpha channel for transparency in the OSD.

Once you have created your images. Use the Avatar Font Tool to generate the images files used by the Avatar firmware.