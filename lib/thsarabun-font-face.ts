type FontVariant = {
  url: string;
  weight: 'normal' | 'bold';
  style: 'normal' | 'italic';
};

const TH_SARABUN_VARIANTS: FontVariant[] = [
  { url: '/fonts/THSarabun.ttf', weight: 'normal', style: 'normal' },
  { url: '/fonts/THSarabun Bold.ttf', weight: 'bold', style: 'normal' },
  { url: '/fonts/THSarabun Italic.ttf', weight: 'normal', style: 'italic' },
  { url: '/fonts/THSarabun BoldItalic.ttf', weight: 'bold', style: 'italic' },
];

let embedCSSPromise: Promise<string> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize))
    );
  }

  return btoa(binary);
}

async function loadFontAsDataURL(fontUrl: string): Promise<string> {
  const response = await fetch(fontUrl, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Failed to load font: ${fontUrl}`);
  }

  const fontBuffer = await response.arrayBuffer();
  return `data:font/ttf;base64,${arrayBufferToBase64(fontBuffer)}`;
}

export function getTHSarabunFontEmbedCSS(): Promise<string> {
  if (!embedCSSPromise) {
    embedCSSPromise = Promise.all(
      TH_SARABUN_VARIANTS.map(async (variant) => {
        const dataURL = await loadFontAsDataURL(variant.url);
        return `
@font-face {
  font-family: 'THSarabun';
  src: url('${dataURL}') format('truetype');
  font-weight: ${variant.weight};
  font-style: ${variant.style};
}
`;
      })
    ).then((rules) => rules.join('\n'));
  }

  return embedCSSPromise;
}
