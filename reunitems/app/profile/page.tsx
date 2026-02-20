"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import Link from "next/link";
import { firebaseAuth, firebaseDb } from "@/lib/firebaseClient";

type ClaimWithItem = {
  id: string;
  itemName?: string;
  itemLocation?: string;
  createdAt?: Date;
  claimEvidence?: string;
  claimAnswer?: string;
};

type OrgWithItems = {
  orgId: string;
  orgName: string;
  role: string;
  applicationStatus: string;
  items: { id: string; name: string; location: string }[];
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [claims, setClaims] = useState<ClaimWithItem[]>([]);
  const [organizations, setOrganizations] = useState<OrgWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setClaims([]);
        setOrganizations([]);
        setLoading(false);
        return;
      }

      try {
        // --- Fetch organizations via MyApplications ---
        const myAppsSnap = await getDocs(
          collection(firebaseDb, "Users", firebaseUser.uid, "MyApplications")
        );

        const orgsWithItems: OrgWithItems[] = (
          await Promise.all(
            myAppsSnap.docs.map(async (appDoc) => {
              const appData = appDoc.data();
              const orgRef = appData.AppOrg;
              const memberRef = appData.AppMember;

              if (!orgRef || !memberRef) return null;

              const orgDoc = await getDoc(orgRef);
              if (!orgDoc.exists()) return null;
              const orgData = orgDoc.data();

              const memberDoc = await getDoc(memberRef);
              if (!memberDoc.exists()) return null;
              const memberData = memberDoc.data();

              const applicationStatus = memberData.ApplicationStatus || "";
              const role = memberData.UserRole || "regular";

              if (!["approved", "pending"].includes(applicationStatus)) return null;

              let items: OrgWithItems["items"] = [];
              if (applicationStatus === "approved") {
                const itemsSnap = await getDocs(
                  collection(firebaseDb, "organizations", orgDoc.id, "Items")
                );
                items = await Promise.all(
                  itemsSnap.docs.map(async (itemDoc) => {
                    const itemData = itemDoc.data();
                    let locationName = "Unknown location";
                    try {
                      if (itemData.ItemLoc) {
                        const locDoc = await getDoc(itemData.ItemLoc);
                        if (locDoc.exists()) locationName = locDoc.data().LocName || locationName;
                      }
                    } catch {}
                    return {
                      id: itemDoc.id,
                      name: itemData.ItemName || "Unnamed",
                      location: locationName,
                    };
                  })
                );
              }

              return {
                orgId: orgDoc.id,
                orgName: orgData.OrgName || orgDoc.id,
                role,
                applicationStatus,
                items,
              };
            })
          )
        ).filter(Boolean) as OrgWithItems[];

        setOrganizations(orgsWithItems);

        // --- Fetch claims ---
        const claimsSnap = await getDocs(
          collection(firebaseDb, "Users", firebaseUser.uid, "MyApplications")
        );
        // placeholder — wire up real claims if needed
        setClaims([]);
      } catch (e) {
        console.error("Error fetching profile data", e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#AEC0F3]">
        <div className="text-xl font-semibold text-[#1E1B4B]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#AEC0F3] gap-4">
        <p className="text-lg text-[#1E1B4B]">Please sign in to view your profile.</p>
        <Link
          href="/login"
          className="bg-[#1E1B4B] text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-900 transition"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[#AEC0F3]">
      <div className="max-w-4xl mx-auto">

        {/* User Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-6">
            <img src="/assets/Logo.png" alt="avatar" className="w-24 h-24 rounded-full object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-[#1E1B4B]">
                {user.displayName || user.email || "User"}
              </h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Organizations */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-[#1E1B4B] mb-4">Your organizations</h2>
          {organizations.length === 0 ? (
            <p className="text-gray-500">You are not in any organizations yet.</p>
          ) : (
            <div className="space-y-6">
              {organizations.map((org) => (
                <div key={org.orgId} className="border rounded-2xl p-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <Link
                      href={`/org/${org.orgId}/dashboard`}
                      className="font-bold text-lg text-[#1E1B4B] hover:underline"
                    >
                      {org.orgName}
                    </Link>
                    <span className="text-sm px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                      {org.role === "admin" ? "Admin" : "Member"}
                    </span>
                    {org.applicationStatus === "pending" && (
                      <span className="text-sm px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                        Pending approval
                      </span>
                    )}
                  </div>

                  {org.applicationStatus === "approved" && (
                    org.items.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-600 mb-2">Items in this organization</p>
                        <ul className="space-y-1 text-sm">
                          {org.items.slice(0, 10).map((item) => (
                            <li key={item.id} className="flex justify-between">
                              <span>{item.name}</span>
                              <span className="text-gray-500">{item.location}</span>
                            </li>
                          ))}
                          {org.items.length > 10 && (
                            <li className="text-gray-500">+{org.items.length - 10} more</li>
                          )}
                        </ul>
                        <Link
                          href={`/org/${org.orgId}/dashboard`}
                          className="inline-block mt-2 text-sm text-indigo-600 hover:underline"
                        >
                          View all items →
                        </Link>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No items in this organization yet.</p>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Claimed Items */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-[#1E1B4B] mb-4">Items you've claimed</h2>
          {claims.length === 0 ? (
            <p className="text-gray-500">You haven't claimed any items yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {claims.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border bg-gray-50">
                  <h3 className="font-bold">{c.itemName || "Unnamed item"}</h3>
                  {c.itemLocation && <p className="text-sm text-gray-600">Location: {c.itemLocation}</p>}
                  {c.createdAt && <p className="text-sm text-gray-600">Claimed on: {c.createdAt.toLocaleString()}</p>}
                  {c.claimEvidence && <p className="mt-2 text-gray-700"><strong>Evidence:</strong> {c.claimEvidence}</p>}
                  {c.claimAnswer && <p className="mt-2 text-green-700"><strong>Admin response:</strong> {c.claimAnswer}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}