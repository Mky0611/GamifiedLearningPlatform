#!/usr/bin/env python3
"""Read-only sprite-sheet alpha bbox auditor. Requires pip install pillow."""
from pathlib import Path
import sys
try:
    from PIL import Image
except ImportError:
    print('Install Pillow: python -m pip install pillow');raise SystemExit(2)
if len(sys.argv)!=2:
    print('Usage: python audit_pixel_assets.py <GamifiedLearningPlatform-root>');raise SystemExit(2)
base=Path(sys.argv[1])/'src/main/resources/FrontEnd/assets/units'
for folder in ['warrior','archer','lancer/normalized']:
    for state in ['idle','run','attack','guard']:
        file=base/folder/(state+'.png')
        if not file.exists():continue
        with Image.open(file) as im:
            im=im.convert('RGBA');n=im.width//192 if im.height==192 and im.width%192==0 else 1
            print('\n',folder,state,'sheet size',im.size,'frame count',n)
            for i in range(n):
                x0=i*192 if n>1 else 0
                f=im.crop((x0,0,x0+192,192)) if n>1 else im
                b=f.getchannel('A').getbbox()
                print(f' frame {i:02d}: alpha bbox={b}, estimated visual bottom={b[3] if b else None}')
