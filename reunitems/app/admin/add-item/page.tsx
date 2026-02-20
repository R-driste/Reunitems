"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { doc } from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebaseClient";
import {
  getUserOrganizations,
  getLocations,
  addItem,
  type Location,
} from "@/lib/firebaseHelpers";

export default function AddItemPage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    description: "",
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

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

        // Load locations from Organizations/{orgId}/Locations
        const loaded = await getLocations(currentOrgId);

        if (cancelled) return;

        setLocations(loaded);
      } catch (e) {
        console.error("Failed to load add-item data", e);
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      // TODO: Upload to Firebase Storage and get URL
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !orgId) return;

    const user = firebaseAuth.currentUser;
    if (!user) {
      alert("Please sign in again.");
      return;
    }

    if (!selectedLocationId) {
      alert("Please choose a location for this item.");
      return;
    }

    const location = locations.find((l) => l.id === selectedLocationId);
    if (!location) {
      alert("Selected location not found.");
      return;
    }

    try {
      setSubmitting(true);

      // Create item in Organizations/{orgId}/Items
      await addItem(orgId, {
        ItemName: formData.name,
        ItemDesc: formData.description,
        ItemLoc: doc(firebaseDb, "Organizations", orgId, "Locations", location.id),
        ItemImg: imagePreview || undefined,
        ItemTime: formData.date ? new Date(formData.date) : new Date(),
      });

      alert(`Item "${formData.name}" added to inventory!`);
      router.push("/admin/dashboard");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Could not add item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#AEC0F3] flex flex-col font-sans">
      {/* --- HEADER --- */}
      <header className="px-6 py-4 flex items-center bg-[#8B9AF0] text-[#1E1B4B]">
        <Link href="/admin/dashboard" className="mr-4 hover:scale-110 transition-transform">
          <ArrowLeft className="w-8 h-8" />
        </Link>
        <h1 className="text-2xl font-extrabold">Add New Item</h1>
      </header>

      {/* --- MAIN FORM CONTENT --- */}
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full flex items-center justify-center">
        {loading ? (
          <div className="text-xl font-semibold text-[#1E1B4B]">
            Loading locations for your campus...
          </div>
        ) : locations.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-xl">
            <p className="text-lg text-gray-700 mb-4">
              You haven't added any locations for your campus yet.
            </p>
            <p className="text-gray-600 mb-6">
              Go to the Locations page to plot lost &amp; found spots on your campus map, then
              come back here to add items to those locations.
            </p>
            <Link
              href="/admin/locations"
              className="inline-flex items-center justify-center bg-[#1E1B4B] text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-900 transition"
            >
              Go to Locations
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white w-full rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
            {/* --- LEFT SIDE: IMAGE UPLOAD --- */}
            <div
              className="w-full md:w-5/12 bg-[#D9D9D9] p-8 flex flex-col items-center justify-center min-h-[300px] cursor-pointer hover:bg-gray-300 transition group relative overflow-hidden"
              onClick={handleImageClick}
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="bg-[#B3B3B3] rounded-full p-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Plus className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* --- RIGHT SIDE: FORM FIELDS --- */}
            <div className="w-full md:w-7/12 p-8 flex flex-col gap-5 bg-white">
              {/* Item Name */}
              <div>
                <label className="block text-xl font-bold text-black mb-2">Item Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#D9D9D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1E1B4B]"
                />
              </div>

              {/* Location and Date Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xl font-bold text-black mb-2">Location Found</label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    required
                    className="w-full bg-[#D9D9D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1E1B4B]"
                  >
                    <option value="">Select a campus location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.LocName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xl font-bold text-black mb-2">Date Found</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#D9D9D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1E1B4B]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xl font-bold text-black mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full bg-[#D9D9D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1E1B4B] resize-none"
                />
              </div>

              {/* UPLOAD BUTTON */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1E1B4B] hover:bg-indigo-900 text-white text-xl font-bold py-4 rounded-2xl shadow-md transition-transform hover:-translate-y-1 mt-4 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
              >
                <Upload className="w-6 h-6" />
                {submitting ? "UPLOADING..." : "UPLOAD ITEM"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
