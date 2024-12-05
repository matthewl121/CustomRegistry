export let ArrayFrom: {
    <T>(arrayLike: ArrayLike<T>): T[];
    <T, U>(arrayLike: ArrayLike<T>, mapfn: (v: T, k: number) => U, thisArg?: any): U[];
    <T>(iterable: Iterable<T> | ArrayLike<T>): T[];
    <T, U>(iterable: Iterable<T> | ArrayLike<T>, mapfn: (v: T, k: number) => U, thisArg?: any): U[];
};
export let ArrayIsArray: (arg: any) => arg is any[];
export function ArrayPrototypeShift(obj: any): any;
export function ArrayPrototypeForEach(arr: any, ...rest: any[]): void;
export function ArrayPrototypeIncludes(arr: any, ...rest: any[]): boolean;
export function ArrayPrototypeJoin(arr: any, ...rest: any[]): string;
export function ArrayPrototypePop(arr: any, ...rest: any[]): any;
export function ArrayPrototypePush(arr: any, ...rest: any[]): number;
export let FunctionPrototype: Function;
export let JSONParse: (text: string, reviver?: (this: any, key: string, value: any) => any) => any;
export let JSONStringify: {
    (value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string;
    (value: any, replacer?: (number | string)[] | null, space?: string | number): string;
};
export let ObjectFreeze: {
    <T extends Function>(f: T): T;
    <T extends {
        [idx: string]: U | null | undefined | object;
    }, U extends string | bigint | number | boolean | symbol>(o: T): Readonly<T>;
    <T>(o: T): Readonly<T>;
};
export let ObjectKeys: {
    (o: object): string[];
    (o: {}): string[];
};
export let ObjectGetOwnPropertyNames: (o: any) => string[];
export let ObjectDefineProperty: <T>(o: T, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => T;
export function ObjectPrototypeHasOwnProperty(obj: any, prop: any): boolean;
export function RegExpPrototypeExec(obj: any, string: any): RegExpExecArray | null;
export function RegExpPrototypeTest(obj: any, string: any): boolean;
export function RegExpPrototypeSymbolReplace(obj: any, ...rest: any[]): string;
export let SafeMap: MapConstructor;
export let SafeSet: SetConstructor;
export let SafeWeakMap: WeakMapConstructor;
export function StringPrototypeEndsWith(str: any, ...rest: any[]): boolean;
export function StringPrototypeIncludes(str: any, ...rest: any[]): boolean;
export function StringPrototypeLastIndexOf(str: any, ...rest: any[]): number;
export function StringPrototypeIndexOf(str: any, ...rest: any[]): number;
export function StringPrototypeRepeat(str: any, ...rest: any[]): string;
export function StringPrototypeReplace(str: any, ...rest: any[]): string;
export function StringPrototypeSlice(str: any, ...rest: any[]): string;
export function StringPrototypeSplit(str: any, ...rest: any[]): string[];
export function StringPrototypeStartsWith(str: any, ...rest: any[]): boolean;
export function StringPrototypeSubstr(str: any, ...rest: any[]): string;
export function StringPrototypeCharCodeAt(str: any, ...rest: any[]): number;
export function StringPrototypeMatch(str: any, ...rest: any[]): RegExpMatchArray | null;
export let SyntaxError: SyntaxErrorConstructor;
//# sourceMappingURL=node-primordials.d.ts.map