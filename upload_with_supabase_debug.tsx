import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjust path as needed

interface UploadResponse {
  success: boolean;
  message: string;
  data?: any;
}

const FileUploadWithDebug: React.FC = () => {
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
      const results = [];

      for (const file of files) {
        console.log("=== PROCESSING FILE ===");
        console.log("File:", file.name);
        console.log("Size:", file.size);
        console.log("Type:", file.type);

        // Upload file to Supabase Storage
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          results.push({
            filename: file.name,
            success: false,
            error: uploadError.message
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        console.log("Public URL:", publicUrl);

        // Extract data (dummy data for now)
        const extracted_data = {
          filename: file.name,
          category: category,
          upload_time: new Date().toISOString(),
          file_size: file.size,
          extracted_fields: {
            technical: {
              machine_model: "PF1-2000",
              forming_area: "2000x1500mm",
              heating_power: "50kW",
              vacuum_pressure: "0.8 bar"
            },
            commercial: {
              base_price: "$150,000",
              lead_time: "8-12 weeks",
              warranty_period: "2 years",
              payment_terms: "30% advance, 70% before shipment"
            },
            basic: {
              machine_description: "Advanced thermoforming machine for automotive applications",
              applications: "Automotive, packaging, medical devices",
              automation_level: "Fully automated with robotic loading"
            }
          }
        };

        // Filter data based on category
        if (category !== 'all') {
          extracted_data.extracted_fields = {
            [category]: extracted_data.extracted_fields[category as keyof typeof extracted_data.extracted_fields]
          };
        }

        // === SUPABASE INSERT DEBUG ===
        console.log("=== SUPABASE INSERT DEBUG ===");
        console.log("File name:", file.name);
        console.log("File URL:", publicUrl);
        console.log("Category:", category);
        console.log("Extracted data:", extracted_data);
        console.log("Full payload:", {
          file_name: file.name,
          file_url: publicUrl,
          category: category,
          extracted_data: extracted_data
        });
        console.log("=== END DEBUG ===");

        // Insert into database
        const { data: insertData, error: insertError } = await supabase
          .table("uploaded_docs")
          .insert({
            file_name: file.name,
            file_url: publicUrl,
            category: category,
            extracted_data: extracted_data
          })
          .select();

        if (insertError) {
          console.error("Database insert error:", insertError);
          console.error("Error details:", {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          results.push({
            filename: file.name,
            success: false,
            error: insertError.message
          });
        } else {
          console.log("Successfully inserted:", insertData);
          results.push({
            filename: file.name,
            success: true,
            data: insertData
          });
        }
      }

      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);

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
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">File Upload with Supabase Debug</h2>
      
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
          {uploading ? 'Uploading...' : 'Upload Files'}
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
            Open browser console (F12) to see detailed debug logs for Supabase operations.
            Look for "SUPABASE INSERT DEBUG" sections to identify 422 errors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUploadWithDebug; 