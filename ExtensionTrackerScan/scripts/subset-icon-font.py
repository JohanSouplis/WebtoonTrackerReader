import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

if len(sys.argv) != 4:
    sys.exit(
        'usage: python3 subset-icon-font.py <MaterialSymbolsRounded.woff2> <out.woff2> <icon,icon,...>'
    )

source, target, icon_list = sys.argv[1:]
font = TTFont(source)
cmap = font.getBestCmap()
ligatures = {}
for lookup in font['GSUB'].table.LookupList.Lookup:
    for table in lookup.SubTable:
        table = getattr(table, 'ExtSubTable', table)
        for first, entries in getattr(table, 'ligatures', {}).items():
            for entry in entries:
                ligatures[(first, *entry.Component)] = entry.LigGlyph

icons = {
    name: ligatures.get(tuple(cmap[ord(char)] for char in name))
    for name in icon_list.split(',')
}
missing = [name for name, glyph in icons.items() if glyph is None]
if missing:
    sys.exit(f'unknown icons: {missing}')

glyph_names = set(font.getGlyphOrder())
options = subset.Options()
options.layout_features = ['*']
options.layout_closure = False
options.notdef_outline = True
options.flavor = 'woff2'
subsetter = subset.Subsetter(options)
subsetter.populate(
    glyphs=[
        name
        for glyph in set(icons.values())
        for name in (glyph, f'{glyph}.fill')
        if name in glyph_names
    ],
    text='abcdefghijklmnopqrstuvwxyz_0123456789',
)
subsetter.subset(font)
font = instancer.instantiateVariableFont(font, {'wght': 400, 'opsz': 24})
font.flavor = 'woff2'
font.save(target)
print(f'{target}: {len(font.getGlyphOrder())} glyphs')
