# OSD Font Files

This directory contains one directory per font. In each
directory, each character is named `%d%d%d.png`, where
the digits represent the character number found in the
filename.

Don't alter the .mcm files directly, those should be
only modified by altering the .png files found in its
correspondant font directory.

Character map files (.mcm) are built from the .png files
representing the characters using
[max7456toool](https://github.com/fiam/max7456tool).

The Makefile found in this directory can be used to
re-generate all character maps. It only requires
max7456toool to be found in ${PATH}. After modifying,
deleting or altering a character .png file, just run
`make` and it will automatically rebuild the affected
character sets as well as generate a preview file
named `$charset_name.png`.

Note that .mcm files MUST be manually added and committed
to the repo, while .png files MUST NOT (.gitignore is
set up to ignore them to help avoid mistakes).
