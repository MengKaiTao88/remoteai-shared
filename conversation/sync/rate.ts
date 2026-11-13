/** Single-flight chunk pacing. Direct paths never inherit a Relay budget. */
export class SyncRelayRate {
  private next = 0;
  constructor(private readonly now = () => performance.now(),
    private readonly sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))) {}

  async wait(bytes: number, options: { direct: () => boolean; kibPerSecond: () => number }) {
    if (options.direct()) { this.next = 0; return; }
    const rate = options.kibPerSecond() * 1024;
    this.next = Math.max(this.next, this.now()) + bytes / rate * 1000;
    while (!options.direct() && this.now() < this.next) {
      await this.sleep(Math.min(50, this.next - this.now()));
    }
    if (options.direct()) this.next = 0;
  }
}
