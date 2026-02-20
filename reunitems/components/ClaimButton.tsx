"use client";
import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebaseClient";

type ClaimRecord = {
  id: string;
  userName?: string;
  userEmail?: string;
};

export default function ClaimButton({ item }: { item: any }) {
  const [loading, setLoading] = useState(false);
  const [claimedBy, setClaimedBy] = useState<ClaimRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!item?.id) return;
    let cancelled = false;
    const load = async () => {
      const snap = await getDocs(
        query(
          collection(firebaseDb, "claims"),
          where("itemId", "==", item.id)
        )
      );
      if (cancelled) return;
      const list: ClaimRecord[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          userName: data.userName,
          userEmail: data.userEmail,
        };
      });
      setClaimedBy(list);
    };
    load().catch((e) => console.error("load claimers", e));
    return () => {
      cancelled = true;
    };
  }, [item]);

  const handleClaim = async () => {
    if (!item?.id) {
      alert("This item cannot be claimed.");
      return;
    }
    if (!currentUser) {
      alert("You must be logged in to claim an item.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        itemId: item.id,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userEmail: currentUser.email,
        itemName: item.name,
        itemLocation: item.location,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(firebaseDb, "claims"), payload);
      alert("Item claimed successfully!");
      setClaimedBy((prev) => [
        ...prev,
        { id: docRef.id, userName: payload.userName, userEmail: payload.userEmail },
      ]);
    } catch (e) {
      console.error("Claim exception:", e);
      alert("Claim failed: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1">
      <button
        onClick={handleClaim}
        disabled={loading}
        className="bg-green-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-700 transition disabled:opacity-60"
      >
        {loading ? "Claiming…" : "Claim this item"}
      </button>
      <div className="mt-2 text-sm text-gray-600">
        {claimedBy.length === 0
          ? "No one has claimed this yet"
          : `Claimed by: ${claimedBy
              .map((c) => c.userName || c.userEmail)
              .join(", ")}`}
      </div>
    </div>
  );
}
