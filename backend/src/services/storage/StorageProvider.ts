/**
 * Storage Provider interface — abstracts file storage so the app
 * can swap between local disk and S3-compatible storage via environment config.
 */

export interface StorageProvider {
  /**
   * Save a file and return its accessible URL/path.
   * @param buffer - File buffer
   * @param filename - Sanitized filename (server-generated, never client-provided)
   * @param folder - Subdirectory (e.g., 'payment-proofs', 'receipts')
   * @param contentType - MIME type
   * @returns The accessible URL or relative path to the stored file
   */
  save(buffer: Buffer, filename: string, folder: string, contentType: string): Promise<string>;

  /**
   * Delete a file.
   * @param filePathOrUrl - The path/URL returned by save()
   */
  delete(filePathOrUrl: string): Promise<void>;

  /**
   * Get a readable stream for a file (for serving to clients).
   * @param filePathOrUrl - The path/URL returned by save()
   */
  getBuffer(filePathOrUrl: string): Promise<Buffer>;

  /**
   * Check if a file exists.
   */
  exists(filePathOrUrl: string): Promise<boolean>;
}
