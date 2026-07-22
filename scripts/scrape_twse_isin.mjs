import fs from 'fs/promises';

const ISSUERS = ['元大', '國泰', '富邦', '群益', '復華', '統一', '中信', '凱基', '台新', '野村', '兆豐', '永豐', '新光', '第一金', '富蘭克林', '大華', '保德信'];

function guessIssuer(name) {
  for (const issuer of ISSUERS) {
    if (name.includes(issuer)) return `${issuer}投信`;
  }
  return '其他投信';
}

async function scrapeISIN() {
  const url = 'https://isin.twse.com.tw/isin/C_public.jsp?strMode=2';
  console.log('Fetching ISIN list...');
  
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('big5'); // TWSE ISIN is Big5 encoded
  const html = decoder.decode(buffer);
  
  const etfs = [];
  
  // Find all TRs
  const trMatches = html.match(/<tr[^>]*>.*?<\/tr>/gs);
  if (!trMatches) return etfs;
  
  let currentCategory = '';
  
  for (const tr of trMatches) {
    const tdMatches = [...tr.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map(m => m[1].replace(/<[^>]+>/g, '').trim().replace(/&nbsp;/g, ''));
    
    if (tdMatches.length === 1) {
      currentCategory = tdMatches[0];
      continue;
    }
    
    if (tdMatches.length >= 6) {
      // It's a stock row
      if (currentCategory.includes('ETF') || currentCategory.includes('上市認購') || currentCategory.includes('股票')) {
        const idName = tdMatches[0];
        const [id, name] = idName.split(/\s+/); // Split by space
        
        // We only want ETF codes (starts with 00)
        if (id && id.startsWith('00') && name) {
          etfs.push({
            id,
            name,
            type: name.includes('主動') ? 'active' : 'passive', // Active ETFs usually have "主動" in name
            issuer: guessIssuer(name)
          });
        }
      }
    }
  }
  
  return etfs;
}

async function main() {
  try {
    const etfs = await scrapeISIN();
    console.log(`Found ${etfs.length} ETFs`);
    
    const uniqueEtfs = Array.from(new Map(etfs.map(item => [item.id, item])).values());
    console.log(`Unique ETFs: ${uniqueEtfs.length}`);
    
    await fs.writeFile('./data/twse_etfs.json', JSON.stringify(uniqueEtfs, null, 2), 'utf-8');
    console.log('Successfully wrote to data/twse_etfs.json');
  } catch (err) {
    console.error(err);
  }
}

main();
