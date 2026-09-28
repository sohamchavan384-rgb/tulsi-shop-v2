import { etc, hashes, sign } from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
function base64ToBytes(base64) {
  if (typeof Buffer < "u")
    return new Uint8Array(Buffer.from(base64, "base64"));
  const bin = atob(base64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function bytesToBase64(bytes) {
  if (typeof Buffer < "u")
    return Buffer.from(bytes).toString("base64");
  const bin = String.fromCharCode(...bytes);
  return btoa(bin);
}
function ed25519SeedFromPkcs8(der) {
  for (let i = der.length - 34; i >= 0; i--)
    if (der[i] === 4 && der[i + 1] === 32)
      return der.subarray(i + 2, i + 2 + 32);
  throw new Error("Ed25519 32-byte seed not found in PKCS#8");
}
function extractPemContents(pem) {
  return pem.replace(/^-----BEGIN [^-]+-----$/gim, "").replace(/^-----END [^-]+-----$/gim, "").replace(/\s+/g, "");
}
function lexographicSort(a, b) {
  const [keyA, valueA] = a, [keyB, valueB] = b;
  return keyA < keyB ? -1 : keyA > keyB ? 1 : valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
}
function normalizeBase64Url(base64) {
  return base64.replace(/\+/g, "-").replace(/\//g, "_");
}
function normalizeExpiry(expiry) {
  let date;
  if (expiry instanceof Date)
    date = expiry;
  else if (date = new Date(expiry), isNaN(date.getTime()))
    throw new Error("Invalid expiry date format");
  const now = /* @__PURE__ */ new Date();
  if (date.getTime() <= now.getTime())
    throw new Error("Expiry date must be in the future");
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}
function rfc3986(str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}
function toBase64UrlWithPadding(bytes) {
  let b64 = bytesToBase64(bytes);
  return b64.length % 4 && (b64 += "=".repeat(4 - b64.length % 4)), normalizeBase64Url(b64);
}
function pemToEd25519Bytes(pem) {
  const der = base64ToBytes(extractPemContents(pem));
  return ed25519SeedFromPkcs8(der);
}
function pemToEd25519Hex(pem) {
  return etc.bytesToHex(pemToEd25519Bytes(pem));
}
hashes.sha512 = sha512;
function extractUserParams(url) {
  const reservedKeys = ["keyid", "expiry", "signature"];
  return Array.from(url.searchParams).reduce((params, param) => {
    const key = param[0];
    return reservedKeys.includes(key) || params.push(param), params;
  }, []);
}
function generateSignature(url, privateKey) {
  const urlBytes = new TextEncoder().encode(url), privateKeyBytes = etc.hexToBytes(privateKey), signatureBytes = sign(urlBytes, privateKeyBytes);
  return toBase64UrlWithPadding(signatureBytes);
}
function getCanonicalQuery(params) {
  const encodedParams = params.map((param) => param.map(rfc3986));
  return encodedParams.sort(lexographicSort), encodedParams.map((param) => param.join("=")).join("&");
}
function signUrl(url, options) {
  validateSigningOptions(options);
  const urlObj = new URL(url), userParams = extractUserParams(urlObj), canonicalQuery = getCanonicalQuery(userParams), urlToSign = urlWithSigningParams(urlObj, canonicalQuery, options), signature = generateSignature(urlToSign, options.privateKey);
  return `${urlToSign}&signature=${rfc3986(signature)}`;
}
function urlWithSigningParams(url, query, signingOptions) {
  const { origin, pathname } = new URL(url), parts = [origin, pathname, "?"];
  return query.length > 0 && (parts.push(query), parts.push("&")), parts.push(`keyid=${rfc3986(signingOptions.keyId)}`), parts.push(`&expiry=${rfc3986(normalizeExpiry(signingOptions.expiry))}`), parts.join("");
}
function validateSigningOptions(options) {
  if (!options.keyId)
    throw new Error("Missing required parameter: keyId");
  if (!options.privateKey)
    throw new Error("Missing required parameter: privateKey");
  if (!options.expiry)
    throw new Error("Missing required parameter: expiry");
  if (typeof options.keyId == "string" && options.keyId.trim() === "")
    throw new Error("keyId cannot be empty");
  if (typeof options.privateKey == "string" && options.privateKey.trim() === "")
    throw new Error("privateKey cannot be empty");
}
export {
  generateSignature,
  pemToEd25519Bytes,
  pemToEd25519Hex,
  signUrl,
  urlWithSigningParams
};
//# sourceMappingURL=index.js.map
