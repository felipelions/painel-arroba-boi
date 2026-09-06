import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'cenarios.json');

async function getScenariosFromFile() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

async function saveScenariosToFile(scenarios: any[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(scenarios, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erro ao salvar cenarios.json:', error);
    return false;
  }
}

export async function GET() {
  const scenarios = await getScenariosFromFile();
  return NextResponse.json(scenarios);
}

export async function POST(req: NextRequest) {
  try {
    const newScenario = await req.json();
    if (!newScenario || !newScenario.id) {
      return NextResponse.json({ error: 'Cenário inválido' }, { status: 400 });
    }

    const scenarios = await getScenariosFromFile();
    const index = scenarios.findIndex((s: any) => s.id === newScenario.id);

    if (index >= 0) {
      scenarios[index] = newScenario;
    } else {
      scenarios.push(newScenario);
    }

    await saveScenariosToFile(scenarios);
    return NextResponse.json({ success: true, scenario: newScenario });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

