"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Info, PenTool } from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";
import { getUserOrganizations, addRequest } from "@/lib/firebaseHelpers";
import { firebaseDb } from "@/lib/firebaseClient";
import { doc } from "firebase/firestore";

type ActiveForm = "report" | "claim" | null;

export default function FormsPage() {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [reportForm, setReportForm] = useState({
    itemName: "",
    description: "",
  });
  const [claimForm, setClaimForm] = useState({
    itemIdOrName: "",
    proofDetails: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      // Get user's organization
      try {
        const userOrgs = await getUserOrganizations(user.uid);
        if (userOrgs.length > 0) {
          setOrgId(userOrgs[0].orgId);
          if (typeof window !== "undefined") {
            localStorage.setItem("currentOrgId", userOrgs[0].orgId);
          }
        }
      } catch (e) {
        console.error("Error loading user organizations", e);
      }
    });
    return () => unsub();
  }, [router]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !orgId) return;
    const user = firebaseAuth.currentUser;
    if (!user) {
      alert("Please sign in to submit a report.");
      return;
    }
    try {
      setSubmitting(true);
      // Add to Organizations/{orgId}/Requests
      await addRequest(orgId, {
        ItemName: reportForm.itemName,
        ItemDesc: reportForm.description,
      });
      alert("Missing item report submitted!");
      setReportForm({ itemName: "", description: "" });
      setActiveForm(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const user = firebaseAuth.currentUser;
    if (!user) {
      alert("Please sign in to submit a claim.");
      return;
    }
    try {
      setSubmitting(true);
      // Note: Claims are top-level, but we need item reference
      // For now, we'll store basic info. In a real app, you'd look up the item first.
      const userRef = doc(firebaseDb, "Users", user.uid);
      
      // This is a simplified claim - in production you'd want to find the actual item reference
      alert("Please use the 'Claim this item' button on individual items for proper claiming.");
      setClaimForm({ itemIdOrName: "", proofDetails: "" });
      setActiveForm(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to submit claim.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#AEC0F3] flex flex-col font-sans">
      <header className="px-6 py-4 flex items-center justify-between bg-[#8B9AF0]">
        <div className="flex gap-6 text-black">
          <Link href="/">
            <Home className="w-8 h-8 cursor-pointer hover:text-white transition" />
          </Link>
          <Link href="/itemsearch">
            <Info className="w-8 h-8 cursor-pointer hover:text-white transition" />
          </Link>
          <PenTool className="w-8 h-8 cursor-pointer text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#1E1B4B]">ReunItems</h1>
      </header>

      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full flex flex-col items-center gap-8">
        <div className="bg-[#EAEFFF] px-12 py-3 rounded-2xl shadow-sm">
          <h2 className="text-3xl font-bold text-[#1E1B4B]">Forms</h2>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setActiveForm((prev) => (prev === "report" ? null : "report"))}
            className="bg-[#EAEFFF] w-full h-48 rounded-3xl flex items-center justify-center shadow-md hover:scale-105 hover:shadow-xl transition-all cursor-pointer group"
          >
            <span className="text-2xl md:text-3xl font-bold text-gray-400 group-hover:text-[#1E1B4B] transition-colors text-center px-4">
              Reporting a missing item
            </span>
          </button>

          <button
            onClick={() => setActiveForm((prev) => (prev === "claim" ? null : "claim"))}
            className="bg-[#EAEFFF] w-full h-48 rounded-3xl flex items-center justify-center shadow-md hover:scale-105 hover:shadow-xl transition-all cursor-pointer group"
          >
            <span className="text-2xl md:text-3xl font-bold text-gray-400 group-hover:text-[#1E1B4B] transition-colors text-center px-4">
              Claiming your item
            </span>
          </button>
        </div>

        {activeForm === "report" && (
          <form
            onSubmit={handleReportSubmit}
            className="w-full bg-white rounded-3xl shadow-xl p-6 flex flex-col gap-4"
          >
            <h3 className="text-2xl font-bold text-[#1E1B4B] mb-2">Report a Missing Item</h3>
            <input
              className="p-3 rounded-xl border"
              placeholder="Item name"
              value={reportForm.itemName}
              onChange={(e) => setReportForm((f) => ({ ...f, itemName: e.target.value }))}
              required
            />
            <textarea
              className="p-3 rounded-xl border min-h-[120px]"
              placeholder="Describe your item (brand, color, unique features, where you last saw it, etc.)"
              value={reportForm.description}
              onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#1E1B4B] text-white py-3 rounded-xl font-bold hover:bg-indigo-900 transition"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        )}

        {activeForm === "claim" && (
          <form
            onSubmit={handleClaimSubmit}
            className="w-full bg-white rounded-3xl shadow-xl p-6 flex flex-col gap-4"
          >
            <h3 className="text-2xl font-bold text-[#1E1B4B] mb-2">Claim an Item</h3>
            <p className="text-sm text-gray-600 mb-2">
              Note: For best results, use the "Claim this item" button when viewing individual items in the search page.
            </p>
            <input
              className="p-3 rounded-xl border"
              placeholder="Item name or ID"
              value={claimForm.itemIdOrName}
              onChange={(e) => setClaimForm((f) => ({ ...f, itemIdOrName: e.target.value }))}
            />
            <textarea
              className="p-3 rounded-xl border min-h-[120px]"
              placeholder="Describe proof of ownership (photos you have, unique details, etc.)"
              value={claimForm.proofDetails}
              onChange={(e) => setClaimForm((f) => ({ ...f, proofDetails: e.target.value }))}
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#1E1B4B] text-white py-3 rounded-xl font-bold hover:bg-indigo-900 transition"
            >
              {submitting ? "Submitting..." : "Submit Claim"}
            </button>
          </form>
        )}
      </main>

      <footer className="bg-[#1E1B4B] text-white p-4 text-xs font-medium flex justify-between items-center mt-auto">
        <span>2025 Branham High School . reunitems@gmail.com</span>
        <span>XXX-XXX-XXXX</span>
      </footer>
    </div>
  );
}
