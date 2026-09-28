import { Hash } from "sha256-uint8array";
function arrayEquals(arr1, arr2) {
  for (let i = 0; i < arr1.length; i++)
    if (arr1[i] != arr2[i]) return !1;
  return !0;
}
function arrayCompare(arr1, arr2) {
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] < arr2[i]) return -1;
    if (arr1[i] > arr2[i]) return 1;
  }
  return 0;
}
function arrayZero(arr) {
  for (let i = 0; i < arr.length; i++)
    if (arr[i] != 0) return !1;
  return !0;
}
const MULTIHASH_SHA256 = " ";
class IDEncoder {
  hash = new Hash();
  buffer = new ArrayBuffer(4);
  rewriteMap;
  uint8 = new Uint8Array(this.buffer);
  uint8_byte = new Uint8Array(this.buffer, 0, 1);
  int32 = new Int32Array(this.buffer);
  constructor(rewriteMap) {
    this.rewriteMap = rewriteMap;
  }
  encodeByte(byte) {
    this.uint8_byte[0] = byte, this.hash.update(this.uint8_byte);
  }
  encodeString(val) {
    this.hash.update(val, "utf8");
  }
  encodeInt32(val) {
    if (this.int32[0] = val, this.int32[0] !== val) throw new Error("Only 32-bit numbers can be encoded as descriptors");
    this.hash.update(this.uint8);
  }
  /**
   * Encodes a value.
   *
   * Since values can be rewritten during encoding this returns the actual value that was encoded.
   * This may be the exact same object that was passed in.
   */
  encodeValue(val) {
    const rewritten = this.rewriteMap.get(val);
    if (rewritten) {
      const result = this.encodeValue(rewritten);
      return result !== rewritten && this.rewriteMap.set(val, result), result;
    }
    if (val === null)
      return this.encodeByte(
        110
        /* NULL */
      ), val;
    if (val === !0)
      return this.encodeByte(
        116
        /* TRUE */
      ), val;
    if (val === !1)
      return this.encodeByte(
        102
        /* FALSE */
      ), val;
    if (typeof val == "string")
      return this.encodeByte(
        115
        /* STRING */
      ), this.encodeString(val), val;
    if (Array.isArray(val)) {
      let result;
      this.encodeByte(
        97
        /* ARRAY_START */
      );
      let idx = 0;
      for (const elem of val) {
        const other = this.encodeValue(elem);
        result ? result.push(other) : other !== elem && (result = val.slice(0, idx), result.push(other)), idx++;
      }
      return this.encodeByte(
        65
        /* ARRAY_END */
      ), result || val;
    } else {
      const digests = [];
      let result, idx = 0;
      const entries = Object.entries(val);
      for (const [key, field] of entries) {
        if (field === void 0) {
          idx++;
          continue;
        }
        const fieldEncoder = new IDEncoder(this.rewriteMap);
        fieldEncoder.encodeString(key);
        const fieldValue = fieldEncoder.encodeValue(field);
        if (digests.push(fieldEncoder.getDigest()), result)
          result[key] = fieldValue;
        else if (fieldValue !== field) {
          result = {};
          for (const [prevKey, prevField] of entries.slice(0, idx))
            result[prevKey] = prevField;
          result[key] = fieldValue;
        }
        idx++;
      }
      digests.sort((a, b) => arrayCompare(a, b)), this.encodeByte(
        111
        /* OBJECT_START */
      );
      for (const digest of digests)
        this.hash.update(digest);
      return this.encodeByte(
        79
        /* OBJECT_END */
      ), result || val;
    }
  }
  encodeObjectWithType(type, val) {
    const result = { type }, digests = [];
    for (const [key, field] of Object.entries(val)) {
      if (field === void 0)
        continue;
      const fieldEncoder = new IDEncoder(this.rewriteMap);
      fieldEncoder.encodeString(key), result[key] = fieldEncoder.encodeValue(field), digests.push(fieldEncoder.getDigest());
    }
    const typeEncoder = new IDEncoder(this.rewriteMap);
    typeEncoder.encodeString("type"), typeEncoder.encodeValue(type), digests.push(typeEncoder.getDigest()), digests.sort((a, b) => arrayCompare(a, b)), this.encodeByte(
      111
      /* OBJECT_START */
    );
    for (const digest of digests)
      this.hash.update(digest);
    return this.encodeByte(
      79
      /* OBJECT_END */
    ), result;
  }
  getDigest() {
    return this.hash.digest();
  }
}
function encodeBase64(data, prefix = "") {
  let binary = prefix;
  for (let i = 0; i < data.length; i++)
    binary += String.fromCharCode(data[i]);
  return "u" + globalThis.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
function encodeBase64Sha256(data) {
  return encodeBase64(data, MULTIHASH_SHA256);
}
function decodeBase64(input, into) {
  if (input[0] !== "u") throw new Error("Invalid base64");
  const binary = globalThis.atob(input.slice(1).replaceAll("-", "+").replaceAll("_", "/"));
  for (let i = 0; i < binary.length; i++)
    into[i] = binary.charCodeAt(i);
}
const EMPTY_REWRITE_MAP = /* @__PURE__ */ new Map();
function encode(type, props, options) {
  const idEncoder = new IDEncoder(options?.rewriteMap || EMPTY_REWRITE_MAP), tweakedProps = idEncoder.encodeObjectWithType(type, props), digest = idEncoder.getDigest();
  return options?.withDigest && options.withDigest(digest), { id: encodeBase64(digest, MULTIHASH_SHA256), ...tweakedProps };
}
const NUM_HASH = 3;
class SetSketch {
  arr;
  byteSize;
  numBuckets;
  constructor(byteSize, numBuckets) {
    if (numBuckets >= 31) throw new Error("numBuckets must be less than 31");
    this.byteSize = byteSize, this.numBuckets = numBuckets, this.arr = new Uint8Array(this.byteSize * this.numBuckets);
  }
  toggle(val, yieldBucket) {
    for (let k = 0; k < NUM_HASH; k++) {
      const bucket = val[k] % this.numBuckets;
      yieldBucket && yieldBucket(bucket);
      const offset = bucket * this.byteSize;
      for (let idx = 0; idx < this.byteSize; idx++)
        this.arr[offset + idx] ^= val[idx];
    }
  }
  toggleAll(other) {
    for (let i = 0; i < this.arr.length; i++)
      this.arr[i] ^= other.arr[i];
  }
  copy() {
    const result = new SetSketch(this.byteSize, this.numBuckets);
    for (let idx = 0; idx < this.arr.length; idx++)
      result.arr[idx] = this.arr[idx];
    return result;
  }
  decode() {
    const max = this.numBuckets * 2, set = new BufferSet(this.byteSize, max), queue = new BitQueue(this.numBuckets);
    let t = 0;
    for (; !queue.isEmpty(); ) {
      const bucket = queue.pop();
      if (this.looksPure(bucket)) {
        if (t >= max)
          return null;
        const offset = bucket * this.byteSize, slice = this.arr.slice(offset, offset + this.byteSize);
        set.toggle(slice), this.toggle(slice, (otherBuckets) => {
          otherBuckets !== bucket && queue.set(otherBuckets);
        }), t++;
      }
    }
    return arrayZero(this.arr) ? set : null;
  }
  looksPure(bucket) {
    const offset = bucket * this.byteSize, val = this.arr.subarray(offset, offset + this.byteSize);
    if (arrayZero(val)) return !1;
    let hashedToBucketCount = 0;
    for (let k = 0; k < NUM_HASH; k++)
      val[k] % this.numBuckets === bucket && hashedToBucketCount++;
    return hashedToBucketCount % 2 == 1;
  }
}
class BufferSet {
  arr;
  byteSize;
  length;
  capacity;
  constructor(byteSize, capacity) {
    this.arr = new Uint8Array(byteSize * capacity), this.byteSize = byteSize, this.length = 0, this.capacity = capacity;
  }
  toggle(val) {
    for (let i = 0; i < this.length; i++) {
      const start = i * this.byteSize, slice = this.arr.subarray(start, start + this.byteSize);
      if (arrayEquals(val, slice)) {
        if (i != this.length - 1) {
          const lastEntryByteIdx = (this.length - 1) * this.byteSize;
          for (let j = 0; j < this.byteSize; j++)
            slice[j] = this.arr[lastEntryByteIdx + j];
        }
        this.length--;
        return;
      }
    }
    if (this.length === this.capacity) throw new Error("BufferSet is full");
    const byteIdx = this.length * this.byteSize;
    for (let i = 0; i < this.byteSize; i++)
      this.arr[byteIdx + i] = val[i];
    this.length++;
  }
  forEach(fn) {
    for (let i = 0; i < this.length; i++) {
      const start = i * this.byteSize;
      fn(this.arr.subarray(start, start + this.byteSize));
    }
  }
  /**
   * Returns a normalized JSON representation.
   *
   * This is not optimized and should mainly be used for debugging.
   */
  toJSON() {
    const result = [];
    return this.forEach((entry) => {
      result.push(Array.from(entry));
    }), result.sort((a, b) => arrayCompare(a, b)), result;
  }
}
class BitQueue {
  bitset;
  queue;
  constructor(size) {
    this.bitset = (1 << size) - 1, this.queue = Array.from({ length: size }, (_, i) => i);
  }
  set(idx) {
    const mask = 1 << idx;
    this.bitset & mask || (this.queue.push(idx), this.bitset |= mask);
  }
  isEmpty() {
    return this.bitset === 0;
  }
  pop() {
    const idx = this.queue.shift(), mask = 1 << idx;
    return this.bitset &= ~mask, idx;
  }
}
class SetBuilder {
  objectValues = {};
  setValues = {};
  keys = [];
  sketch = new SetSketch(32, 8);
  rewriteMap;
  constructor({ rewriteMap } = {}) {
    this.rewriteMap = rewriteMap;
  }
  /**
   * Add an object to the set.
   */
  addObject(type, obj) {
    const value = encode(type, obj, {
      withDigest: (digest) => {
        this.sketch.toggle(digest);
      },
      rewriteMap: this.rewriteMap
    });
    this.objectValues[value.id] = value, this.keys.push(value.id);
  }
  /**
   * Add another set to the set.
   */
  addSet(sync) {
    this.setValues[sync.set.id] = sync, this.sketch.toggle(sync.digest), this.keys.push(sync.set.id);
  }
  build(type) {
    this.keys.sort();
    let digest;
    return {
      set: encode(
        type,
        { keys: this.keys },
        {
          withDigest: (d) => {
            digest = d;
          }
        }
      ),
      digest,
      objectValues: this.objectValues,
      setValues: this.setValues,
      sketch: this.sketch
    };
  }
}
function processSetSynchronization(sync, prevResult) {
  const id = sync.set.id;
  if (!prevResult) return { id };
  if (prevResult.type === "complete") return null;
  const descriptors = [];
  for (const missingId of prevResult.missingIds) {
    const descriptor = findDescriptor(sync, missingId);
    if (!descriptor) throw new Error("Synchronization server is requested an unknonwn descriptor");
    descriptors.push(descriptor);
  }
  return { id, descriptors };
}
function findDescriptor(sync, id) {
  if (sync.set.id === id) return sync.set;
  const desc = sync.objectValues[id];
  if (desc) return desc;
  for (const child of Object.values(sync.setValues)) {
    const childDesc = findDescriptor(child, id);
    if (childDesc) return childDesc;
  }
  return null;
}
export {
  SetBuilder,
  SetSketch,
  decodeBase64,
  encode,
  encodeBase64,
  encodeBase64Sha256,
  processSetSynchronization
};
//# sourceMappingURL=index.js.map
