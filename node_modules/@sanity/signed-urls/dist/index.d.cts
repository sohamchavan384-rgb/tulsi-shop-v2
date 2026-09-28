/**
 * Generates an Ed25519 signature for a given URL.
 *
 * @public
 * @param url - The URL to sign
 * @param privateKey - The private key to use for signing
 * @returns The base64url-encoded signature
 */
export declare function generateSignature(url: string, privateKey: string): string

/**
 * Converts a PEM-formatted PKCS#8 Ed25519 private key to its 32-byte seed (Uint8Array).
 * @public
 * @param pem - The PEM-formatted PKCS#8 key (e.g. "BEGIN PRIVATE KEY")
 * @returns The 32-byte Ed25519 seed.
 * @throws If the PEM/DER is invalid or a 32-byte seed cannot be found.
 */
export declare function pemToEd25519Bytes(pem: string): Uint8Array

/**
 * Converts a PEM-formatted PKCS#8 Ed25519 private key to its 32-byte seed (hex string).
 * @public
 * @param pem - The PEM-formatted PKCS#8 key (e.g. "BEGIN PRIVATE KEY")
 * @returns The 32-byte Ed25519 seed as a lowercase hex string.
 * @throws If the PEM/DER is invalid or a 32-byte seed cannot be found.
 */
export declare function pemToEd25519Hex(pem: string): string

/**
 * Options for signing URLs with Ed25519
 *
 * @public
 */
export declare interface SigningOptions {
  /**
   * Expiry time for the signed URL, either as a Date object or ISO string
   */
  expiry: Date | string
  /**
   * The key ID to use for signing the URL
   */
  keyId: string
  /**
   * The Ed25519 private key (as hex string) to use for signing the URL
   */
  privateKey: string
}

/**
 * Signs a URL with Ed25519 signature, adding keyid, expiry, and signature parameters.
 *
 * @public
 * @param url - The URL to sign
 * @param options - The signing options to use
 * @returns The signed URL
 */
export declare function signUrl(url: string | URL, options: SigningOptions): string

/**
 * Returns a ready-to-sign URL object with signing parameters (keyid and expiry).
 *
 * @public
 * @param url - The base URL to which signing parameters will be added
 * @param query - The canonical query string of user parameters
 * @param options - The signing options containing keyId and expiry
 * @returns A "signable" URL string with keyid and expiry parameters
 */
export declare function urlWithSigningParams(
  url: string | URL,
  query: string,
  signingOptions: Omit<SigningOptions, 'privateKey'>,
): string

export {}
