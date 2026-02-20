"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { firebaseAuth, firebaseDb } from "@/lib/firebaseClient";
import { doc, collection, setDoc, serverTimestamp } from "firebase/firestore";

export default function OrgApplicationPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId;

  const [message, setMessage] = useState("");

  // Auth check
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
      } else {
        setUser(firebaseUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      // Create a member document reference inside the correct org
      const membersRef = collection(firebaseDb, "organizations", orgId, "Members");
      const memberDocRef = doc(membersRef); // auto-ID doc reference
      await setDoc(memberDocRef, {
        UserRef: doc(firebaseDb, "Users", user.uid),
        UserRole: "regular",
        ApplicationStatus: "pending",
        CreatedAt: serverTimestamp(),
      });

      // Add application under user's MyApplications
      const myAppsRef = collection(firebaseDb, "Users", user.uid, "MyApplications");
      await setDoc(doc(myAppsRef), {
        AppOrg: doc(firebaseDb, "organizations", orgId), // reference to the org
        AppMember: memberDocRef, // reference to the newly created member
        Message: message || "",
        CreatedAt: serverTimestamp(),
      });

      router.push("/profile");
    } catch (err) {
      console.error("Error submitting application:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#AEC0F3] p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4 text-[#1E1B4B]">
          Request to join organization
        </h1>
        <textarea
          placeholder="Please add your name or an identifier for the admin"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#1E1B4B]"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#1E1B4B] text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-900 transition"
        >
          {submitting ? "Submitting..." : "Request Access"}
        </button>
      </form>
    </div>
  );
}