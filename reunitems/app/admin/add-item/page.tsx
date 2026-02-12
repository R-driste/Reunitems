"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Upload } from "lucide-react";

export default function AddItemPage() {
  const router = useRouter();
  
  // 1. References & State for the Image
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 2. State for the rest of the form data (Time and Category removed)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    date: "",
    description: ""
  });

  // --- HANDLERS ---

  // Trigger the hidden file input when the gray box is clicked
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Read the selected file and create a preview URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  // Update text fields as the user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle the final Upload button click
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Create the new item object
    const newItem = {
      id: Date.now(), // Uses current time as a unique ID
      name: formData.name,
      location: formData.location,
      date: formData.date,
      color: "bg-indigo-200", // Default color for new items
    };

    // 2. Get existing items from memory (or start with empty list)
    const existingData = localStorage.getItem("inventory");
    const currentInventory = existingData ? JSON.parse(existingData) : [];

    // 3. Add new item to the list
    const updatedInventory = [...currentInventory, newItem];

    // 4. Save back to memory
    localStorage.setItem("inventory", JSON.stringify(updatedInventory));
    
    alert(`Item "${formData.name}" added to inventory!`);
    
    // 5. Redirect
    router.push("/admin/dashboard");
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
                        <input 
                            type="text" 
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-[#D9D9D9] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#1E1B4B]" 
                        />
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
                    className="w-full bg-[#1E1B4B] hover:bg-indigo-900 text-white text-xl font-bold py-4 rounded-2xl shadow-md transition-transform hover:-translate-y-1 mt-4 flex items-center justify-center gap-3 cursor-pointer"
                >
                    <Upload className="w-6 h-6" />
                    UPLOAD ITEM
                </button>

            </div>
        </form>
      </main>
    </div>
  );
}