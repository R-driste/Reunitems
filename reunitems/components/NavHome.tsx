"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // A function to check the memory
    const checkLoginStatus = () => {
      const status = localStorage.getItem("isLoggedIn");
      console.log("Memory Check! isLoggedIn =", status); // prints to developer console
      setIsLoggedIn(status === "true");
    };

    // 1. Run immediately when you visit the Home page
    checkLoginStatus();

    // 2. Listen for changes in the background
    window.addEventListener("storage", checkLoginStatus);
    
    // Cleanup
    return () => window.removeEventListener("storage", checkLoginStatus);
  }, []);

  const handleLogout = () => {
    // 1. Delete the notes from the browser's memory
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    
    // 2. Instantly update the page to hide the tabs
    setIsLoggedIn(false); 
  };



  return (
    <nav className="bg-brand-navy sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-white">
              <Image src="/assets/Logo.png" alt="Logo" width={70} height={70}/>
            </Link>
          </div>

          <div className="flex gap-8">
            <Link href="/" className="text-white hover:text-gray-200">
              Home
            </Link>
            <Link href="/about" className="text-white hover:text-gray-200">
              About
            </Link>
            <Link href="/contact" className="text-white hover:text-gray-200">
              Contact
            </Link>
            {isLoggedIn && (
           <>
              <Link 
                href="/itemsearch" 
                className="text-white hover:text-gray-300 transition-colors"
              >
                Search for Your Items
              </Link>
              
              <Link 
                href="/forms" 
                className="text-white hover:text-gray-300 transition-colors"
              >
                Report/Claim Forms
              </Link>

              <button 
                onClick={handleLogout} 
                className="text-red-300 hover:text-red-400 font-bold transition-colors cursor-pointer ml-4"
              >
                Logout
              </button>
              
           </>
        )}

          </div>

          <div>
            <Link
              href="/schoolfind"
              className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Find Your School
            </Link>
            <Link
              href="/login"
              className="bg-white text-black px-4 py-2 ml-10 rounded-lg hover:bg-gray-200"
            >
              Log In/Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
