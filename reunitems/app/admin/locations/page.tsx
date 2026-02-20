"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Trash2, Edit, X } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { GeoPoint } from "firebase/firestore";
import { firebaseAuth } from "@/lib/firebaseClient";
import "leaflet/dist/leaflet.css";
import {
  getUserOrganizations,
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation,
  type Location,
} from "@/lib/firebaseHelpers";
import dynamic from "next/dynamic";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const MapClickHandler = dynamic(() => import("@/components/MapClickHandler").then((mod) => mod.default), {
  ssr: false,
});

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: "", desc: "", lat: 0, lng: 0 });
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.3382, -121.8863]); // Default to San Jose area

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const user = firebaseAuth.currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const userOrgs = await getUserOrganizations(user.uid);
        const adminOrg = userOrgs.find((uo) => uo.member.UserRole === "admin");

        if (!adminOrg) {
          router.replace("/");
          return;
        }

        const currentOrgId = adminOrg.orgId;
        setOrgId(currentOrgId);

        const loaded = await getLocations(currentOrgId);

        if (cancelled) return;

        setLocations(loaded);

        // Set map center to first location or default
        if (loaded.length > 0) {
          const firstLoc = loaded[0];
          setMapCenter([firstLoc.LocPoint.latitude, firstLoc.LocPoint.longitude]);
        }
      } catch (e) {
        console.error("Failed to load locations", e);
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

  const handleMapClick = (lat: number, lng: number) => {
    setNewLocation({ ...newLocation, lat, lng });
    setShowAddModal(true);
  };

  const handleAddLocation = async () => {
    if (!orgId || !newLocation.name || !newLocation.lat || !newLocation.lng) {
      alert("Please provide a name and click on the map to set location.");
      return;
    }

    try {
      await addLocation(orgId, {
        LocName: newLocation.name,
        LocDesc: newLocation.desc,
        LocPoint: new GeoPoint(newLocation.lat, newLocation.lng),
      });

      // Reload locations
      const loaded = await getLocations(orgId);
      setLocations(loaded);
      setShowAddModal(false);
      setNewLocation({ name: "", desc: "", lat: 0, lng: 0 });
      alert("Location added successfully!");
    } catch (e) {
      console.error("Error adding location", e);
      alert("Could not add location.");
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!orgId) return;
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      await deleteLocation(orgId, locationId);
      const loaded = await getLocations(orgId);
      setLocations(loaded);
      alert("Location deleted successfully!");
    } catch (e) {
      console.error("Error deleting location", e);
      alert("Could not delete location.");
    }
  };

  const handleEditLocation = async () => {
    if (!orgId || !editingLocation) return;

    try {
      await updateLocation(orgId, editingLocation.id, {
        LocName: editingLocation.LocName,
        LocDesc: editingLocation.LocDesc,
      });
      const loaded = await getLocations(orgId);
      setLocations(loaded);
      setEditingLocation(null);
      alert("Location updated successfully!");
    } catch (e) {
      console.error("Error updating location", e);
      alert("Could not update location.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#AEC0F3] flex items-center justify-center">
        <div className="text-xl font-semibold text-[#1E1B4B]">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#AEC0F3] flex flex-col font-sans">
      {/* --- HEADER --- */}
      <header className="px-6 py-4 flex items-center bg-[#8B9AF0] text-[#1E1B4B]">
        <Link href="/admin/dashboard" className="mr-4 hover:scale-110 transition-transform">
          <ArrowLeft className="w-8 h-8" />
        </Link>
        <h1 className="text-2xl font-extrabold">Manage Campus Locations</h1>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-[#1E1B4B] mb-4">
            Click on the map to add a new location
          </h2>
          <div className="h-[500px] w-full rounded-2xl overflow-hidden border-2 border-gray-300">
            {typeof window !== "undefined" && (
              <MapContainer
                center={mapCenter}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {locations.map((loc) => (
                  <Marker
                    key={loc.id}
                    position={[loc.LocPoint.latitude, loc.LocPoint.longitude]}
                  >
                    <Popup>
                      <div className="text-center">
                        <h3 className="font-bold">{loc.LocName}</h3>
                        {loc.LocDesc && <p className="text-sm text-gray-600">{loc.LocDesc}</p>}
                        <button
                          onClick={() => setEditingLocation(loc)}
                          className="mt-2 text-blue-600 text-sm hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                <MapClickHandler onMapClick={handleMapClick} />
              </MapContainer>
            )}
          </div>
        </div>

        {/* Locations List */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-[#1E1B4B] mb-4">Existing Locations</h2>
          {locations.length === 0 ? (
            <p className="text-gray-500">No locations added yet. Click on the map above to add one.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="border rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div>
                    <h3 className="font-bold text-lg">{loc.LocName}</h3>
                    {loc.LocDesc && <p className="text-sm text-gray-600">{loc.LocDesc}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {loc.LocPoint.latitude.toFixed(6)}, {loc.LocPoint.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingLocation(loc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-[#1E1B4B]">Add Location</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Location name (e.g., 'Main Entrance', 'Gym')"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                className="p-3 rounded-xl border"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={newLocation.desc}
                onChange={(e) => setNewLocation({ ...newLocation, desc: e.target.value })}
                className="p-3 rounded-xl border min-h-[80px]"
              />
              <p className="text-sm text-gray-600">
                Coordinates: {newLocation.lat.toFixed(6)}, {newLocation.lng.toFixed(6)}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleAddLocation}
                  className="flex-1 bg-[#1E1B4B] text-white py-3 rounded-xl font-bold hover:bg-indigo-900 transition"
                >
                  Add Location
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {editingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-[#1E1B4B]">Edit Location</h3>
              <button onClick={() => setEditingLocation(null)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Location name"
                value={editingLocation.LocName}
                onChange={(e) =>
                  setEditingLocation({ ...editingLocation, LocName: e.target.value })
                }
                className="p-3 rounded-xl border"
                required
              />
              <textarea
                placeholder="Description"
                value={editingLocation.LocDesc || ""}
                onChange={(e) =>
                  setEditingLocation({ ...editingLocation, LocDesc: e.target.value })
                }
                className="p-3 rounded-xl border min-h-[80px]"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleEditLocation}
                  className="flex-1 bg-[#1E1B4B] text-white py-3 rounded-xl font-bold hover:bg-indigo-900 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingLocation(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
