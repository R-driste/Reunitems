"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebaseClient";

type ClaimWithItem = {
  id: string;
  itemName?: string;
  itemLocation?: string;
  createdAt?: Date;
  message?: string;
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
        const claimsSnap = await getDocs(
          query(
            collection(firebaseDb, "claims"),
            where("userId", "==", firebaseUser.uid),
            orderBy("createdAt", "desc")
          )
        );

        const mapped: ClaimWithItem[] = claimsSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            itemName: data.itemName,
            itemLocation: data.itemLocation,
            createdAt: data.createdAt?.toDate?.() ?? undefined,
            message: data.message,
          };
        });
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
                  {c.message && (
                    <p className="mt-2 text-gray-700">Message: {c.message}</p>
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
