"""
Builds the self-hosted fonts in public/fonts from the Fontsource packages.

Only the glyphs the site needs are kept (Russian Cyrillic, basic Latin,
Uzbek ʻ ʼ, typographic punctuation) and the weight axis is limited to
400–700. That cuts the font payload from ~230 KB to ~100 KB.

Usage (needs Python 3 and `pip install fonttools brotli`):
    npm pack @fontsource-variable/golos-text @fontsource-variable/literata
    mkdir -p /tmp/fs && for f in *.tgz; do tar -xzf "$f" -C /tmp/fs --one-top-level; done
    python3 scripts/subset-fonts.py /tmp/fs
"""

import io
import pathlib
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "fonts"

UNICODES = (
    list(range(0x20, 0x7F))  # basic Latin
    + [0xA0, 0xA9, 0xAB, 0xB7, 0xBB, 0xD7]  # nbsp © « · » ×
    + list(range(0x410, 0x450)) + [0x401, 0x451]  # А–я, Ё ё
    + [0x2BB, 0x2BC]  # Uzbek oʻ gʻ and tutuq belgisi ʼ
    + [0x2009, 0x2010, 0x2011, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x201E]
    + [0x2026, 0x202F, 0x2116, 0x2212]
)
FEATURES = ["kern", "liga", "ccmp", "locl", "rvrn", "tnum", "calt", "mark", "mkmk"]

FAMILIES = {
    # name: (package dir, file pattern, axis limits)
    "literata": (
        "fontsource-variable-literata-*",
        "literata-{subset}-opsz-normal.woff2",
        {"wght": (400, 700), "opsz": (12, 72)},
    ),
    "golos-text": (
        "fontsource-variable-golos-text-*",
        "golos-text-{subset}-wght-normal.woff2",
        {"wght": (400, 700)},
    ),
}


def build(src_root: pathlib.Path) -> None:
    for name, (package_glob, pattern, limits) in FAMILIES.items():
        package = next(src_root.glob(package_glob))
        for subset_name in ("latin", "cyrillic"):
            font = TTFont(next(package.rglob(pattern.format(subset=subset_name))))
            options = subset.Options()
            options.layout_features = FEATURES
            options.name_IDs = ["*"]
            options.notdef_outline = True
            subsetter = subset.Subsetter(options)
            subsetter.populate(unicodes=UNICODES)
            subsetter.subset(font)

            # Reload before instancing so the variation tables match the new glyph set.
            buffer = io.BytesIO()
            font.flavor = None
            font.save(buffer)
            buffer.seek(0)
            font = instancer.instantiateVariableFont(TTFont(buffer), limits)

            font.flavor = "woff2"
            target = OUT / f"{name}-{subset_name}.woff2"
            font.save(target)
            print(f"{target.relative_to(ROOT)}: {target.stat().st_size // 1024} KB")


if __name__ == "__main__":
    build(pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/fs"))
