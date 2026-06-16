import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.warn("Supabase credentials not found in .env. Storage features will fail.");
}

export const documentStorageService = {
  /**
   * Upload a document to Supabase storage
   * @param {Object} file - The file object from Multer
   * @param {string} userId - The user's ID
   * @returns {Promise<string>} - The public URL of the uploaded file
   */
  uploadDocument: async (file, userId) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const fileExt = file.originalname.split(".").pop();
    const uniqueFileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("documents")
      .upload(uniqueFileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }

    // Return the internal path instead of a public URL
    return data.path;
  },

  /**
   * Get a temporary signed URL for a private document
   */
  getSignedUrl: async (path) => {
    if (!supabase) return null;
    
    // Create a URL valid for 1 hour (3600 seconds)
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 3600);

    if (error) {
      console.error("Supabase signed URL error:", error);
      throw new Error(`Failed to generate secure URL: ${error.message}`);
    }

    return data.signedUrl;
  },

  /**
   * Delete a document from Supabase storage
   * @param {string} path - The path inside the 'documents' bucket
   */
  deleteDocument: async (path) => {
    if (!supabase) return;
    
    // Path should be like: "userId/uuid.pdf"
    const { error } = await supabase.storage
      .from("documents")
      .remove([path]);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  },
};
