import { isArray } from "@wfatec/shared";
import { TrackOpTypes, TriggerOpTypes } from "./operations";

// The main WeakMap that stores {target -> key -> dep} connections.
// Conceptually, it's easier to think of a dependency as a Dep class
// which maintains a Set of subscribers, but we simply store them as
// raw Sets to reduce memory overhead.
type Dep = Set<ReactiveEffect>;
type KeyToDepMap = Map<any, Dep>;
const targetMap = new WeakMap<any, KeyToDepMap>();

export interface ReactiveEffect<T = any> {
  (...args: any[]): T;
  _isEffect: true;
  id: number;
  active: boolean;
  raw: () => T;
  deps: Array<Dep>;
  options: ReactiveEffectOptions;
}

export interface ReactiveEffectOptions {
  lazy?: boolean;
  computed?: boolean;
  scheduler?: (job: ReactiveEffect) => void;
  onTrack?: (event: DebuggerEvent) => void;
  onTrigger?: (event: DebuggerEvent) => void;
  onStop?: () => void;
}

export type DebuggerEvent = {
  effect: ReactiveEffect;
  target: object;
  type: TrackOpTypes | TriggerOpTypes;
  key: any;
} & DebuggerEventExtraInfo;

export interface DebuggerEventExtraInfo {
  newValue?: any;
  oldValue?: any;
  oldTarget?: Map<any, any> | Set<any>;
}

const effectStack: ReactiveEffect[] = [];
let activeEffect: ReactiveEffect | undefined;

export const ITERATE_KEY = Symbol("");
export const MAP_KEY_ITERATE_KEY = Symbol("");

export function isEffect(fn: any): fn is ReactiveEffect {
  return fn && fn._isEffect === true;
}

export function effect<T = any>(fn: () => T): ReactiveEffect<T> {
  if (isEffect(fn)) {
    fn = fn.raw;
  }
  const effect = createReactiveEffect(fn);
  effect();
  return effect;
}

let uid = 0;

function createReactiveEffect<T = any>(
  fn: (...args: any[]) => T,
): ReactiveEffect<T> {
  const effect = function reactiveEffect(...args: unknown[]): unknown {
    if (!effect.active) {
      fn(...args);
    }
    if (!effectStack.includes(effect)) {
      cleanup(effect);
      try {
        enableTracking();
        effectStack.push(effect);
        activeEffect = effect;
        return fn(...args);
      } finally {
        effectStack.pop();
        resetTracking();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  } as ReactiveEffect;
  effect.id = uid++;
  effect._isEffect = true;
  effect.active = true;
  effect.raw = fn;
  effect.deps = [];
  return effect;
}

function cleanup(effect: ReactiveEffect) {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}

let shouldTrack = true;
const trackStack: boolean[] = [];

export function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}

export function enableTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = true;
}

export function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === undefined ? true : last;
}

export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!shouldTrack || activeEffect === undefined) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // never been tracked
    return;
  }

  const effects = new Set<ReactiveEffect>();
  const add = (effectsToAdd: Set<ReactiveEffect> | undefined) => {
    if (effectsToAdd) {
      effectsToAdd.forEach((effect) => {
        if (effect !== activeEffect || !shouldTrack) {
          effects.add(effect);
        }
      });
    }
  };

  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared
    // trigger all effects for target
    depsMap.forEach(add);
  } else if (key === "length" && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === "length" || key >= (newValue as number)) {
        add(dep);
      }
    });
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      add(depsMap.get(key));
    }
    // also run for iteration key on ADD | DELETE | Map.SET
    const isAddOrDelete =
      type === TriggerOpTypes.ADD ||
      (type === TriggerOpTypes.DELETE && !isArray(target));
    if (
      isAddOrDelete ||
      (type === TriggerOpTypes.SET && target instanceof Map)
    ) {
      add(depsMap.get(isArray(target) ? "length" : ITERATE_KEY));
    }
    if (isAddOrDelete && target instanceof Map) {
      add(depsMap.get(MAP_KEY_ITERATE_KEY));
    }
  }

  const run = (effect: ReactiveEffect) => {
    effect();
  };

  effects.forEach(run);
}
