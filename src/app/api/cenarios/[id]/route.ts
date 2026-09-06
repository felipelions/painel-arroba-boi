import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'cenarios.json');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let scenarios: any[] = [];
    try {
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      scenarios = JSON.parse(content);
    } catch {
      return NextResponse.json({ success: true });
    }

    const filtered = scenarios.filter((s: any) => s.id !== id);
    await fs.writeFile(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

