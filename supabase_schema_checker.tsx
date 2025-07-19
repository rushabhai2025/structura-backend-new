import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjust path as needed

const SupabaseSchemaChecker: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkSchema = async () => {
    setChecking(true);
    setResult(null);

    try {
      console.log("🔍 === CHECKING SUPABASE SCHEMA ===");

      // Method 1: Try to get table info
      console.log("📋 Attempting to get table info...");
      
      const { data: tableData, error: tableError } = await supabase
        .from('uploaded_docs')
        .select('*')
        .limit(1);

      console.log("📊 Table data result:", tableData);
      console.log("❌ Table error:", tableError);

      // Method 2: Try a simple insert to see what fields are expected
      console.log("🧪 Testing minimal insert...");
      
      const testPayload = {
        file_name: "test_file.pdf",
        file_url: "https://example.com/test.pdf",
        category: "test"
      };

      console.log("📦 Test payload:", testPayload);

      const { data: insertData, error: insertError } = await supabase
        .from('uploaded_docs')
        .insert(testPayload)
        .select();

      console.log("✅ Insert result:", insertData);
      console.log("❌ Insert error:", insertError);

      // Method 3: Check if table exists by trying to count
      console.log("🔢 Checking table count...");
      
      const { count, error: countError } = await supabase
        .from('uploaded_docs')
        .select('*', { count: 'exact', head: true });

      console.log("📊 Table count:", count);
      console.log("❌ Count error:", countError);

      setResult({
        tableData,
        tableError,
        insertData,
        insertError,
        count,
        countError,
        testPayload
      });

    } catch (error) {
      console.error("💥 Schema check error:", error);
      setResult({ error: error });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Supabase Schema Checker</h2>
      
      <div className="space-y-4">
        <button
          onClick={checkSchema}
          disabled={checking}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
        >
          {checking ? 'Checking Schema...' : 'Check Supabase Schema'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="font-medium text-gray-800 mb-2">Schema Check Results</h3>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">View Full Results</summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">Schema Check Instructions</h3>
          <p className="text-sm text-blue-700">
            This will test your Supabase table structure and show exactly what fields are expected.
            Check browser console (F12) for detailed logs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSchemaChecker; 