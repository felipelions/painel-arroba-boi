#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import * as XLSX from 'xlsx';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../public/data');

console.log('🐂 Iniciando build de dados CEPEA + CotacaoDoDia...\n');

// Garante que o diretório de dados existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 1. Download Zenodo CEPEA
async function downloadCepeaHistorico() {
  console.log('📥 Baixando histórico CEPEA do Zenodo...');
  const url = 'https://zenodo.org/api/records/12163228/files/id_03_orig.xls/content';
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Processar dados CEPEA
    const headers = jsonData[0];
    const rows = jsonData.slice(1);
    
    const cepeaData = rows
      .filter(row => row.length > 0 && row[0])
      .map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      })
      .filter(item => item.Data)
      .map(item => ({
        data: formatDate(item.Data),
        valor: parseFloat(item['Valor'] || item['Preco'] || 0),
        fonte: 'CEPEA',
        tipo: item['Tipo'] || 'Boi Gordo',
        uf: item['UF'] || item['Estado'] || 'SP',
        praca: item['Praça'] || item['Praca'] || 'São Paulo'
      }));
    
    console.log(`✅ CEPEA: ${cepeaData.length} registros processados`);
    return cepeaData;
  } catch (error) {
    console.error('❌ Erro ao baixar CEPEA:', error.message);
    return [];
  }
}

// 2. Scrape CotacaoDoDia
async function scrapeCotacaoDoDia() {
  console.log('\n🕷️  Scraping cotacaododia.com (2023-07 em diante)...');
  const startDate = new Date('2023-07-01');
  const endDate = new Date();
  const data = [];
  
  const months = [
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  
  let currentDate = new Date(startDate);
  let processedCount = 0;
  
  while (currentDate <= endDate) {
    const month = months[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    const url = `https://www.cotacaododia.com/boi-gordo/historico/${month}-${year}/`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DataCollector/1.0)'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extrair dados da tabela de histórico
        $('.historico-table tbody tr, table.table tbody tr, .table-data tr').each((_, row) => {
          const cols = $(row).find('td');
          if (cols.length >= 2) {
            const dataText = $(cols[0]).text().trim();
            const valorText = $(cols[1]).text().trim();
            
            if (dataText && valorText) {
              const valor = parseFloat(valorText.replace(/[^\d,.-]/g, '').replace(',', '.'));
              if (!isNaN(valor) && valor > 0) {
                data.push({
                  data: dataText,
                  valor,
                  fonte: 'CotacaoDoDia',
                  tipo: 'Boi Gordo',
                  uf: $(cols[2])?.text().trim() || 'SP',
                  praca: 'Nacional'
                });
              }
            }
          }
        });
        
        processedCount++;
        process.stdout.write(`\r   Processado: ${month}/${year} (${processedCount} meses)`);
      }
    } catch (error) {
      // Silenciosamente ignora erros individuais
    }
    
    // Próximo mês
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  console.log(`\n✅ CotacaoDoDia: ${data.length} registros coletados`);
  return data;
}

// Formata data para padrão YYYY-MM-DD
function formatDate(input) {
  if (!input) return '';
  
  // Se já é uma data Excel (número)
  if (typeof input === 'number') {
    const date = XLSX.SSF.parse_date_code(input);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  
  // Se é string DD/MM/YYYY
  if (typeof input === 'string' && input.includes('/')) {
    const [day, month, year] = input.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return input.toString();
}

// Build principal
async function main() {
  const startTime = Date.now();
  
  // Baixar ambas as fontes
  const cepeaData = await downloadCepeaHistorico();
  const cotacaoData = await scrapeCotacaoDoDia();
  
  // Combinar e ordenar
  const allData = [...cepeaData, ...cotacaoData].sort((a, b) => 
    a.data.localeCompare(b.data)
  );
  
  // Gerar snapshot com estatísticas
  const snapshot = {
    geradoEm: new Date().toISOString(),
    totalRegistros: allData.length,
    fontes: {
      CEPEA: cepeaData.length,
      CotacaoDoDia: cotacaoData.length
    },
    periodoInicio: allData[0]?.data,
    periodoFim: allData[allData.length - 1]?.data,
    valorMinimo: Math.min(...allData.map(d => d.valor).filter(v => v > 0)),
    valorMaximo: Math.max(...allData.map(d => d.valor)),
    valorMedio: allData.reduce((sum, d) => sum + d.valor, 0) / allData.length
  };
  
  // Salvar arquivos
  fs.writeFileSync(
    path.join(DATA_DIR, 'cepea-historico.json'),
    JSON.stringify(allData, null, 2)
  );
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'snapshot.json'),
    JSON.stringify(snapshot, null, 2)
  );
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n✨ Build concluído com sucesso!\n');
  console.log(`📊 Estatísticas:`);
  console.log(`   Total: ${allData.length.toLocaleString('pt-BR')} registros`);
  console.log(`   Período: ${snapshot.periodoInicio} a ${snapshot.periodoFim}`);
  console.log(`   Valor médio: R$ ${snapshot.valorMedio.toFixed(2)}/@`);
  console.log(`   Tempo: ${elapsed}s\n`);
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});