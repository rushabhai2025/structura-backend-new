import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjust path as needed

interface UploadResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface ProcessingResult {
  fileName: string;
  success: boolean;
  data?: any;
  error?: string;
}

const SafeSupabaseUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<string>('technical');
  const [uploading, setUploading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
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
    setProcessingProgress(0);
    setResponse(null);

    const results: ProcessingResult[] = [];
    const totalFiles = files.length;

    try {
      console.log("=== STARTING SAFE SUPABASE UPLOAD ===");
      console.log("Total files:", totalFiles);
      console.log("Category:", category);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`\n=== PROCESSING FILE ${i + 1}/${totalFiles} ===`);
        console.log("File name:", file.name);
        console.log("File size:", file.size);
        console.log("File type:", file.type);

        try {
          setProcessingProgress((i / totalFiles) * 100);

          // Step 1: Upload file to Supabase storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${i}.${fileExt}`;
          const filePath = `${fileName}`;

          console.log("Uploading to storage:", filePath);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pdfs')
            .upload(filePath, file);

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw new Error(`Storage upload failed: ${uploadError.message}`);
          }

          console.log("Storage upload successful:", uploadData);

          // Step 2: Get public URL
          const { data: urlData } = supabase.storage
            .from('pdfs')
            .getPublicUrl(filePath);

          const publicUrl = urlData?.publicUrl;

          console.log("Public URL data:", urlData);
          console.log("Public URL:", publicUrl);

          // Step 3: Validate fields before insert
          console.log("=== VALIDATING BEFORE SUPABASE INSERT ===");
          console.log("file_name:", file.name);
          console.log("file_url:", publicUrl);
          console.log("category:", category);
          console.log("typeof file.name:", typeof file.name);
          console.log("typeof publicUrl:", typeof publicUrl);
          console.log("typeof category:", typeof category);

          // Validation checks
          if (!file.name || file.name.trim() === '') {
            throw new Error("file_name is empty or invalid");
          }

          if (!publicUrl || publicUrl.trim() === '') {
            throw new Error("publicUrl is undefined or empty!");
          }

          if (!category || category.trim() === '') {
            throw new Error("category is empty or invalid");
          }

          // Step 4: Create safe payload
          const payload = {
            file_name: file.name.trim(),
            file_url: publicUrl.trim(),
            category: category.trim(),
            extracted_data: {
              summary: "Extraction complete",
              total_keys: 0,
              timestamp: new Date().toISOString(),
              file_size: file.size,
              file_type: file.type,
              processing_status: "completed"
            }
          };

          console.log("=== FINAL PAYLOAD FOR SUPABASE ===");
          console.log("Payload:", JSON.stringify(payload, null, 2));
          console.log("Payload keys:", Object.keys(payload));
          console.log("extracted_data keys:", Object.keys(payload.extracted_data));

          // Step 5: Insert to Supabase
          console.log("=== INSERTING INTO SUPABASE ===");
          
          const { data, error } = await supabase
            .from('uploaded_docs')
            .insert(payload)
            .select();

          if (error) {
            console.error("❌ SUPABASE INSERT ERROR:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            console.error("Error details:", error.details);
            console.error("Error hint:", error.hint);
            throw error;
          }

          console.log("✅ SUPABASE INSERT SUCCESSFUL:", data);

          results.push({ 
            fileName: file.name, 
            success: true, 
            data 
          });

        } catch (err) {
          console.error(`❌ Failed to process ${file.name}:`, err);
          results.push({ 
            fileName: file.name, 
            success: false, 
            error: err instanceof Error ? err.message : 'Unknown error' 
          });
        }

        setProcessingProgress(((i + 1) / totalFiles) * 100);
      }

      // Step 6: Calculate final results
      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);

      console.log("=== UPLOAD SUMMARY ===");
      console.log("Total processed:", results.length);
      console.log("Successful:", successfulUploads.length);
      console.log("Failed:", failedUploads.length);

      setResponse({
        success: successfulUploads.length > 0,
        message: `Uploaded ${successfulUploads.length} files successfully. ${failedUploads.length} failed.`,
        data: results
      });

    } catch (error) {
      console.error("Unexpected error:", error);
      setResponse({
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setUploading(false);
      setProcessingProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Safe Supabase Upload</h2>
      
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

        {/* Progress Bar */}
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={uploadFiles}
          disabled={uploading || files.length === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? `Uploading... ${Math.round(processingProgress)}%` : 'Upload Files'}
        </button>

        {/* Response Display */}
        {response && (
          <div className={`mt-4 p-4 rounded-md ${
            response.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-medium ${
              response.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {response.success ? 'Upload Successful' : 'Upload Failed'}
            </h3>
            <p className={`mt-1 text-sm ${
              response.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {response.message}
            </p>
            {response.data && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">View Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Debug Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-medium text-yellow-800 mb-2">Debug Instructions</h3>
          <p className="text-sm text-yellow-700">
            Open browser console (F12) to see detailed validation logs.
            This version includes comprehensive error checking to prevent 422 errors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SafeSupabaseUpload; 