"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, Info, Search, X, Calendar, MapPin, Tag } from "lucide-react";
import Link from "next/link";
import ClaimButton from "@/components/ClaimButton";
import Fuse from "fuse.js";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";
import { getUserOrganizations, getItems, type Item } from "@/lib/firebaseHelpers";

type DisplayItem = {
  id: string;
  name: string;
  location: string;
  date: string;
  description: string;
  color?: string;
  orgId: string; // Needed for ClaimButton
};

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [allItems, setAllItems] = useState<DisplayItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DisplayItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadItems = async () => {
      const user = firebaseAuth.currentUser;
      if (!user) {
        router.replace("/");
        return;
      }

      try {
        // Get user's organizations
        const userOrgs = await getUserOrganizations(user.uid);
        
        // Load items from all user's organizations
        const allItemsList: DisplayItem[] = [];

        for (const userOrg of userOrgs) {
          const orgId = userOrg.orgId;
          const items: Item[] = await getItems(orgId);

          // Convert to display format
          const displayItems = await Promise.all(
            items.map(async (item) => {
              // Get location name from reference
              let locationName = "Unknown location";
              try {
                const locationDoc = await item.ItemLoc.get();
                if (locationDoc.exists()) {
                  locationName = locationDoc.data().LocName || locationName;
                }
              } catch (e) {
                console.error("Error loading location", e);
              }

              return {
                id: item.id,
                name: item.ItemName,
                location: locationName,
                date: item.ItemTime?.toDate?.()?.toLocaleDateString() || "",
                description: item.ItemDesc || "",
                color: "bg-indigo-200",
                orgId, // Include orgId for ClaimButton
              };
            })
          );

          allItemsList.push(...displayItems);
        }

        if (cancelled) return;
        setAllItems(allItemsList);

        // Store first org ID if available
        if (userOrgs.length > 0 && typeof window !== "undefined") {
          localStorage.setItem("currentOrgId", userOrgs[0].orgId);
        }
      } catch (e) {
        console.error("Failed to load items", e);
      }
    };

    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        router.replace("/");
        return;
      }
      loadItems();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [router]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allItems;
    const fuse = new Fuse(allItems, { keys: ["name", "location"], threshold: 0.4 });
    return fuse.search(searchQuery).map((result) => result.item);
  }, [searchQuery, allItems]);

  return (
    <div className="min-h-screen bg-[#AEC0F3] flex flex-col font-sans">
      {/* --- HEADER --- */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex gap-6 text-black">
          <Link href="/">
            <Home className="w-8 h-8 cursor-pointer hover:text-indigo-700 transition" />
          </Link>
          <Link href="/forms">
            <Info className="w-8 h-8 cursor-pointer hover:text-indigo-700 transition" />
          </Link>
        </div>

        <h1 className="text-3xl font-extrabold text-[#1E1B4B]">ReunItems</h1>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 px-6 pb-6 max-w-6xl mx-auto w-full flex flex-col">
        {/* SEARCH BAR */}
        <div className="w-full my-6">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for your item (e.g. 'botle')"
              className="w-full p-4 pl-6 rounded-2xl text-2xl text-gray-600 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-300 placeholder:text-gray-300 bg-white"
            />
          </div>
        </div>

        {/* --- GRID --- */}
        <div className="flex-1 overflow-y-auto pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 group cursor-pointer hover:scale-[1.02] transition-transform">
                {/* Image Placeholder (CLICKABLE) */}
                <div
                  onClick={() => setSelectedItem(item)}
                  className={`aspect-square w-full rounded-[2rem] shadow-md overflow-hidden bg-white flex items-center justify-center relative`}
                >
                  <div className={`w-3/4 h-3/4 rounded-xl ${item.color || "bg-indigo-200"} opacity-80`} />
                  <div className="absolute bottom-3 left-0 right-0 text-center px-2">
                    <span className="bg-white/80 px-2 py-1 rounded-lg text-xs font-bold text-gray-700">
                      {item.location}
                    </span>
                  </div>
                </div>

                <p className="text-center font-bold text-[#1E1B4B] text-lg">{item.name}</p>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-20 text-indigo-900/50 text-xl font-bold">
                {searchQuery ? `No items found matching "${searchQuery}"` : "No items found"}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-[#1E1B4B] text-white p-4 text-xs font-medium flex justify-between items-center mt-auto">
        <span>2025 Branham High School . reunitems@gmail.com</span>
        <span>XXX-XXX-XXXX</span>
      </footer>

      {/* --- ITEM DETAIL MODAL --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          {/* The White Card */}
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 p-2 rounded-full transition z-10"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>

            {/* Top Half: Image */}
            <div className={`h-64 ${selectedItem.color || "bg-indigo-200"} flex items-center justify-center relative`}>
              <div className="w-32 h-32 bg-white/30 rounded-2xl backdrop-blur-md border border-white/40 flex items-center justify-center">
                <Tag className="w-16 h-16 text-white opacity-80" />
              </div>
              <span className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-lg text-sm font-bold text-[#1E1B4B] shadow-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                {selectedItem.location}
              </span>
            </div>

            {/* Bottom Half: Details */}
            <div className="p-8 flex flex-col gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-[#1E1B4B] leading-tight">{selectedItem.name}</h2>
                <p className="text-gray-400 text-sm font-medium flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  Found on {selectedItem.date || "Unknown Date"}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedItem.description || "No description provided."}
                </p>
              </div>

              {/* Claim button + Close */}
              <div className="flex gap-3">
                <ClaimButton item={selectedItem} />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 bg-[#1E1B4B] text-white font-bold py-3 rounded-xl hover:bg-indigo-900 transition mt-2 shadow-lg"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
