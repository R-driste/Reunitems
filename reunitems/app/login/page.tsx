"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebaseClient";
import {
  createOrUpdateUser,
  getUserOrganizations,
  addMember,
} from "@/lib/firebaseHelpers";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "student" | null>(null);
  const [orgName, setOrgName] = useState("");

  const signIn = async () => {
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = cred.user;
      if (!user) {
        alert("Unable to sign in. Please try again.");
        return;
      }

      // Create/update user in Users collection
      await createOrUpdateUser(user.uid, {
        UserEmail: user.email || "",
        UserName: user.displayName || user.email || undefined,
      });

      // Get user's organizations
      const userOrgs = await getUserOrganizations(user.uid);
      const adminOrg = userOrgs.find((uo) => uo.member.UserRole === "admin");

      if (role === "admin") {
        if (adminOrg) {
          // Remember current organization for admin flows
          if (typeof window !== "undefined") {
            localStorage.setItem("currentOrgId", adminOrg.orgId);
          }
          router.replace("/admin/dashboard");
        } else {
          // First-time admin login - create organization and member
          if (!orgName) {
            alert("Please provide an organization name to create your admin account.");
            return;
          }

          try {
            // Create an organization document
            const orgRef = await addDoc(collection(firebaseDb, "Organizations"), {
              name: orgName,
              createdAt: serverTimestamp(),
            });

            // Create member for this admin in Organizations/Members subcollection
            await addMember(orgRef.id, {
              UserRef: doc(firebaseDb, "Users", user.uid),
              UserRole: "admin",
              ApplicationStatus: "approved",
            });

            if (typeof window !== "undefined") {
              localStorage.setItem("currentOrgId", orgRef.id);
            }

            alert("Admin organization created successfully!");
            router.replace("/admin/dashboard");
          } catch (err: any) {
            console.error(err);
            alert("Could not create organization or member: " + (err?.message || String(err)));
          }
        }
      } else {
        // Regular user - find their organization or show item search
        if (userOrgs.length > 0) {
          if (typeof window !== "undefined") {
            localStorage.setItem("currentOrgId", userOrgs[0].orgId);
          }
        }
        router.replace("/itemsearch");
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Failed to sign in.");
    }
  };

  const signUp = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = cred.user;

      // Create user in Users collection
      await createOrUpdateUser(user.uid, {
        UserEmail: user.email || "",
        UserName: user.displayName || user.email || undefined,
      });

      if (role === "admin") {
        alert("Sign up successful! After confirming your email, sign in and we'll set up your admin account.");
      } else {
        alert("Sign up successful! You can now sign in to start searching for items.");
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Failed to sign up.");
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(firebaseAuth, provider);
      const user = cred.user;
      if (!user) return;

      // Create/update user in Users collection
      await createOrUpdateUser(user.uid, {
        UserEmail: user.email || "",
        UserName: user.displayName || user.email || undefined,
      });

      // Get user's organizations
      const userOrgs = await getUserOrganizations(user.uid);
      const adminOrg = userOrgs.find((uo) => uo.member.UserRole === "admin");

      if (role === "admin") {
        if (adminOrg) {
          if (typeof window !== "undefined") {
            localStorage.setItem("currentOrgId", adminOrg.orgId);
          }
          router.replace("/admin/dashboard");
        } else {
          // Admin will need to create organization on first login
          router.replace("/admin/dashboard");
        }
      } else {
        if (userOrgs.length > 0) {
          if (typeof window !== "undefined") {
            localStorage.setItem("currentOrgId", userOrgs[0].orgId);
          }
        }
        router.replace("/itemsearch");
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Google sign-in failed.");
    }
  };

  if (role === null) {
    return (
      <div className="min-h-screen bg-[#AEC0F3] flex flex-col font-sans">
        <header className="p-6 flex justify-between items-center w-full max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2 text-[#1E1B4B] hover:text-white transition group">
            <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-lg">Back to Home</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-[#1E1B4B]">ReunItems</h1>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 pb-20">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-[#1E1B4B] mb-4">Welcome!</h2>
            <p className="text-gray-500 mb-8">Select your role to continue</p>
            <div className="flex gap-6 justify-center">
              <button onClick={() => setRole("student")} className="bg-blue-50 p-6 rounded-2xl shadow-sm w-44">I am a Student</button>
              <button onClick={() => setRole("admin")} className="bg-indigo-50 p-6 rounded-2xl shadow-sm w-44">I am an Admin</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#AEC0F3] flex flex-col font-sans">
      <header className="p-6 flex justify-between items-center w-full max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#1E1B4B] hover:text-white transition group">
          <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-lg">Back to Home</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-[#1E1B4B]">ReunItems</h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-[#1E1B4B] mb-4">{role === "admin" ? "Admin Login" : "Student Login"}</h2>

          <div className="flex flex-col gap-4 mt-6">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="p-3 rounded-xl border" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="p-3 rounded-xl border" />
            {role === "admin" && (
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization Name" className="p-3 rounded-xl border" />
            )}
            <div className="flex gap-3">
              <button onClick={signIn} className="flex-1 bg-[#1E1B4B] text-white py-3 rounded-xl">Sign in</button>
              <button onClick={signUp} className="flex-1 bg-blue-500 text-white py-3 rounded-xl">Sign up</button>
            </div>
            <button onClick={signInWithGoogle} className="mt-2 underline text-sm">Sign in with Google</button>
            <button onClick={() => setRole(null)} className="text-sm text-gray-500 mt-4">Back</button>
          </div>
        </div>
      </main>
    </div>
  );
}
