import { reactive, toRaw } from "./reactive";
import { TrackOpTypes, TriggerOpTypes } from "./operations";
import { track, trigger, ITERATE_KEY } from "./effect";
import { isObject, hasOwn, hasChanged, isArray } from "@wfatec/shared";

const get = /*#__PURE__*/ createGetter();

function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object) {
    const targetIsArray = isArray(target);

    const res = Reflect.get(target, key, receiver);

    track(target, TrackOpTypes.GET, key);

    if (isObject(res)) {
      // Convert returned value into a proxy as well. we do the isObject check
      // here to avoid invalid value warning. Also need to lazy access readonly
      // and reactive here to avoid circular dependency.
      return reactive(res);
    }

    return res;
  };
}

const set = /*#__PURE__*/ createSetter();

function createSetter(shallow = false) {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    const oldValue = (target as any)[key];
    const hadKey = hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value);
      }
    }
    return result;
  };
}

function deleteProperty(target: object, key: string | symbol): boolean {
  const hadKey = hasOwn(target, key);
  const oldValue = (target as any)[key];
  const result = Reflect.deleteProperty(target, key);
  if (result && hadKey) {
    trigger(target, TriggerOpTypes.DELETE, key, undefined);
  }
  return result;
}

function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key);
  track(target, TrackOpTypes.HAS, key);
  return result;
}

function ownKeys(target: object): (string | number | symbol)[] {
  track(target, TrackOpTypes.ITERATE, ITERATE_KEY);
  return Reflect.ownKeys(target);
}

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys,
};
