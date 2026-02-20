"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";
import {
  isSuperAdmin,
  getPendingOrganizations,
  getMembers,
  updateOrganization,
  updateMember,
  type Organization,
} from "@/lib/firebaseHelpers";

type PendingOrgWithApplicant = Organization & {
  applicantEmail?: string;
  applicantName?: string;
  applicantMemberId?: string;
  appliedAtFormatted?: string;
};

export default function OwnersPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [pending, setPending] = useState<PendingOrgWithApplicant[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      const ok = await isSuperAdmin(user.uid);
      setAllowed(ok);
      if (!ok) {
        setLoading(false);
        return;
      }
      try {
        const orgs = await getPendingOrganizations();
        const withApplicants: PendingOrgWithApplicant[] = await Promise.all(
          orgs.map(async (org) => {
            const members = await getMembers(org.id);
            const founder = members.find((m) => m.UserRole === "superadmin" && m.ApplicationStatus === "pending");
            let applicantEmail: string | undefined;
            let applicantName: string | undefined;
            if (founder?.UserRef) {
              const userDoc = await founder.UserRef.get();
              if (userDoc.exists()) {
                const d = userDoc.data();
                applicantEmail = d?.UserEmail;
                applicantName = d?.UserName;
              }
            }
            const appliedAtFormatted = org.AppliedAt?.toDate?.()
              ? new Date(org.AppliedAt.toDate()).toLocaleString()
              : org.createdAt?.toDate?.()
                ? new Date(org.createdAt.toDate()).toLocaleString()
                : "—";
            return {
              ...org,
              applicantEmail,
              applicantName,
              applicantMemberId: founder?.id,
              appliedAtFormatted,
            };
          })
        );
        setPending(withApplicants);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleApprove = async (orgId: string, applicantMemberId?: string) => {
    setActionLoading(orgId);
    try {
      await updateOrganization(orgId, { OrgApprovalStatus: "approved" });
      if (applicantMemberId) {
        await updateMember(orgId, applicantMemberId, { ApplicationStatus: "approved" });
      }
      setPending((prev) => prev.filter((o) => o.id !== orgId));
    } catch (e) {
      console.error(e);
      alert("Failed to approve.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (orgId: string) => {
    setActionLoading(orgId);
    try {
      await updateOrganization(orgId, { OrgApprovalStatus: "denied" });
      setPending((prev) => prev.filter((o) => o.id !== orgId));
    } catch (e) {
      console.error(e);
      alert("Failed to deny.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#AEC0F3] flex items-center justify-center">
        <div className="text-xl font-semibold text-[#1E1B4B]">Loading...</div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-[#AEC0F3] flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold text-[#1E1B4B]">Owners</h1>
        <p className="text-gray-600 text-center max-w-md">
          Log in with an account that has <strong>owner</strong> access to review and approve organization applications. Add your Firebase Auth UID to Firestore collection <strong>AppAdmins</strong> (document ID = your UID) to get access.
        </p>
        <Link href="/login" className="bg-[#1E1B4B] text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-900 transition">Log in</Link>
        <Link href="/" className="text-indigo-600 underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#AEC0F3] flex flex-col font-sans">
      <header className="px-6 py-4 flex items-center justify-between bg-[#8B9AF0]">
        <h1 className="text-2xl font-extrabold text-[#1E1B4B]">Owners – Approve organizations</h1>
        <Link href="/" className="text-[#1E1B4B] font-medium hover:underline">Back to home</Link>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {pending.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center text-gray-600">
            No pending organization applications.
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((org) => (
              <div key={org.id} className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1E1B4B]">{org.name || org.id}</h2>
                    {org.Address && <p className="text-gray-600 mt-1">Address: {org.Address}</p>}
                    {org.LocPoint && (
                      <p className="text-sm text-gray-500 mt-1">
                        Location: {org.LocPoint.latitude}, {org.LocPoint.longitude}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">Applied: {org.appliedAtFormatted}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Applicant: {org.applicantName || "—"} ({org.applicantEmail || "—"})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(org.id, org.applicantMemberId)}
                      disabled={actionLoading === org.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === org.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleDeny(org.id)}
                      disabled={actionLoading === org.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
