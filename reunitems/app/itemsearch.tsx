import { Home, Info, PenTool, Plus } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
  // Just a placeholder list to make the grid show up 12 times
  const items = Array.from({ length: 12 });

  return (
    <div className="min-h-screen bg-blue-200 flex flex-col font-sans">
      {/* --- HEADER --- */}
      <header className="bg-blue-300 p-4 flex items-center justify-between">
        {/* Left Icons */}
        <div className="flex gap-6 text-black">
          <Link href="/">
            <Home className="w-8 h-8 cursor-pointer" />
          </Link>
          <Info className="w-8 h-8 cursor-pointer" />
          <PenTool className="w-8 h-8 cursor-pointer" />
        </div>
        
        {/* Right Title */}
        <h1 className="text-2xl font-bold text-indigo-900">ReunItems</h1>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        
        {/* Search Bar and Add Button Area */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search for your item"
            className="w-full md:w-1/2 p-4 rounded-xl text-xl text-gray-500 shadow-sm focus:outline-none"
          />

          {/* Add Item Button (The Big Plus) */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-black hidden md:block">
              Add<br />Item
            </span>
            <button className="bg-indigo-950 text-white rounded-full p-2 shadow-lg hover:bg-indigo-800 transition">
              <Plus className="w-12 h-12" />
            </button>
            <span className="text-sm font-bold text-black md:hidden">
              Add Item
            </span>
          </div>
        </div>

        {/* --- THE GRID --- */}
        {/* 'grid-cols-2' means 2 columns on mobile. 
            'md:grid-cols-4' means 4 columns on desktop screens. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((_, index) => (
            <div
              key={index}
              className="aspect-square bg-white rounded-3xl shadow-md hover:scale-105 transition-transform"
            >
              {/* This empty div represents your white item cards */}
            </div>
          ))}
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-indigo-950 text-white p-3 text-xs flex justify-between items-center">
        <span>2025 Branham High School . reunitems@gmail.com</span>
        <span>XXX-XXX-XXXX</span>
      </footer>
    </div>
  );
}
