"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Mail, Lock, School, User, ShieldCheck, GraduationCap, Hash } from "lucide-react";

export default function LoginPage() {

  const router = useRouter();
  
  // 'role' state: null = showing selection screen. 'admin' or 'student' = showing respective forms.
  const [role, setRole] = useState<'admin' | 'student' | null>(null);
  // Toggle between Login/Signup for the selected form
  const [isLoginState, setIsLoginState] = useState(true); 

  // Switch roles and reset back to the "Login" tab by default
  const handleRoleSelect = (selectedRole: 'admin' | 'student') => {
    setRole(selectedRole);
    setIsLoginState(true);
  };

  // Simulate Admin Login
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("isLoggedIn", "true"); 
    localStorage.setItem("userRole", "admin");
    
    // Use window.location.href for a hard redirect to refresh the app's memory
    window.location.href = "/admin/dashboard"; 
  };

  // Simulate Student Login
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", "student");
    
    window.location.href = "/itemsearch"; 
  };

  // 1. Create a state to track if the user is logged in (default is false)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 2. When the page loads, check the browser's memory
    useEffect(() => {
      const status = localStorage.getItem("isLoggedIn");
      if (status === "true") {
        setIsLoggedIn(true);
      }
    }, []);

  return (
    <div className="min-h-screen bg-[#AEC0F3] flex flex-col font-sans">
      
      {/* --- HEADER --- */}
      <header className="p-6 flex justify-between items-center w-full max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#1E1B4B] hover:text-white transition group">
          <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-lg">Back to Home</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-[#1E1B4B]">ReunItems</h1>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex items-center justify-center px-4 pb-20">
        
        {/* --- VIEW 1: ROLE SELECTION SCREEN --- */}
        {role === null && (
           <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-8 md:p-12 text-center animate-in fade-in zoom-in-95 duration-300">
             <h2 className="text-3xl font-bold text-[#1E1B4B] mb-4">Welcome!</h2>
             <p className="text-gray-500 mb-10 text-lg">Please select your role to continue.</p>
             
             <div className="flex flex-col md:flex-row gap-6 justify-center">
                {/* Student Button */}
                <button onClick={() => handleRoleSelect('student')} className="flex-1 bg-blue-50 border-2 border-blue-100 p-6 rounded-2xl hover:bg-blue-100 hover:border-blue-300 transition group flex flex-col items-center gap-4 shadow-sm">
                    <div className="bg-blue-200 p-4 rounded-full group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-10 h-10 text-[#1E1B4B]" />
                    </div>
                    <span className="text-xl font-bold text-[#1E1B4B]">I am a Student</span>
                    <span className="text-sm text-gray-500">Browse lost items and submit forms.</span>
                </button>

                {/* Admin Button */}
                <button onClick={() => handleRoleSelect('admin')} className="flex-1 bg-indigo-50 border-2 border-indigo-100 p-6 rounded-2xl hover:bg-indigo-100 hover:border-indigo-300 transition group flex flex-col items-center gap-4 shadow-sm">
                    <div className="bg-[#1E1B4B] p-4 rounded-full group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-xl font-bold text-[#1E1B4B]">I am an Admin</span>
                    <span className="text-sm text-gray-500">Manage school inventory and settings.</span>
                </button>
             </div>
           </div>
        )}

        {/* --- VIEW 2: ADMIN FORM --- */}
        {role === 'admin' && (
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative overflow-hidden animate-in slide-in-from-right-8 duration-300">
          <button onClick={() => setRole(null)} className="text-sm text-gray-400 hover:text-[#1E1B4B] mb-4 flex items-center gap-1 transition">← Back to role selection</button>
          <h2 className="text-3xl font-bold text-[#1E1B4B] mb-2 text-center">
            {isLoginState ? "Admin Login" : "Register School"}
          </h2>
          <p className="text-gray-500 text-center mb-8">
            {isLoginState ? "Enter credentials to manage inventory" : "Set up your campus lost & found"}
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleAdminSubmit}>
            {!isLoginState && (
              <div className="relative">
                <School className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="School Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" required />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input type="email" placeholder="Admin Email Address" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input type="password" placeholder="Password" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" required />
            </div>

            <button type="submit" className="w-full bg-[#1E1B4B] text-white font-bold rounded-xl py-4 mt-2 shadow-lg hover:bg-indigo-900 transition hover:-translate-y-1">
              {isLoginState ? "Log In to Dashboard" : "Create Admin Account"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            {isLoginState ? "Need to register a new school? " : "Already registered? "}
            <button onClick={() => setIsLoginState(!isLoginState)} className="font-bold text-indigo-600 hover:text-indigo-800 underline transition">
              {isLoginState ? "Sign Up" : "Log In"}
            </button>
          </div>
        </div>
        )}

        {/* --- VIEW 3: STUDENT FORM --- */}
        {role === 'student' && (
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative overflow-hidden animate-in slide-in-from-left-8 duration-300">
          <button onClick={() => setRole(null)} className="text-sm text-gray-400 hover:text-[#1E1B4B] mb-4 flex items-center gap-1 transition">← Back to role selection</button>
          <h2 className="text-3xl font-bold text-[#1E1B4B] mb-2 text-center">
            {isLoginState ? "Student Login" : "Create Student Account"}
          </h2>
          <p className="text-gray-500 text-center mb-8">
            {isLoginState ? "Log in to browse or claim items" : "Join your school's network"}
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleStudentSubmit}>
            {!isLoginState && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Full Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" required />
                </div>
                <div className="relative">
                  <Hash className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Student ID Number" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" required />
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input type="email" placeholder="Student Email Address" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input type="password" placeholder="Password" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" required />
            </div>

            <button type="submit" className="w-full bg-blue-500 text-white font-bold rounded-xl py-4 mt-2 shadow-lg hover:bg-blue-600 transition hover:-translate-y-1">
              {isLoginState ? "Log In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            {isLoginState ? "Don't have an account yet? " : "Already have an account? "}
            <button onClick={() => setIsLoginState(!isLoginState)} className="font-bold text-blue-500 hover:text-blue-700 underline transition">
              {isLoginState ? "Sign Up" : "Log In"}
            </button>
          </div>
        </div>
        )}

      </main>
    </div>
  );
}