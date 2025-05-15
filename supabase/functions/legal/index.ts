import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts'; // CORSヘッダーは必要に応じて

// Helper function to read markdown file content from within the Function's directory
const readLegalDocumentFromFunctionDir = async (filename: string): Promise<string> => {
  try {
    // Functions are typically executed from their own directory.
    // Construct path relative to the function's root.
    // e.g., if this function is in supabase/functions/legal/index.ts
    // and documents are in supabase/functions/legal/legal_documents/
    const filePath = new URL(`./legal_documents/${filename}`, import.meta.url).pathname;
    const data = await Deno.readTextFile(filePath);
    return data;
  } catch (error) {
    console.error(`Error reading file ${filename}:`, error);
    throw new Error(`Failed to read ${filename}: ${error.message}`);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  let documentFilename = '';

  // Determine which document to serve based on the path
  // Example: /functions/v1/legal/terms-of-service
  // The path segment after /legal/ will determine the document
  const pathSegments = url.pathname.split('/');
  const action = pathSegments[pathSegments.length -1]; // last segment

  if (action === 'terms-of-service') {
    documentFilename = 'terms_of_service.md';
  } else if (action === 'privacy-policy') {
    documentFilename = 'privacy_policy.md';
  } else {
    return new Response(JSON.stringify({ message: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const content = await readLegalDocumentFromFunctionDir(documentFilename);
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // Log the full error for server-side debugging
    console.error(`Error serving document ${documentFilename}:`, error);
    // Return a generic error message to the client
    return new Response(JSON.stringify({ message: `文書 (${documentFilename}) の取得中にエラーが発生しました。`, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 