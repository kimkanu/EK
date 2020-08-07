export default class SortedMap<K, V> {
  keyList: K[];

  innerMap: Map<K, V>;

  changeHandlers: Map<string, () => void> = new Map();

  constructor(public sorter: (a: V, b: V) => number, elements: [K, V][] = []) {
    this.keyList = elements.sort(([, a], [, b]) => sorter(a, b)).map(([k]) => k);
    this.innerMap = new Map(elements);
  }

  private sort(): void {
    this.keyList = Array.from(new Set(this.keyList));
    this.keyList = this.keyList.sort((a, b) => this.sorter(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.innerMap.get(a)!, this.innerMap.get(b)!,
    ));
  }

  onChange(): void {
    this.changeHandlers.forEach((handler) => {
      handler();
    });
  }

  has(key: K): boolean {
    return this.keyList.includes(key);
  }

  set(key: K, value: V): V | undefined {
    const oldValue = this.innerMap.get(key);
    this.keyList.push(key);
    this.innerMap.set(key, value);
    this.sort();
    this.onChange();
    return oldValue;
  }

  setMultiple(data: [K, V][]): void {
    this.keyList.push(...data.map(([k]) => k));
    data.forEach(([k, v]) => {
      this.innerMap.set(k, v);
    });
    this.sort();
    this.onChange();
  }

  get(key: K): V | undefined {
    return this.innerMap.get(key);
  }

  delete(key: K): boolean {
    this.keyList = this.keyList.filter((k) => k !== key);
    const res = this.innerMap.delete(key);
    this.onChange();
    return res;
  }

  toArray(): [K, V][] {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.keyList.map((key) => [key, this.innerMap.get(key)!]);
  }

  forEach(callbackfn: (value: V, key: K) => void): void {
    this.innerMap.forEach(callbackfn);
  }

  forEachAsync(callbackfn: (value: V, key: K) => Promise<void>): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Promise.all(this.keyList.map((key) => callbackfn(this.innerMap.get(key)!, key)));
  }
}
