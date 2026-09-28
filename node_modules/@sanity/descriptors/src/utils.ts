export function arrayEquals(arr1: Uint8Array | number[], arr2: Uint8Array | number[]) {
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] != arr2[i]) return false
  }

  return true
}

export function arrayCompare(arr1: Uint8Array | number[], arr2: Uint8Array | number[]) {
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] < arr2[i]) return -1
    if (arr1[i] > arr2[i]) return 1
  }

  return 0
}

export function arrayZero(arr: Uint8Array | number[]): boolean {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] != 0) return false
  }
  return true
}
