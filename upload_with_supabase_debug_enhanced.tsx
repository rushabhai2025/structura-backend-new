import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjust path as needed

interface UploadResponse {
  success: boolean;
  message: string;
  data?: any;
}

const EnhancedDebugUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<string>('technical');
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState<UploadResponse | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(event.target.value);
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setResponse({ success: false, message: 'Please select files to upload' });
      return;
    }

    setUploading(true);
    setResponse(null);

    try {
      console.log("🚀 === ENHANCED DEBUG UPLOAD START ===");
      console.log("📁 Files to process:", files.length);
      console.log("🏷️ Category:", category);

      for (const file of files) {
        console.log(`\n📄 === PROCESSING: ${file.name} ===`);
        
        try {
          // Step 1: Basic file validation
          console.log("🔍 File validation:");
          console.log("  - Name:", file.name);
          console.log("  - Size:", file.size);
          console.log("  - Type:", file.type);
          console.log("  - Last modified:", new Date(file.lastModified));

          if (!file.name || file.name.trim() === '') {
            throw new Error("❌ File name is empty");
          }

          // Step 2: Upload to storage
          console.log("☁️ Uploading to Supabase storage...");
          const fileName = `${Date.now()}_${file.name}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pdfs')
            .upload(fileName, file);

          if (uploadError) {
            console.error("❌ Storage upload failed:", uploadError);
            throw new Error(`Storage error: ${uploadError.message}`);
          }

          console.log("✅ Storage upload successful:", uploadData);

          // Step 3: Get public URL
          console.log("🔗 Getting public URL...");
          const { data: urlData } = supabase.storage
            .from('pdfs')
            .getPublicUrl(fileName);

          console.log("📋 URL data:", urlData);
          const publicUrl = urlData?.publicUrl;
          console.log("🔗 Public URL:", publicUrl);

          if (!publicUrl) {
            throw new Error("❌ Public URL is undefined");
          }

          // Step 4: Create minimal payload
          console.log("📦 Creating minimal payload...");
          
          const minimalPayload = {
            file_name: file.name,
            file_url: publicUrl,
            category: category
            // NO extracted_data for now - let's test with minimal fields
          };

          console.log("📋 Minimal payload:", JSON.stringify(minimalPayload, null, 2));
          console.log("🔍 Payload validation:");
          console.log("  - file_name type:", typeof minimalPayload.file_name);
          console.log("  - file_url type:", typeof minimalPayload.file_url);
          console.log("  - category type:", typeof minimalPayload.category);
          console.log("  - file_name length:", minimalPayload.file_name.length);
          console.log("  - file_url length:", minimalPayload.file_url.length);
          console.log("  - category length:", minimalPayload.category.length);

          // Step 5: Test insert with minimal payload
          console.log("💾 Inserting minimal payload to Supabase...");
          
          const { data: insertData, error: insertError } = await supabase
            .from('uploaded_docs')
            .insert(minimalPayload)
            .select();

          if (insertError) {
            console.error("❌ SUPABASE INSERT ERROR:");
            console.error("  - Code:", insertError.code);
            console.error("  - Message:", insertError.message);
            console.error("  - Details:", insertError.details);
            console.error("  - Hint:", insertError.hint);
            console.error("  - Full error:", insertError);
            throw insertError;
          }

          console.log("✅ SUCCESS! Insert data:", insertData);

          // Step 6: If minimal works, try with extracted_data
          console.log("🔄 Testing with extracted_data...");
          
          const fullPayload = {
            file_name: file.name,
            file_url: publicUrl,
            category: category,
            extracted_data: {
              test: true,
              timestamp: new Date().toISOString(),
              message: "Test extraction data"
            }
          };

          console.log("📋 Full payload:", JSON.stringify(fullPayload, null, 2));

          const { data: fullInsertData, error: fullInsertError } = await supabase
            .from('uploaded_docs')
            .insert(fullPayload)
            .select();

          if (fullInsertError) {
            console.error("❌ FULL PAYLOAD INSERT ERROR:");
            console.error("  - Code:", fullInsertError.code);
            console.error("  - Message:", fullInsertError.message);
            console.error("  - Details:", fullInsertError.details);
            console.error("  - Hint:", fullInsertError.hint);
            throw fullInsertError;
          }

          console.log("✅ FULL PAYLOAD SUCCESS:", fullInsertData);

          setResponse({
            success: true,
            message: `Successfully uploaded ${file.name}`,
            data: { minimal: insertData, full: fullInsertData }
          });

        } catch (err) {
          console.error(`❌ Failed to process ${file.name}:`, err);
          setResponse({
            success: false,
            message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
            data: { error: err }
          });
        }
      }

    } catch (error) {
      console.error("💥 Unexpected error:", error);
      setResponse({
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Enhanced Debug Upload</h2>
      
      <div className="space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF Files
          </label>
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {files.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Selected {files.length} file(s): {files.map(f => f.name).join(', ')}
            </p>
          )}
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Processing Category
          </label>
          <select
            value={category}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="technical">Technical Specifications</option>
            <option value="commercial">Commercial Information</option>
            <option value="basic">Basic Machine Details</option>
            <option value="all">All Categories</option>
          </select>
        </div>

        {/* Upload Button */}
        <button
          onClick={uploadFiles}
          disabled={uploading || files.length === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Debugging Upload...' : 'Start Enhanced Debug'}
        </button>

        {/* Response Display */}
        {response && (
          <div className={`mt-4 p-4 rounded-md ${
            response.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-medium ${
              response.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {response.success ? 'Debug Complete' : 'Debug Failed'}
            </h3>
            <p className={`mt-1 text-sm ${
              response.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {response.message}
            </p>
            {response.data && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">View Debug Data</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Debug Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-medium text-yellow-800 mb-2">Enhanced Debug Instructions</h3>
          <p className="text-sm text-yellow-700">
            This version tests minimal payload first, then full payload.
            Check browser console (F12) for detailed step-by-step logs.
            Look for the exact error code and message from Supabase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDebugUpload; 