import { CenarioCompleto } from '../types/simulation';

const LOCAL_STORAGE_KEY = 'painel_pecuaria_cenarios';
const LOCAL_STORAGE_ACTIVE_ID = 'painel_pecuaria_active_cenario_id';
const LOCAL_STORAGE_BACKUPS_KEY = 'painel_pecuaria_backups';

export class StorageService {
  private static saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Obtém todos os cenários disponíveis (tenta API do servidor primeiro, com fallback para localStorage).
   */
  public static async listScenarios(): Promise<CenarioCompleto[]> {
    try {
      const res = await fetch('/api/cenarios', { method: 'GET' });
      if (res.ok) {
        const data: CenarioCompleto[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Atualiza cache local
          this.setLocalCache(data);
          return data;
        }
      }
    } catch (e) {
      console.warn('Falha ao obter cenários do servidor, usando cache local:', e);
    }

    // Fallback: localStorage
    return this.getLocalCache();
  }

  /**
   * Salva ou atualiza um cenário no servidor e no localStorage.
   */
  public static async saveScenario(cenario: CenarioCompleto): Promise<boolean> {
    const updatedCenario: CenarioCompleto = {
      ...cenario,
      dataAtualizacao: new Date().toISOString()
    };

    // Atualiza imediatamente no localStorage
    const scenarios = this.getLocalCache();
    const index = scenarios.findIndex(s => s.id === updatedCenario.id);
    if (index >= 0) {
      scenarios[index] = updatedCenario;
    } else {
      scenarios.push(updatedCenario);
    }
    this.setLocalCache(scenarios);

    // Salva no servidor via API
    try {
      const res = await fetch('/api/cenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCenario)
      });
      return res.ok;
    } catch (e) {
      console.warn('Não foi possível salvar no servidor, mantido no localStorage:', e);
      return true;
    }
  }

  /**
   * Salva com debounce para auto-salvamento sem sobrecarregar chamadas.
   */
  public static debounceAutoSave(
    cenario: CenarioCompleto,
    delayMs = 600,
    onSaved?: (success: boolean) => void
  ): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(async () => {
      const success = await this.saveScenario(cenario);
      if (onSaved) onSaved(success);
    }, delayMs);
  }

  /**
   * Duplica um cenário existente gerando um novo ID e nome.
   */
  public static async duplicateScenario(cenarioId: string): Promise<CenarioCompleto | null> {
    const scenarios = await this.listScenarios();
    const original = scenarios.find(s => s.id === cenarioId);
    if (!original) return null;

    const newId = `cenario_${Date.now()}`;
    const duplicated: CenarioCompleto = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      nome: `${original.nome} (Cópia)`,
      isBase: false,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    await this.saveScenario(duplicated);
    return duplicated;
  }

  /**
   * Remove um cenário.
   */
  public static async deleteScenario(cenarioId: string): Promise<boolean> {
    // Remove do localStorage
    let scenarios = this.getLocalCache();
    scenarios = scenarios.filter(s => s.id !== cenarioId);
    this.setLocalCache(scenarios);

    try {
      const res = await fetch(`/api/cenarios/${cenarioId}`, { method: 'DELETE' });
      return res.ok;
    } catch (e) {
      console.warn('Erro ao deletar no servidor:', e);
      return true;
    }
  }

  /**
   * Exporta o cenário como download de arquivo .json.
   */
  public static exportScenarioJSON(cenario: CenarioCompleto): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cenario, null, 2));
    const downloadAnchor = document.createElement('a');
    const safeName = cenario.nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${safeName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Importa e valida um arquivo .json de cenário.
   */
  public static importScenarioJSON(fileContent: string): CenarioCompleto {
    const parsed = JSON.parse(fileContent);
    if (!parsed || !parsed.variaveis || !parsed.fazenda) {
      throw new Error('Arquivo JSON inválido ou incompatível com a estrutura de cenários.');
    }
    // Garante ID único se já existir
    const newCenario: CenarioCompleto = {
      ...parsed,
      id: `cenario_imp_${Date.now()}`,
      nome: `${parsed.nome || 'Cenário Importado'}`,
      isBase: false,
      dataAtualizacao: new Date().toISOString()
    };
    return newCenario;
  }

  /**
   * Salva o ID do cenário ativo.
   */
  public static setActiveScenarioId(id: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID, id);
    }
  }

  /**
   * Obtém o ID do cenário ativo.
   */
  public static getActiveScenarioId(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LOCAL_STORAGE_ACTIVE_ID);
    }
    return null;
  }

  private static getLocalCache(): CenarioCompleto[] {
    if (typeof window === 'undefined') return [];
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY);
      return item ? JSON.parse(item) : [];
    } catch (e) {
      return [];
    }
  }

  private static setLocalCache(scenarios: CenarioCompleto[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scenarios));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  }
}

