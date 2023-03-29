# OSD Font Files

This directory contains one directory per font. In each
directory, each character is named `%d%d%d.png`, where
the digits represent the decimal character number found
in the filename without the extension. All characters
must be in the `default` font directory. If characters 
missing from alternate font directories, the default 
version of the character will be used.

Don't alter the `.mcm` files directly, those should be
only modified by altering the `.png` files found in its
correspondant font directory.

Character map files (`.mcm`) are built from the `.png` files
in each directory representing the font, using
[max7456toool](https://github.com/fiam/max7456tool).

After changing any source `.png` files, run:

```sh
max7456tool -f generate fonts.yaml
```

to update the `.mcm` files.

Note that `.mcm` files MUST be manually regenerated with
the aforementioned command, added and committed to the
repo, while preview `.png` files (the ones contained directly
in this directory, not the ones in the source subdirectories)
MUST NOT, they're generated only for convenience to quickly
review fonts at a glance (.gitignore is set up to ignore them
to help avoid mistakes).

To add a new font, create its directory with source `.png` files,
add it to the list in `fonts.yaml` and rerun `max7456tool` to
regenerate the `.mcm`.
