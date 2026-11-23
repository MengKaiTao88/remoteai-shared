import type { RemoteComposerCatalog } from '../composerCatalog';

const CATALOG_TTL_MS = 45_000;
const MAX_SCOPES = 12;

interface Entry { result: Promise<RemoteComposerCatalog>; expires: number }

export class ComposerCatalogCache {
  private generation = -1;
  private readonly entries = new Map<string, Entry>();

  read(generation: number, key: string, load: () => Promise<RemoteComposerCatalog>) {
    if (generation !== this.generation) {
      this.generation = generation;
      this.entries.clear();
    }
    const previous = this.entries.get(key);
    if (previous && Date.now() < previous.expires) return previous.result;
    const entry = { result: load(), expires: Infinity };
    this.entries.delete(key);
    this.entries.set(key, entry);
    if (this.entries.size > MAX_SCOPES) this.entries.delete(this.entries.keys().next().value!);
    const discard = () => { if (this.entries.get(key) === entry) this.entries.delete(key); };
    void entry.result.then(result => {
      if (result.pluginsError || result.data.some(group => group.errors.length)) discard();
      else entry.expires = Date.now() + CATALOG_TTL_MS;
    }, discard);
    return entry.result;
  }
}
