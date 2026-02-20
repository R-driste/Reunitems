"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Plus, MoreVertical, LogOut, Trash2, Edit, X, Calendar, MapPin, Tag } from "lucide-react";
import Link from "next/link";
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";
import {
  getUserOrganizations,
  getItems,
  deleteItem,
  updateItem,
  type Item,
} from "@/lib/firebaseHelpers";

// Display-friendly Item type
type DisplayItem = {
  id: string;
  name: string;
  location: string;
  date: string;
  description: string;
  color?: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [allItems, setAllItems] = useState<DisplayItem[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<DisplayItem | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const user = firebaseAuth.currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        // Get user's organizations and find admin org
        const userOrgs = await getUserOrganizations(user.uid);
        const adminOrg = userOrgs.find((uo) => uo.member.UserRole === "admin");

        if (!adminOrg) {
          router.replace("/");
          return;
        }

        const currentOrgId = adminOrg.orgId;
        setOrgId(currentOrgId);

        if (typeof window !== "undefined") {
          localStorage.setItem("currentOrgId", currentOrgId);
        }

        // Load items from Organizations/{orgId}/Items
        const items: Item[] = await getItems(currentOrgId);

        if (cancelled) return;

        // Convert to display format
        const displayItems: DisplayItem[] = await Promise.all(
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
              color: "bg-indigo-200", // Default color
            };
          })
        );

        setAllItems(displayItems);
      } catch (e) {
        console.error("Failed to load admin data", e);
      } finally {
        setLoading(false);
      }
    };

    const unsub = onAuthStateChanged(firebaseAuth, () => {
      load();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [router]);

  const handleDelete = async (idToDelete: string) => {
    if (!orgId) return;
    if (!confirm("Are you sure you want to remove this item?")) return;
    try {
      await deleteItem(orgId, idToDelete);
      setAllItems((prev) => prev.filter((item) => item.id !== idToDelete));
      setActiveMenuId(null);
    } catch (e) {
      console.error("delete item error", e);
      alert("Could not delete item.");
    }
  };

  const handleEdit = async (idToEdit: string) => {
    if (!orgId) return;
    const item = allItems.find((i) => i.id === idToEdit);
    if (!item) return;
    const newName = prompt("Edit Item Name:", item.name);
    if (!newName) return;
    try {
      await updateItem(orgId, idToEdit, { ItemName: newName });
      setAllItems((prev) =>
        prev.map((i) => (i.id === idToEdit ? { ...i, name: newName } : i))
      );
      setActiveMenuId(null);
    } catch (e) {
      console.error("edit item error", e);
      alert("Could not update item name.");
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allItems;
    const fuse = new Fuse(allItems, { keys: ["name", "location"], threshold: 0.4 });
    return fuse.search(searchQuery).map((result) => result.item);
  }, [searchQuery, allItems]);

  const handleLogout = async () => {
    try {
      router.replace("/");
    } catch (e) {}
    try {
      window.location.replace("/");
    } catch (e) {}
    try {
      await signOut(firebaseAuth);
    } catch (e) {
      console.error("Admin signOut error", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#AEC0F3] flex items-center justify-center">
        <div className="text-xl font-semibold text-[#1E1B4B]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#AEC0F3] flex flex-col font-sans" onClick={() => setActiveMenuId(null)}>
      {/* --- HEADER --- */}
      <header className="px-6 py-4 flex items-center justify-between bg-[#8B9AF0]">
        <h1 className="text-2xl font-extrabold text-[#1E1B4B]">Admin Dashboard</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 text-white hover:text-[#1E1B4B] transition">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-bold">Logout</span>
        </button>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 px-6 pb-6 max-w-6xl mx-auto w-full flex flex-col">
        {/* SEARCH BAR */}
        <div className="w-full my-6 relative" onClick={(e) => e.stopPropagation()}>
          <Search className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory..."
            className="w-full p-4 pl-12 rounded-2xl text-xl text-gray-600 shadow-sm focus:outline-none bg-white"
          />
        </div>

        {/* --- GRID --- */}
        <div className="flex-1 overflow-y-auto pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* ADD ITEM BUTTON */}
            <Link href="/admin/add-item" className="flex flex-col gap-2 group cursor-pointer">
              <div className="aspect-square w-full rounded-[2rem] shadow-sm border-4 border-dashed border-indigo-300 bg-white/30 flex flex-col items-center justify-center hover:bg-white/50 transition-all group-hover:scale-105">
                <Plus className="w-16 h-16 text-[#1E1B4B] opacity-70" />
                <span className="text-[#1E1B4B] font-bold text-lg">Insert New Item</span>
              </div>
            </Link>

            {/* LOCATIONS BUTTON */}
            <Link href="/admin/locations" className="flex flex-col gap-2 group cursor-pointer">
              <div className="aspect-square w-full rounded-[2rem] shadow-sm border-4 border-dashed border-green-300 bg-white/30 flex flex-col items-center justify-center hover:bg-white/50 transition-all group-hover:scale-105">
                <MapPin className="w-16 h-16 text-green-600 opacity-70" />
                <span className="text-green-700 font-bold text-lg">Manage Locations</span>
              </div>
            </Link>

            {/* ITEMS */}
            {filteredItems.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 relative group" onClick={(e) => e.stopPropagation()}>
                {/* 3 DOTS MENU */}
                <button
                  onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                  className="absolute top-3 left-3 z-20 bg-white/90 p-1.5 rounded-full hover:bg-white transition shadow-md cursor-pointer"
                >
                  <MoreVertical className="w-5 h-5 text-gray-700" />
                </button>

                {/* POPUP MENU */}
                {activeMenuId === item.id && (
                  <div className="absolute top-10 left-3 z-30 bg-white rounded-xl shadow-xl overflow-hidden min-w-[120px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={() => handleEdit(item.id)} className="px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-indigo-50 flex items-center gap-2">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                )}

                {/* ITEM IMAGE (CLICKABLE) */}
                <div
                  onClick={() => setSelectedItem(item)}
                  className={`aspect-square w-full rounded-[2rem] shadow-md overflow-hidden bg-white flex items-center justify-center relative cursor-pointer hover:scale-[1.02] transition-transform`}
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
          </div>
        </div>
      </main>

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

              {/* Action Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full bg-[#1E1B4B] text-white font-bold py-3 rounded-xl hover:bg-indigo-900 transition mt-2 shadow-lg"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
