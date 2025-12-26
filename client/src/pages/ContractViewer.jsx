import React, { useEffect, useState } from "react";
import { contracts } from "../api/api";
import { useParams } from "react-router-dom";
import { FileText } from "lucide-react";

export default function ContractViewer() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await contracts.get(id);
        setContract(res.data?.data || null);
      } catch (err) {
        setContract(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1a2332]/40 border border-blue-500/10 rounded-3xl p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : !contract ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#1a2332]/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400">Contract not found</p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Contract #{contract._id || contract.id}
              </h2>
              <pre className="mt-4 text-sm text-gray-300 whitespace-pre-wrap bg-[#1214] rounded-lg p-4 border border-white/5">
                {contract.terms}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
