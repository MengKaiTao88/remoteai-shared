const VISIBLE_FRACTION = 0.5;

interface Bounds { top: number; bottom: number; left: number; right: number }
interface Target {
  node: HTMLElement;
  changed: (visible: boolean) => void;
  ancestors: HTMLElement[];
  visible?: boolean;
  threshold?: number;
  intersection?: IntersectionObserver;
}

const documents = new WeakMap<Document, GroupReadVisibility>();

function ancestorsOf(node: HTMLElement) {
  const ancestors: HTMLElement[] = [];
  for (let parent = node.parentElement; parent; parent = parent.parentElement) ancestors.push(parent);
  return ancestors;
}

function clipBounds(node: HTMLElement, bounds: Bounds) {
  const style = getComputedStyle(node);
  const clipsX = style.overflowX !== 'visible';
  const clipsY = style.overflowY !== 'visible';
  if (!clipsX && !clipsY) return bounds;
  const rect = node.getBoundingClientRect();
  const scaleX = node.offsetWidth ? rect.width / node.offsetWidth : 1;
  const scaleY = node.offsetHeight ? rect.height / node.offsetHeight : 1;
  const left = rect.left + node.clientLeft * scaleX;
  const top = rect.top + node.clientTop * scaleY;
  return {
    left: clipsX ? Math.max(bounds.left, left) : bounds.left,
    right: clipsX ? Math.min(bounds.right, left + node.clientWidth * scaleX) : bounds.right,
    top: clipsY ? Math.max(bounds.top, top) : bounds.top,
    bottom: clipsY ? Math.min(bounds.bottom, top + node.clientHeight * scaleY) : bounds.bottom,
  };
}

/** Event driven and shared by all bubbles: no idle polling or threshold grids. */
class GroupReadVisibility {
  private targets = new Set<Target>();
  private pending = new Set<Target>();
  private resized = new Map<Element, Set<Target>>();
  private frame?: number;
  private resize = new ResizeObserver(entries => {
    for (const entry of entries) this.resized.get(entry.target)?.forEach(this.schedule);
  });

  constructor(private document: Document, private window: Window) {
    document.addEventListener('scroll', this.scheduleAll, { capture: true, passive: true });
    window.addEventListener('resize', this.scheduleAll);
    window.visualViewport?.addEventListener('resize', this.scheduleAll);
    window.visualViewport?.addEventListener('scroll', this.scheduleAll);
  }

  observe(node: HTMLElement, changed: Target['changed']) {
    const target: Target = { node, changed, ancestors: ancestorsOf(node) };
    this.targets.add(target);
    for (const element of [node, ...target.ancestors]) {
      let targets = this.resized.get(element);
      if (!targets) {
        targets = new Set(); this.resized.set(element, targets); this.resize.observe(element);
      }
      targets.add(target);
    }
    this.schedule(target);
    return () => this.remove(target);
  }

  private schedule = (target: Target) => {
    if (!this.targets.has(target)) return;
    this.pending.add(target);
    this.frame ??= this.window.requestAnimationFrame(this.measure);
  };
  private scheduleAll = () => { this.targets.forEach(this.schedule); };

  private measure = () => {
    this.frame = undefined;
    const viewport = this.window.visualViewport;
    const bounds = { left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0,
      right: (viewport?.offsetLeft ?? 0) + (viewport?.width ?? this.document.documentElement.clientWidth),
      bottom: (viewport?.offsetTop ?? 0) + (viewport?.height ?? this.document.documentElement.clientHeight) };
    const cache = new Map<HTMLElement, Bounds>();
    for (const target of this.pending) this.measureTarget(target, bounds, cache);
    this.pending.clear();
  };

  private measureTarget(target: Target, viewport: Bounds, cache: Map<HTMLElement, Bounds>) {
    let bounds = viewport;
    for (const ancestor of [...target.ancestors].reverse()) {
      let clipped = cache.get(ancestor);
      if (!clipped) { clipped = clipBounds(ancestor, bounds); cache.set(ancestor, clipped); }
      bounds = clipped;
    }
    const rect = target.node.getBoundingClientRect();
    const width = Math.max(0, Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left));
    const height = Math.max(0, Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top));
    const required = Math.min(rect.height, Math.max(0, bounds.bottom - bounds.top)) * VISIBLE_FRACTION;
    const visible = width > 0 && required > 0 && height >= required;
    if (target.visible !== visible) { target.visible = visible; target.changed(visible); }
    // Catch layout shifts even when no scroll event or observed element resize occurs.
    // Area is used only to wake a measurement; the read decision always uses visible height.
    const area = rect.width * rect.height;
    const threshold = area > 0 ? Math.min(1, required * width / area) : 0;
    if (target.threshold === threshold) return;
    target.threshold = threshold;
    target.intersection?.disconnect();
    target.intersection = new IntersectionObserver(() => this.schedule(target), { threshold });
    target.intersection.observe(target.node);
  }

  private remove(target: Target) {
    target.intersection?.disconnect();
    this.pending.delete(target); this.targets.delete(target);
    for (const element of [target.node, ...target.ancestors]) {
      const targets = this.resized.get(element);
      targets?.delete(target);
      if (!targets?.size) { this.resize.unobserve(element); this.resized.delete(element); }
    }
    if (this.targets.size) return;
    if (this.frame !== undefined) this.window.cancelAnimationFrame(this.frame);
    this.resize.disconnect();
    this.document.removeEventListener('scroll', this.scheduleAll, true);
    this.window.removeEventListener('resize', this.scheduleAll);
    this.window.visualViewport?.removeEventListener('resize', this.scheduleAll);
    this.window.visualViewport?.removeEventListener('scroll', this.scheduleAll);
    documents.delete(this.document);
  }
}

export function observeGroupReadVisibility(node: HTMLElement, changed: Target['changed']) {
  const document = node.ownerDocument;
  const window = document.defaultView;
  if (!window) return () => {};
  let observer = documents.get(document);
  if (!observer) { observer = new GroupReadVisibility(document, window); documents.set(document, observer); }
  return observer.observe(node, changed);
}
