import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const LOCAL_DATA_FILE = path.join(process.cwd(), 'data', 'cenarios.json');
const TMP_DATA_FILE = path.join('/tmp', 'cenarios.json');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let scenarios: any[] = [];

    // 1. Tenta ler de /tmp (serverless Vercel)
    try {
      const tmpContent = await fs.readFile(TMP_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(tmpContent);
      if (Array.isArray(parsed) && parsed.length > 0) {
        scenarios = parsed;
      }
    } catch {
      // 2. Tenta ler de LOCAL_DATA_FILE
      try {
        const localContent = await fs.readFile(LOCAL_DATA_FILE, 'utf-8');
        const parsed = JSON.parse(localContent);
        if (Array.isArray(parsed)) {
          scenarios = parsed;
        }
      } catch {
        scenarios = [];
      }
    }

    const filtered = scenarios.filter((s: any) => s.id !== id);

    // Tenta salvar localmente e em /tmp
    try {
      const localDir = path.dirname(LOCAL_DATA_FILE);
      await fs.mkdir(localDir, { recursive: true });
      await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch {
      // Ignora erro de escrita local (e.g. Vercel read-only filesystem)
    }

    try {
      await fs.writeFile(TMP_DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch {
      // Ignora erro em /tmp se houver
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao deletar' }, { status: 500 });
  }
}
