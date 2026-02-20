"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc } from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebaseClient";
import { getClaimsByUser, type Claim } from "@/lib/firebaseHelpers";

type ClaimWithItem = {
  id: string;
  itemName?: string;
  itemLocation?: string;
  createdAt?: Date;
  claimEvidence?: string;
  claimAnswer?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [claims, setClaims] = useState<ClaimWithItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setClaims([]);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(firebaseDb, "Users", firebaseUser.uid);
        const claimsList: Claim[] = await getClaimsByUser(userRef);

        // Load item details for each claim
        const mapped: ClaimWithItem[] = await Promise.all(
          claimsList.map(async (claim) => {
            let itemName = "Unknown item";
            let itemLocation = "Unknown location";

            try {
              // Get item from reference
              const itemDoc = await claim.ClaimRef.get();
              if (itemDoc.exists()) {
                const itemData = itemDoc.data();
                itemName = itemData.ItemName || itemName;

                // Get location from item's location reference
                if (itemData.ItemLoc) {
                  const locationDoc = await itemData.ItemLoc.get();
                  if (locationDoc.exists()) {
                    itemLocation = locationDoc.data().LocName || itemLocation;
                  }
                }
              }
            } catch (e) {
              console.error("Error loading item details", e);
            }

            return {
              id: claim.id,
              itemName,
              itemLocation,
              createdAt: claim.createdAt?.toDate?.() ?? undefined,
              claimEvidence: claim.ClaimEvidence,
              claimAnswer: claim.ClaimAnswer,
            };
          })
        );

        setClaims(mapped);
      } catch (e) {
        console.error("Error fetching claims", e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please sign in to view your profile.
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-6">
          <img
            src={"/assets/Logo.png"}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold">
              {user.displayName || user.email || "User"}
            </h1>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-400">ID: {user.uid}</p>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Items You've Claimed</h2>
          {claims.length === 0 ? (
            <div className="text-gray-500">
              You haven't claimed any items yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {claims.map((c) => (
                <div key={c.id} className="p-4 rounded-lg border bg-gray-50">
                  <h3 className="font-bold">{c.itemName || "Unnamed item"}</h3>
                  {c.itemLocation && (
                    <p className="text-sm text-gray-600">
                      Location: {c.itemLocation}
                    </p>
                  )}
                  {c.createdAt && (
                    <p className="text-sm text-gray-600">
                      Claimed on: {c.createdAt.toLocaleString()}
                    </p>
                  )}
                  {c.claimEvidence && (
                    <p className="mt-2 text-gray-700">
                      <strong>Evidence:</strong> {c.claimEvidence}
                    </p>
                  )}
                  {c.claimAnswer && (
                    <p className="mt-2 text-green-700">
                      <strong>Admin Response:</strong> {c.claimAnswer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
