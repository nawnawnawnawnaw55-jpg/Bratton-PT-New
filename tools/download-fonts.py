import requests, re, os

WEIGHTS = [600, 700, 800]
FONTDIR = os.path.join('files', 'fonts')
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'}

os.makedirs(FONTDIR, exist_ok=True)

for weight in WEIGHTS:
    # Request one weight at a time to guarantee correct file per weight
    url = f'https://fonts.googleapis.com/css2?family=Montserrat:wght@{weight}'
    print(f'Requesting CSS for weight {weight}: {url}')
    css_resp = requests.get(url, headers=HEADERS)
    css = css_resp.text

    # Extract the woff2 URL from the @font-face block
    url_match = re.search(r'url\((https://fonts\.gstatic\.com/s/montserrat/[^)]+\.woff2)\)', css)
    if not url_match:
        print(f'  ERROR: Could not find woff2 URL in CSS response for weight {weight}')
        print(f'  CSS was: {css[:500]}')
        continue

    font_url = url_match.group(1)
    fname = f'montserrat-{weight}-latin.woff2'
    fpath = os.path.join(FONTDIR, fname)

    print(f'  Downloading from: {font_url}')
    font_resp = requests.get(font_url, headers=HEADERS)
    with open(fpath, 'wb') as f:
        f.write(font_resp.content)

    size_kb = len(font_resp.content) / 1024
    print(f'  Saved {fpath} ({size_kb:.1f} KB)')

print('Done!')