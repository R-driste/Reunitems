"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebaseClient";

export type Organization = {
  id: string;
  OrgName?: string;
  ApplicationStatus?: string;
};

export default function SchoolFindPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all organizations from Firestore
  useEffect(() => {
    async function fetchOrgs() {
      try {
        const orgCol = collection(firebaseDb, "organizations");
        const snapshot = await getDocs(orgCol);
        
        console.log("Docs count:", snapshot.docs.length);
        snapshot.docs.forEach(d => console.log("Doc:", d.id, d.data()));
        
        const orgs: Organization[] = snapshot.docs.map(doc => ({
          id: doc.id,
          OrgName: doc.data().OrgName,
          ApplicationStatus: doc.data().ApplicationStatus,
        }));
        setOrganizations(orgs);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrgs();
  }, []);

  // Filter approved orgs and search query
  const filteredOrgs = useMemo(() => {
    return organizations
      .filter(org => org.ApplicationStatus === "approved")
      .filter(org => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (org.OrgName || "").toLowerCase().includes(q);
      });
  }, [organizations, searchQuery]);

  return (
    <div className="min-h-screen bg-[#AEC0F3] flex flex-col font-sans">
      <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-[#1E1B4B] mb-2">
          Find your organization
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Select your school or organization to sign in or sign up.
        </p>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E1B4B] text-gray-800 mb-4"
          />

          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading organizations...</p>
          ) : filteredOrgs.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              {searchQuery
                ? `No approved organizations found matching "${searchQuery}".`
                : "No approved organizations yet."}
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredOrgs.map(org => (
                <li key={org.id}>
                  <Link
                    href={`/org/${org.id}/apply`} // always use the doc ID in the link
                    className="block w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition"
                  >
                    <span className="font-medium text-[#1E1B4B]">{org.OrgName || org.id}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-2">Don't see your organization?</p>
            <Link
              href="/login?registerOrg=1"
              className="inline-block bg-[#1E1B4B] text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-900 transition"
            >
              Register your organization
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}